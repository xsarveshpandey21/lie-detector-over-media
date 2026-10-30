// Credibility calculation based strictly on real verifiable signals
const { normalizeLabel } = require('../utils/labels');

/**
 * Calculates a credibility assessment based on verified fact-checker ratings or verified domain registry.
 * If no real signals exist, returns null so the UI can hide the card cleanly.
 *
 * @param {Object} params
 * @param {Array} [params.factCheckItems] - Real fact check items from Google Fact Check API
 * @param {Object} [params.domainMeta] - Real domain metadata if URL
 * @returns {{ credibilityScore: number, rationale: string } | null}
 */
function scoreSources({ factCheckItems, domainMeta }) {
  // Signal 1: Published Fact-Check Ratings
  if (Array.isArray(factCheckItems) && factCheckItems.length > 0) {
    let trueCount = 0;
    let falseCount = 0;

    for (const item of factCheckItems) {
      const normalized = normalizeLabel(item.rating);
      if (normalized === 'true') trueCount++;
      if (normalized === 'false') falseCount++;
    }

    if (trueCount > falseCount) {
      return {
        credibilityScore: 88,
        rationale: 'Multiple published fact-checkers rated this claim as true or accurate.'
      };
    } else if (falseCount > trueCount) {
      return {
        credibilityScore: 15,
        rationale: 'Published fact-checkers rated this claim as false or misleading.'
      };
    } else {
      return {
        credibilityScore: 50,
        rationale: 'Published fact-checkers found mixed or contested claims.'
      };
    }
  }

  // Signal 2: Verified Domain Registry
  if (domainMeta?.isReputable) {
    return {
      credibilityScore: 90,
      rationale: 'Published on an established journalistic or institutional domain.'
    };
  }

  if (domainMeta?.isLowCred) {
    return {
      credibilityScore: 15,
      rationale: 'Domain has a documented history of satire, clickbait, or unverified claims.'
    };
  }

  // No verifiable external signals: return null honestly
  return null;
}

module.exports = { scoreSources };
