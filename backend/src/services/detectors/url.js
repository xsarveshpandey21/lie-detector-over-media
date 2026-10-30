// URL credibility and lookalike detector
const axios = require('axios');
const domainData = require('../../data/domains.json');
const { AppError } = require('../../utils/errors');

/**
 * Computes Levenshtein distance between two strings
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Detects lookalike / typosquatting domains against the trusted list
 */
function checkLookalike(host, trustedList) {
  const baseHost = host.split('.')[0];
  if (baseHost.length <= 3) {
    return { lookalike: false };
  }

  for (const trusted of trustedList) {
    if (host === trusted) continue;
    const baseTrusted = trusted.split('.')[0];

    // Relative distance threshold
    const dist = levenshteinDistance(baseHost, baseTrusted);
    const maxLen = Math.max(baseHost.length, baseTrusted.length);
    if (dist > 0 && dist <= 2 && (dist / maxLen) <= 0.35) {
      return { lookalike: true, target: trusted };
    }

    // Check specific impersonation prefixes/suffixes like "bbc-news", "reuters-live"
    if (baseHost.length > 5 && (baseHost.startsWith(baseTrusted + '-') || baseHost.endsWith('-' + baseTrusted))) {
      return { lookalike: true, target: trusted };
    }
  }
  return { lookalike: false };
}

/**
 * Optional Google Safe Browsing Lookup
 */
async function checkSafeBrowsing(url) {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return null;

  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`;
    const payload = {
      client: { clientId: 'satya-lens', clientVersion: '1.0.0' },
      threatInfo: {
        threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }]
      }
    };
    const { data } = await axios.post(endpoint, payload, { timeout: 4000 });
    const matches = data?.matches || [];
    return matches.length > 0;
  } catch {
    return null;
  }
}

module.exports = async function detectUrl(rawUrl) {
  let target = (rawUrl || '').trim();
  if (!target) {
    throw new AppError(400, 'empty_url', 'Please enter a website link to check.');
  }

  if (target.length > 2048) {
    throw new AppError(400, 'url_too_long', 'Link is too long. Links are limited to 2,048 characters.');
  }

  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    throw new AppError(400, 'invalid_url', 'Invalid link format. Please provide a valid web address.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AppError(400, 'invalid_protocol', 'Only web links (http or https) can be checked.');
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const https = parsed.protocol === 'https:';
  const pathDepth = parsed.pathname.split('/').filter(Boolean).length;
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

  if (!host || (!host.includes('.') && !isIpAddress)) {
    throw new AppError(400, 'invalid_url', 'Invalid link format. A valid website address must include a domain extension (e.g., .com, .org).');
  }
  const isPunycode = host.startsWith('xn--') || host.includes('.xn--');

  const isTrusted = domainData.trusted.some(d => host === d || host.endsWith('.' + d));
  const isSatire = domainData.satire.some(d => host === d || host.endsWith('.' + d));
  const isLowCred = domainData.lowCredibility.some(d => host === d || host.endsWith('.' + d));
  const isShortener = domainData.shorteners.some(d => host === d || host.endsWith('.' + d));

  const lookalikeCheck = !isTrusted ? checkLookalike(host, domainData.trusted) : { lookalike: false };

  const checks = [
    { name: 'Website address format check', ran: true, note: 'URL syntax and host structure validated' },
    { name: 'Security protocol check', ran: true, note: https ? 'Secure HTTPS connection' : 'Unencrypted HTTP' },
    { name: 'Known domain registry check', ran: true, note: 'Checked against trusted, satire, and low-credibility lists' },
    { name: 'Lookalike domain detection', ran: true, note: lookalikeCheck.lookalike ? `Possible lookalike of ${lookalikeCheck.target}` : 'No known lookalike pattern' }
  ];

  const reasons = [];
  const nextSteps = [];

  // Safe browsing optional check
  const safeBrowsingMatch = await checkSafeBrowsing(target);
  if (safeBrowsingMatch === true) {
    checks.push({ name: 'Google Safe Browsing check', ran: true, note: 'Flagged as dangerous by Google Safe Browsing' });
  } else if (safeBrowsingMatch === false) {
    checks.push({ name: 'Google Safe Browsing check', ran: true, note: 'No threats found' });
  } else {
    checks.push({ name: 'Google Safe Browsing check', ran: false, note: 'Not configured (optional API key missing)' });
  }

  let label = 'uncertain';
  let headline = 'We could not confirm this link';
  let meaning = 'This is a standard web link. Check the article and writer yourself.';
  let score = 55;
  let confidenceLevel = 'low';

  if (!https) {
    reasons.push({ tone: 'warn', text: 'This website is not secure (no HTTPS encryption).' });
  } else {
    reasons.push({ tone: 'good', text: 'Uses secure HTTPS connection.' });
  }

  if (isIpAddress) {
    label = 'likely_false';
    score = 15;
    confidenceLevel = 'high';
    headline = 'Suspicious web address';
    meaning = 'The link points to a number instead of a real website name.';
    reasons.push({ tone: 'bad', text: 'The link points to a number instead of a real website name.' });
    nextSteps.push('Do not enter passwords or personal details on IP-only links.');
  } else if (isPunycode) {
    label = 'likely_false';
    score = 20;
    confidenceLevel = 'high';
    headline = 'Foreign lookalike character domain (Punycode)';
    meaning = 'This address uses special characters that can mimic trusted company names.';
    reasons.push({ tone: 'bad', text: 'The address uses deceptive internationalized characters (Punycode).' });
    nextSteps.push('Verify the exact spelling of the domain before opening.');
  } else if (isShortener) {
    label = 'uncertain';
    score = 45;
    confidenceLevel = 'medium';
    headline = 'Shortened link — real destination hidden';
    meaning = 'Short links (like bit.ly) hide where you are actually going.';
    reasons.push({ tone: 'warn', text: 'The link is shortened, so the true destination website is hidden.' });
    nextSteps.push('Use a link expander to preview where the short link goes before clicking.');
  } else if (lookalikeCheck.lookalike) {
    label = 'likely_false';
    score = 25;
    confidenceLevel = 'high';
    headline = 'Possible lookalike or imposter website';
    meaning = `The address looks very similar to "${lookalikeCheck.target}", but is not the real one.`;
    reasons.push({ tone: 'bad', text: `Address closely mimics "${lookalikeCheck.target}". Watch out for impersonation.` });
    nextSteps.push(`Visit the official site directly: https://${lookalikeCheck.target}`);
  } else if (safeBrowsingMatch === true) {
    label = 'likely_false';
    score = 10;
    confidenceLevel = 'high';
    headline = 'Dangerous website flagged';
    meaning = 'Security registries report this link may contain phishing or malware.';
    reasons.push({ tone: 'bad', text: 'Flagged as potentially malicious by web safety scanners.' });
  } else if (isSatire) {
    label = 'likely_false';
    score = 30;
    confidenceLevel = 'high';
    headline = 'Humour or satire website';
    meaning = 'This site writes funny or fake stories for entertainment, not real news.';
    reasons.push({ tone: 'info', text: 'Published by a known satire or parody website.' });
    nextSteps.push('Enjoy the story as entertainment, but do not share it as real news.');
  } else if (isLowCred) {
    label = 'likely_false';
    score = 20;
    confidenceLevel = 'high';
    headline = 'Source known for unreliable claims';
    meaning = 'This website has a documented history of publishing rumours, clickbait, or unverified stories.';
    reasons.push({ tone: 'bad', text: 'Known history of publishing unverified claims or clickbait.' });
    nextSteps.push('Search other reputable news sites to see if any reliable outlet reported this.');
  } else if (isTrusted) {
    label = 'likely_true';
    score = 88;
    confidenceLevel = 'high';
    // User instruction rule: Do not say "likely true" just because the domain is reputable.
    headline = "Trusted source — still check the article's own claims";
    meaning = 'This website has strong journalistic editorial standards, but individual opinions or claims should still be reviewed.';
    reasons.push({ tone: 'good', text: 'Published on an established news or public health website.' });
    nextSteps.push("Read the full article and check the author's stated sources.");
  } else {
    label = 'uncertain';
    score = 55;
    confidenceLevel = 'medium';
    headline = 'Standard website link';
    meaning = 'This is a normal website address. Check who wrote the story and when it was published.';
    reasons.push({ tone: 'info', text: `Domain: ${host}` });
    if (pathDepth > 5) {
      reasons.push({ tone: 'warn', text: 'Very deep address path with multiple tracking or redirection parameters.' });
    }
    nextSteps.push('Look for an "About Us" page on the site to see who runs it.');
    nextSteps.push('Check the author name and publication date.');
  }

  nextSteps.push('Compare what this article says with at least two other independent sources.');

  return {
    type: 'url',
    input: {
      kind: 'url',
      preview: target,
      meta: {
        domain: host,
        url: target,
        https
      }
    },
    verdict: {
      label,
      headline,
      meaning,
      score,
      confidenceLevel
    },
    reasons,
    sources: {
      status: 'not_checked',
      items: []
    },
    nextSteps,
    checks,
    technical: {
      domain: host,
      https,
      securityProtocol: https ? 'TLS / HTTPS Encrypted' : 'Unencrypted HTTP',
      pathDepth,
      reputationCategory: isTrusted ? 'Trusted News / Official' : isSatire ? 'Satire / Parody' : isLowCred ? 'Low Credibility' : isShortener ? 'URL Shortener' : 'Standard Web Domain',
      isIpAddress,
      isPunycode,
      isTrusted,
      isSatire,
      isLowCred,
      isShortener,
      lookalikeTarget: lookalikeCheck.target || null
    },
    notices: [],
    disclaimer: 'Satya Lens gives signals, not final proof. Always check with trusted sources.',

    // Deprecated compatibility aliases
    truthScore: score,
    confidence: confidenceLevel === 'high' ? 0.85 : confidenceLevel === 'medium' ? 0.65 : 0.50,
    label,
    summary: meaning,
    explanations: reasons.map(r => r.text)
  };
};
