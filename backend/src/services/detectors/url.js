// URL credibility and reputation detector
const lowCredDomains = [
  'clickbait.com',
  'rumors.net',
  'fake-news.example',
  'infowars.com',
  'beforeitsnews.com',
  'theonion.com'
];

const reputableFactCheckers = [
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'snopes.com',
  'politifact.com',
  'factcheck.org',
  'altnews.in',
  'boomlive.in'
];

module.exports = async function detectUrl(rawUrl) {
  let target = (rawUrl || '').trim();
  if (!target) {
    throw new Error('URL cannot be empty.');
  }

  // Prepend https:// if user omitted protocol
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    throw new Error(`Invalid URL format: "${rawUrl}". Please provide a valid web address.`);
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const https = parsed.protocol === 'https:';
  const pathDepth = parsed.pathname.split('/').filter(Boolean).length;
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);

  const isLowCred = lowCredDomains.some(d => host === d || host.endsWith('.' + d));
  const isReputable = reputableFactCheckers.some(d => host === d || host.endsWith('.' + d));

  let baseScore = 60;
  if (isReputable) {
    baseScore = 92;
  } else if (isLowCred) {
    baseScore = 20;
  }

  if (isIpAddress) {
    baseScore -= 25;
  }
  if (!https) {
    baseScore -= 15;
  }
  if (pathDepth > 5) {
    baseScore -= 10;
  }

  const truthScore = Math.max(5, Math.min(95, baseScore));
  const confidence = isReputable || isLowCred ? 0.90 : 0.65;
  const label = truthScore >= 70 ? 'likely_true' : truthScore <= 40 ? 'likely_fake' : 'uncertain';

  const explanations = [
    `Target Domain: ${host}`,
    https ? 'Valid HTTPS security protocol detected.' : 'Unencrypted HTTP protocol detected (security warning).',
    isReputable
      ? 'Domain is on the verified reputable journalistic and fact-checking registry.'
      : isLowCred
      ? 'Domain has recorded history of publishing satire, clickbait, or unverified claims.'
      : 'Standard web domain. Verify specific citations independently.'
  ];

  if (isIpAddress) {
    explanations.push('URL points directly to an IP address rather than a verified domain name.');
  }

  return {
    type: 'url',
    truthScore,
    confidence,
    label,
    explanations,
    summary: isReputable
      ? 'High credibility domain from verified fact-checking index.'
      : isLowCred
      ? 'Low credibility or satirical source detected.'
      : 'URL reputation evaluated based on protocol, domain verification, and link topology.',
    breakdown: {
      url: {
        host,
        https,
        pathDepth,
        isIpAddress,
        isReputable,
        isLowCred
      }
    }
  };
};
