// Real fact-checking verification via Google Fact Check Tools API and Curated Open-Source Registry
const axios = require('axios');
const crypto = require('crypto');
const { matchClaimAgainstRegistry } = require('./claimMatcher');

// 10-minute in-memory cache: hash -> { status, items, matches, references, timestamp }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Maps textual rating to plain-English meaning
 */
function getRatingMeaning(rating, publisher) {
  const r = (rating || '').toLowerCase();
  if (r.includes('false') || r.includes('fire') || r.includes('fake') || r.includes('incorrect') || r.includes('myth')) {
    return `False — ${publisher || 'Fact-checkers'} investigated this claim and found it to be unsupported by evidence.`;
  }
  if (r.includes('true') || r.includes('correct') || r.includes('accurate') || r.includes('verified')) {
    return `Verified True — ${publisher || 'Fact-checkers'} confirmed this statement matches official records or evidence.`;
  }
  if (r.includes('partly') || r.includes('half') || r.includes('mixture') || r.includes('misleading')) {
    return `Partly True / Misleading — Contains some factual elements mixed with inaccurate or unverified claims.`;
  }
  return `Rated "${rating}" by ${publisher || 'independent fact-checkers'}.`;
}

/**
 * Searches real published fact-checks using the Google Fact Check Tools API or local open-source verified registry.
 * Never invents, fakes, or hallucinates results.
 *
 * @param {string} text - Claim text to search
 * @param {string} [languageCode='en'] - Language code (e.g. 'en', 'hi')
 * @returns {Promise<{ status: 'checked'|'not_checked'|'no_matches_found', source?: 'google_api'|'local_registry', items: Array<object>, matches: Array<object>, references: Array<object> }>}
 */
async function searchFactChecks(text, languageCode = 'en') {
  const claim = (text || '').trim().slice(0, 300);
  if (!claim) {
    return { status: 'not_checked', items: [], matches: [], references: [] };
  }

  const apiKey = process.env.FACT_CHECK_GOOGLE_API_KEY;

  // Check cache
  const hash = crypto.createHash('sha256').update(`${claim}:${languageCode}:${Boolean(apiKey)}`).digest('hex');
  const cached = cache.get(hash);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return {
      status: cached.status,
      source: cached.source,
      items: cached.items,
      matches: cached.matches || [],
      references: cached.references || []
    };
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
        const matches = [];
        const references = [];
        const items = [];

        for (const c of claims) {
          const reviews = c.claimReview || [];
          for (const rev of reviews) {
            const pubName = rev.publisher?.name || 'Verified Fact-Checker';
            const revDate = rev.reviewDate ? rev.reviewDate.split('T')[0] : '';
            const ratingText = rev.textualRating || 'Unrated';
            const refId = `gfc-${crypto.createHash('md5').update((rev.url || '') + (c.text || '')).digest('hex').slice(0, 8)}`;
            const isOld = Boolean(
              revDate && (Date.now() - new Date(revDate).getTime() > 2 * 365 * 24 * 3600 * 1000)
            );

            const refObj = {
              id: refId,
              publisher: pubName,
              title: c.text || claim,
              rating: ratingText,
              ratingMeaning: getRatingMeaning(ratingText, pubName),
              claim: c.text || claim,
              url: rev.url || '',
              date: revDate,
              language: rev.languageCode || languageCode,
              source: 'google_fact_check',
              retrievedAt: new Date().toISOString(),
              verifiedOn: new Date().toISOString().split('T')[0],
              isOld
            };

            references.push(refObj);

            matches.push({
              matchType: 'live_api',
              matchStrength: 95,
              matchedPhrases: [c.text || claim],
              relation: 'same_claim',
              similarityNote: 'Live Google Fact Check Tools API match',
              reference: refObj
            });

            items.push({
              publisher: pubName,
              rating: ratingText,
              ratingMeaning: refObj.ratingMeaning,
              claim: c.text || claim,
              url: rev.url || '',
              date: revDate,
              isLiveApi: true,
              referenceId: refId
            });
          }
        }

        if (items.length > 0) {
          const result = {
            status: 'checked',
            source: 'google_api',
            items: items.slice(0, 5),
            matches: matches.slice(0, 5),
            references: references.slice(0, 5)
          };
          cache.set(hash, { ...result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.warn('[FactCheck API Warning]:', err.message);
    }
  }

  // 2. Query Curated Open-Source Verified Fact-Check Knowledge Base using shared claimMatcher
  const registryMatches = matchClaimAgainstRegistry(claim);
  if (registryMatches.length > 0) {
    const items = registryMatches.map(m => ({
      publisher: m.reference.publisher,
      rating: m.reference.rating,
      ratingMeaning: m.reference.ratingMeaning,
      claim: m.reference.claim,
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
      isOld: m.reference.isOld
    }));

    const references = registryMatches.map(m => m.reference);

    const result = {
      status: 'checked',
      source: 'local_registry',
      items: items.slice(0, 5),
      matches: registryMatches.slice(0, 5),
      references: references.slice(0, 5)
    };
    cache.set(hash, { ...result, timestamp: Date.now() });
    return result;
  }

  const result = {
    status: apiKey ? 'no_matches_found' : 'not_checked',
    items: [],
    matches: [],
    references: []
  };
  cache.set(hash, { ...result, timestamp: Date.now() });
  return result;
}

module.exports = {
  searchFactChecks,
  getRatingMeaning
};
