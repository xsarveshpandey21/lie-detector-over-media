// Shared local fact-check matching logic with strict phrase matching and debunking word rejection
const factCheckData = require('../data/factChecks.json');

const DEBUNKING_PATTERNS = /\b(debunked|disproves|disproved|disprove|myth|false claim)\b/i;

/**
 * Searches local verified fact-check entries with strict phrase matching.
 * Requires:
 * - Text must NOT contain debunking indicators ('debunked', 'disproves', 'myth', 'false claim')
 * - At least 60% of an entry's phrases must be present in the text
 * - At least 3 distinct phrases must match
 *
 * @param {string} rawText
 * @returns {Array<object>} Matched fact check entries
 */
function matchLocalFactChecks(rawText) {
  const text = (rawText || '').trim();
  if (!text) return [];

  // Reject immediately if the text contains debunking words
  if (DEBUNKING_PATTERNS.test(text)) {
    return [];
  }

  const lowerText = text.toLowerCase();
  const matches = [];

  for (const entry of factCheckData) {
    const phrases = entry.phrases || [];
    if (phrases.length === 0) continue;

    let matchCount = 0;
    for (const phrase of phrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        matchCount++;
      }
    }

    const matchRatio = matchCount / phrases.length;
    // Require at least 60% of an entry's phrases present AND at least 3 distinct matches
    if (matchCount >= 3 && matchRatio >= 0.6) {
      matches.push({
        claim: entry.claim,
        publisher: entry.publisher,
        rating: entry.rating,
        url: entry.url,
        date: entry.date,
        verifiedOn: entry.verifiedOn || entry.date,
        isLocalRegistry: true,
        matchType: 'similar_claim',
        similarityNote: 'Similar claim previously fact-checked'
      });
    }
  }

  return matches;
}

module.exports = {
  matchLocalFactChecks,
  DEBUNKING_PATTERNS
};
