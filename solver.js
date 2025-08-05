// solver.js — JavaScript версия твоего WordleSolver с загрузкой словарей из файлов и системой частотности

async function loadWordList(url) {
  const resp = await fetch(url);
  const text = await resp.text();
  return text.split(/\r?\n/).filter(w => w.length === 5).map(w => w.toUpperCase());
}

class WordleSolver {
  constructor(freqWords, junkWords, wordFrequencyRank) {
    this.freqWords = new Set(freqWords);
    this.junkWords = new Set(junkWords);
    this.wordFrequencyRank = wordFrequencyRank; // Map: word -> rank
    this.allWords = new Set([...this.freqWords, ...this.junkWords]);
    this.letterFrequency = this._calculateLetterFrequency();
    this.reset();
  }

  _calculateLetterFrequency() {
    const freq = {};
    let total = 0;
    for (let word of this.freqWords) {
      const weight = 1.0 / (1 + (this.wordFrequencyRank[word] || 10000) * 0.001);
      for (let letter of word) {
        freq[letter] = (freq[letter] || 0) + weight;
        total += weight;
      }
    }
    for (let word of this.junkWords) {
      for (let letter of word) {
        freq[letter] = (freq[letter] || 0) + 0.1;
        total += 0.1;
      }
    }
    for (let k in freq) freq[k] /= total;
    return freq;
  }

  getWordScore(word) {
    let score = 0;
    for (let letter of word) {
      score += this.letterFrequency[letter] || 0;
    }
    const uniqueLetters = new Set(word).size;
    score *= (uniqueLetters / 5);
    const vowels = new Set("АЕЁИОУЫЭЮЯ");
    let vowelCount = 0;
    for (let l of new Set(word)) if (vowels.has(l)) vowelCount++;
    score *= (1 + vowelCount * 0.1);
    if (this.wordFrequencyRank[word]) {
      const freqBonus = 1.0 / (1 + this.wordFrequencyRank[word] * 0.0001);
      score *= (1 + freqBonus * 2);
    } else if (!this.freqWords.has(word)) {
      score *= 0.3;
    }
    return score;
  }

  reset() {
    this.possibleWords = new Set(this.allWords);
    this.possibleFreqWords = new Set(this.freqWords);
  }

  getBestGuess(firstGuess = false) {
    const primaryCandidates = this.possibleFreqWords.size ? this.possibleFreqWords : this.possibleWords;
    if (!primaryCandidates.size) return "";

    let candidates = [...primaryCandidates];
    if (firstGuess) {
      candidates = candidates.slice(0, 100); // Ограничим для скорости
    }

    candidates.sort((a, b) => this.getWordScore(b) - this.getWordScore(a));
    return candidates[0] || "";
  }

  processFeedback(guess, feedback) {
    guess = guess.toUpperCase();
    const newPossible = new Set();
    const newFreq = new Set();

    for (let word of this.possibleWords) {
      if (this._matchesFeedback(word, guess, feedback)) {
        newPossible.add(word);
        if (this.freqWords.has(word)) newFreq.add(word);
      }
    }

    this.possibleWords = newPossible;
    this.possibleFreqWords = newFreq;
  }

  _matchesFeedback(word, guess, feedback) {
    for (let i = 0; i < 5; i++) {
      if (feedback[i] === 'З' && word[i] !== guess[i]) return false;
      if (feedback[i] === 'Ж') {
        if (word[i] === guess[i]) return false;
        if (!word.includes(guess[i])) return false;
      }
      if (feedback[i] === 'С' && word.includes(guess[i])) return false;
    }
    return true;
  }
}

// Инициализация при старте
(async () => {
  const freqList = await loadWordList('RussianFreq.txt');
  const junkList = await loadWordList('RussianJunk.txt');
  const rankMap = {};
  freqList.forEach((w, i) => { rankMap[w] = i + 1; });
  window.solver = new WordleSolver(freqList, junkList, rankMap);
})();
