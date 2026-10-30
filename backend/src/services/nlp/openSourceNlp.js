// Open-source NLP credibility and feature extraction engine
const { matchLocalFactChecks } = require('../claimMatcher');

/**
 * Counts syllables in an English word using vowel cluster heuristics
 */
function countSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 1;
  if (clean.length <= 3) return 1;
  const syllableMatch = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syllableMatch ? Math.max(1, syllableMatch.length) : 1;
}

/**
 * Analyzes text using statistical NLP heuristics and verified fact-check lookup
 */
function analyzeTextNlp(text) {
  const cleanText = (text || '').trim();
  const sentences = cleanText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const sentenceCount = Math.max(1, sentences.length);
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const charCount = cleanText.length;

  // Syllables for Flesch-Kincaid
  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  // Flesch-Kincaid Reading Ease
  // Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / wordCount;
  let readingEase = Math.round(206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord));
  readingEase = Math.max(0, Math.min(100, readingEase));

  // Flesch-Kincaid Grade Level
  let gradeLevel = Math.round((0.39 * wordsPerSentence) + (11.8 * syllablesPerWord) - 15.59);
  gradeLevel = Math.max(1, Math.min(18, gradeLevel));

  // Lexical Diversity (Type-Token Ratio)
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const uniqueWords = new Set(lowerWords);
  const lexicalDiversity = Number((uniqueWords.size / Math.max(1, lowerWords.length)).toFixed(2));

  // Subjectivity & Opinion indicators
  const opinionRegex = /\b(i think|i believe|in my opinion|everyone knows|obviously|undeniably|clearly|we must|you should|you need to|no doubt|it is certain|everybody knows)\b/gi;
  const opinionMatches = (cleanText.match(opinionRegex) || []).length;
  const subjectivityIndex = Number(Math.min(1, opinionMatches / Math.max(1, sentenceCount)).toFixed(2));

  // Emotional Arousal / Shock words
  const emotionalRegex = /\b(shocking|horrific|terrifying|miracle|disaster|deadly|danger|crisis|furious|unbelievable|catastrophe|panic|apocalypse|nightmare|devastating)\b/gi;
  const emotionalMatches = (cleanText.match(emotionalRegex) || []).length;
  const emotionalIntensity = Number(Math.min(1, (emotionalMatches * 2) / Math.max(1, sentenceCount)).toFixed(2));

  // Sensational & Urgency patterns
  const sensationalRegex = /\b(they don'?t want you to know|secret truth|hidden conspiracy|cover-up|100% guaranteed|instant cure|banned everywhere|leaked secret|mind-blowing)\b/gi;
  const sensationalHits = (cleanText.match(sensationalRegex) || []).length;

  const urgencyRegex = /\b(share before deleted|forward to everyone|forward to all|must see|wake up sheeple|repost now|urgent warning|spread this everywhere)\b/gi;
  const urgencyHits = (cleanText.match(urgencyRegex) || []).length;

  // Clickbait score
  const exclamationCount = (cleanText.match(/!{2,}/g) || []).length;
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /^[A-Z]+$/.test(w)).length;
  const capsRatio = capsWords / wordCount;
  const clickbaitScore = Number(Math.min(1, (sensationalHits * 0.3) + (urgencyHits * 0.3) + (capsRatio * 0.25) + (exclamationCount * 0.15)).toFixed(2));

  // Objective Attribution markers
  const objectiveRegex = /\b(according to|study published in|peer-reviewed|researchers from|officials confirmed|reuters|associated press|department of|ministry of|spokesperson said|world health organization|clinical trial|official statistics|court ruling)\b/gi;
  const objectiveHits = (cleanText.match(objectiveRegex) || []).length;
  const sourceAttributionScore = Number(Math.min(1, objectiveHits * 0.35).toFixed(2));

  // Check Local Verified Fact-Check Knowledge Base using shared matcher
  const matchedFactChecks = matchLocalFactChecks(cleanText);

  // Calculate Base Score (0 - 100) from linguistic features
  let score = 65; // balanced baseline
  score -= clickbaitScore * 45;
  score -= emotionalIntensity * 20;
  score -= subjectivityIndex * 15;
  score += sourceAttributionScore * 30;

  score = Math.max(5, Math.min(95, Math.round(score)));

  // Calculate Label and Confidence from linguistic features
  // (Local registry match does NOT override verdict or set confidenceLevel to high)
  let label = 'uncertain';
  let confidenceLevel = 'low';

  if (clickbaitScore >= 0.4 || emotionalIntensity >= 0.5) {
    label = 'likely_false';
    confidenceLevel = clickbaitScore >= 0.6 ? 'medium' : 'low';
  } else if (sourceAttributionScore >= 0.5 && clickbaitScore <= 0.1) {
    label = 'likely_true';
    confidenceLevel = 'medium';
  } else if (wordCount >= 15 && clickbaitScore < 0.25) {
    label = 'likely_true';
    confidenceLevel = 'medium';
  } else {
    label = 'uncertain';
    confidenceLevel = wordCount < 8 ? 'low' : 'medium';
  }

  return {
    score,
    label,
    confidenceLevel,
    metrics: {
      sentenceCount,
      wordCount,
      charCount,
      readingEase,
      gradeLevel: `Grade ${gradeLevel}`,
      lexicalDiversity,
      subjectivityIndex,
      emotionalIntensity,
      clickbaitScore,
      sourceAttributionScore,
      sensationalHits,
      urgencyHits,
      objectiveHits
    },
    matchedFactChecks
  };
}

module.exports = {
  analyzeTextNlp,
  countSyllables
};
