// Real fact-checking verification via Google Fact Check Tools API with in-memory caching
const axios = require('axios');
const crypto = require('crypto');

// 10-minute in-memory cache: hash -> { status, items, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Searches real published fact-checks using the Google Fact Check Tools API.
 * Never invents, fakes, or hardcodes results.
 *
 * @param {string} text - Claim text to search
 * @param {string} [languageCode='en'] - Language code (e.g. 'en', 'hi')
 * @returns {Promise<{ status: 'checked'|'not_checked'|'no_matches_found', items: Array<{ publisher: string, rating: string, claim: string, url: string, date: string }> }>}
 */
async function searchFactChecks(text, languageCode = 'en') {
  const claim = (text || '').trim().slice(0, 200);
  if (!claim) {
    return { status: 'not_checked', items: [] };
  }

  const apiKey = process.env.FACT_CHECK_GOOGLE_API_KEY;
  if (!apiKey) {
    return { status: 'not_checked', items: [] };
  }

  // Check cache
  const hash = crypto.createHash('sha256').update(`${claim}:${languageCode}`).digest('hex');
  const cached = cache.get(hash);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { status: cached.status, items: cached.items };
  }

  try {
    const url = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
    const { data } = await axios.get(url, {
      params: {
        query: claim,
        languageCode,
        key: apiKey
      },
      timeout: 6000
    });

    const claims = data?.claims || [];
    if (claims.length === 0) {
      const result = { status: 'no_matches_found', items: [] };
      cache.set(hash, { ...result, timestamp: Date.now() });
      return result;
    }

    const items = [];
    for (const c of claims) {
      const reviews = c.claimReview || [];
      for (const rev of reviews) {
        items.push({
          publisher: rev.publisher?.name || 'Verified Fact-Checker',
          rating: rev.textualRating || 'Unrated',
          claim: c.text || claim,
          url: rev.url || '',
          date: rev.reviewDate ? rev.reviewDate.split('T')[0] : ''
        });
      }
    }

    const finalStatus = items.length > 0 ? 'checked' : 'no_matches_found';
    const result = { status: finalStatus, items: items.slice(0, 5) };
    cache.set(hash, { ...result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('[FactCheck API Warning]:', err.message);
    return { status: 'no_matches_found', items: [] };
  }
}

module.exports = { searchFactChecks };
