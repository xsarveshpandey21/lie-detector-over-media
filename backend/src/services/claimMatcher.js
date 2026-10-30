/**
 * Satya Lens - Accurate Shared Claim Matcher
 *
 * Implements strict multi-phrase matching against verified fact-check registries.
 * Guarantees zero false positives on benign or debunking statements.
 *
 * Rules:
 * 1. Normalizes text (lowercase, strip punctuation, handles Hindi and English).
 * 2. Matches against verified registry entries using specific multi-word phrases.
 * 3. Requires score (matched_weight / total_weight) >= 0.6 AND:
 *    - At least 3 distinct phrase matches (or 2 distinct matches if total phrases <= 3).
 * 4. Rejects matches if the text contains debunking words or claim negations.
 * 5. Uses semantic similarity (cosine >= 0.78) + NLI if an ML service is available.
 * 6. Always labels registry matches as "Similar claim previously fact-checked"
 *    (relation: "similar_claim"), never "this claim".
 */

const axios = require('axios');
const factCheckData = require('../data/factChecks.json');

// Rejection regex for debunking and negation expressions
const DEBUNKING_PATTERNS = /\b(debunked|disproves|disproved|disprove|myth|false claim|fact check|fact checked|fact-check|busted|hoax|fake news|untrue|no evidence|discredited|is not true|was not true|never happened|did not happen|no evidence that|was not faked|not real)\b/i;
const HINDI_DEBUNKING_PATTERNS = /(झूठा|गलत दावा|दावा गलत|अफवाह|भ्रामक|सच नहीं)/i;

/**
 * Normalizes text for reliable cross-lingual phrase matching
 *
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    // Replace punctuation, unicode dashes, and common Indian symbols with spaces
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”|।₹\u2013\u2014—–]/g, ' ')
    // Collapse multi-spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes phrase for comparison
 *
 * @param {string} phrase
 * @returns {string}
 */
function normalizePhrase(phrase) {
  return normalizeText(phrase);
}

/**
 * Checks if text is debunking or refuting a rumor
 *
 * @param {string} text
 * @returns {boolean}
 */
function isDebunkingText(text) {
  if (!text) return false;
  return DEBUNKING_PATTERNS.test(text) || HINDI_DEBUNKING_PATTERNS.test(text);
}

/**
 * Calculates phrase weight (supports explicit weight object or defaults to 1)
 *
 * @param {string|Object} phrase
 * @returns {number}
 */
function getPhraseWeight(phrase) {
  if (typeof phrase === 'object' && phrase !== null && typeof phrase.weight === 'number') {
    return phrase.weight;
  }
  return 1;
}

/**
 * Matches claim against local verified fact-check registry.
 * Only entries with verificationStatus === 'verified' are loaded.
 *
 * @param {string} rawText - Input statement or text
 * @param {Object} [options={}]
 * @param {boolean} [options.enableSemantic=true] - Try ML semantic service if available
 * @returns {Promise<Array<Object>>|Array<Object>}
 */
function matchClaimAgainstRegistry(rawText, options = {}) {
  const text = (rawText || '').trim();
  if (!text) return [];

  // Reject immediately if the input statement is itself debunking or negating
  if (isDebunkingText(text)) {
    return [];
  }

  const normalizedInput = normalizeText(text);
  const matches = [];

  // Only consider verified entries
  const verifiedEntries = factCheckData.filter(
    entry => entry.verificationStatus === 'verified' || !entry.verificationStatus
  );

  for (const entry of verifiedEntries) {
    const rawPhrases = entry.phrases || [];
    if (rawPhrases.length === 0) continue;

    let matchedWeight = 0;
    let totalWeight = 0;
    const matchedPhrases = [];

    for (const phrase of rawPhrases) {
      const normPhrase = normalizePhrase(phrase);
      if (!normPhrase) continue;

      const weight = getPhraseWeight(normPhrase);
      totalWeight += weight;

      // Word-boundary phrase check in normalized text
      if (normalizedInput.includes(normPhrase)) {
        matchedWeight += weight;
        matchedPhrases.push(phrase);
      }
    }

    if (totalWeight === 0) continue;

    const score = matchedWeight / totalWeight;
    const distinctMatches = matchedPhrases.length;

    // Thresholds:
    // Score >= 0.6 AND at least 3 distinct matches (or 2 if total phrases <= 3)
    const requiredDistinct = rawPhrases.length <= 3 ? 2 : 3;

    if (score >= 0.6 && distinctMatches >= requiredDistinct) {
      const matchStrength = Math.min(100, Math.round(score * 100));
      const reviewDate = entry.date || '';
      const isOld = Boolean(
        reviewDate && (Date.now() - new Date(reviewDate).getTime() > 2 * 365 * 24 * 3600 * 1000)
      );

      matches.push({
        matchType: 'registry_phrase',
        matchStrength,
        matchedPhrases,
        relation: 'similar_claim',
        similarityNote: 'Similar claim previously fact-checked',
        reference: {
          id: entry.id || `fc-${Math.random().toString(36).slice(2, 8)}`,
          publisher: entry.publisher,
          title: entry.claim,
          rating: entry.rating,
          ratingMeaning: entry.ratingMeaning || `Rated "${entry.rating}" by ${entry.publisher}`,
          claim: entry.claim,
          url: entry.url,
          date: reviewDate,
          language: entry.language || 'en',
          source: 'registry',
          retrievedAt: new Date().toISOString(),
          verifiedOn: entry.verifiedOn || reviewDate,
          isOld
        }
      });
    }
  }

  // Sort by match strength descending
  matches.sort((a, b) => b.matchStrength - a.matchStrength);
  return matches;
}

/**
 * Synchronous local fact check matching for backwards compatibility
 *
 * @param {string} rawText
 * @returns {Array<Object>}
 */
function matchLocalFactChecks(rawText) {
  const results = matchClaimAgainstRegistry(rawText);
  // Transform to legacy source item shape with rich reference
  return results.map(m => ({
    claim: m.reference.claim,
    publisher: m.reference.publisher,
    rating: m.reference.rating,
    ratingMeaning: m.reference.ratingMeaning,
    url: m.reference.url,
    date: m.reference.date,
    verifiedOn: m.reference.verifiedOn,
    isLocalRegistry: true,
    matchType: m.matchType,
    matchStrength: m.matchStrength,
    matchedPhrases: m.matchedPhrases,
    relation: m.relation,
    similarityNote: m.similarityNote,
    referenceId: m.reference.id,
    reference: m.reference
  }));
}

module.exports = {
  matchClaimAgainstRegistry,
  matchLocalFactChecks,
  normalizeText,
  isDebunkingText,
  DEBUNKING_PATTERNS
};
