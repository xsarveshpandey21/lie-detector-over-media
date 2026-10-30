// Real fact-checking verification via Google Fact Check Tools API and Curated Open-Source Registry
const axios = require('axios');
const crypto = require('crypto');
const { matchLocalFactChecks } = require('../utils/factCheckMatcher');

// 10-minute in-memory cache: hash -> { status, items, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Searches real published fact-checks using the Google Fact Check Tools API or local open-source verified registry.
 * Never invents, fakes, or hallucinates results.
 *
 * @param {string} text - Claim text to search
 * @param {string} [languageCode='en'] - Language code (e.g. 'en', 'hi')
 * @returns {Promise<{ status: 'checked'|'not_checked'|'no_matches_found', source?: 'google_api'|'local_registry', items: Array<object> }>}
 */
async function searchFactChecks(text, languageCode = 'en') {
  const claim = (text || '').trim().slice(0, 200);
  if (!claim) {
    return { status: 'not_checked', items: [] };
  }

  const apiKey = process.env.FACT_CHECK_GOOGLE_API_KEY;

  // Check cache
  const hash = crypto.createHash('sha256').update(`${claim}:${languageCode}:${Boolean(apiKey)}`).digest('hex');
  const cached = cache.get(hash);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return { status: cached.status, source: cached.source, items: cached.items };
  }

  // 1. If Google Fact Check API key is available, query live API
  if (apiKey) {
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
      if (claims.length > 0) {
        const items = [];
        for (const c of claims) {
          const reviews = c.claimReview || [];
          for (const rev of reviews) {
            items.push({
              publisher: rev.publisher?.name || 'Verified Fact-Checker',
              rating: rev.textualRating || 'Unrated',
              claim: c.text || claim,
              url: rev.url || '',
              date: rev.reviewDate ? rev.reviewDate.split('T')[0] : '',
              isLiveApi: true
            });
          }
        }
        if (items.length > 0) {
          const result = { status: 'checked', source: 'google_api', items: items.slice(0, 5) };
          cache.set(hash, { ...result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.warn('[FactCheck API Warning]:', err.message);
    }
  }

  // 2. Query Curated Open-Source Verified Fact-Check Knowledge Base using shared matcher
  const localMatched = matchLocalFactChecks(claim);
  if (localMatched.length > 0) {
    const result = {
      status: 'checked',
      source: 'local_registry',
      items: localMatched.slice(0, 5)
    };
    cache.set(hash, { ...result, timestamp: Date.now() });
    return result;
  }

  const result = { status: apiKey ? 'no_matches_found' : 'not_checked', items: [] };
  cache.set(hash, { ...result, timestamp: Date.now() });
  return result;
}

module.exports = { searchFactChecks };
