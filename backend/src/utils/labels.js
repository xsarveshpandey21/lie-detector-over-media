/**
 * Normalizes raw label strings from models or APIs into one of: 'true' | 'false' | 'uncertain'
 *
 * Checks negations and false indicators first so "untrue", "not true", "not factual", etc.
 * never get mistaken for "true".
 *
 * @param {string|null|undefined} raw
 * @returns {'true'|'false'|'uncertain'}
 */
function normalizeLabel(raw) {
  if (raw === null || raw === undefined) return 'uncertain';

  const text = String(raw).toLowerCase().trim();
  if (!text) return 'uncertain';

  // 1. Explicit uncertain patterns (like "half-true", "unverified", "mixture")
  const uncertainPatterns = [
    /\bhalf[_-]?true\b/,
    /\bpartially\s+true\b/,
    /\bmixture\b/,
    /\buncertain\b/,
    /\bunverified\b/,
    /\bcannot\s+determine\b/
  ];

  for (const pattern of uncertainPatterns) {
    if (pattern.test(text)) {
      return 'uncertain';
    }
  }

  // 2. Negations & false-like patterns checked next
  const falsePatterns = [
    /\buntrue\b/,
    /\bnot\s+true\b/,
    /\bnot\s+factual\b/,
    /\bnot\s+accurate\b/,
    /\bnot\s+correct\b/,
    /\bbarely[_-]?true\b/,
    /\bfalse\b/,
    /\bfake\b/,
    /\bmisleading\b/,
    /\bincorrect\b/,
    /\bdebunked\b/,
    /\bdisproven\b/,
    /\blikely_false\b/,
    /\blikely_fake\b/,
    /\bpants[_-]?on[_-]?fire\b/
  ];

  for (const pattern of falsePatterns) {
    if (pattern.test(text)) {
      return 'false';
    }
  }

  // 3. True-like patterns checked last (strict whole-word matching)
  const truePatterns = [
    /\btrue\b/,
    /\bcorrect\b/,
    /\baccurate\b/,
    /\bfactual\b/,
    /\bverified\b/,
    /\blikely_true\b/
  ];

  for (const pattern of truePatterns) {
    if (pattern.test(text)) {
      return 'true';
    }
  }

  return 'uncertain';
}

module.exports = { normalizeLabel };
