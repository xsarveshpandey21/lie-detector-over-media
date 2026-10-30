// Enhanced plain-English text detector with strict label normalization, LLM JSON mode, and honest heuristic checks
const axios = require('axios');
const { normalizeLabel } = require('../../utils/labels');
const { AppError } = require('../../utils/errors');

/**
 * Classifies claim using optional local or cloud microservice
 */
async function classifyWithMicroservice(text) {
  const base = process.env.TEXT_MODEL_URL;
  if (!base) return null;
  try {
    const { data } = await axios.post(
      `${base.replace(/\/$/, '')}/predict`,
      { text },
      { timeout: 6000 }
    );
    if (!data) return null;
    const raw = data.label;
    const normalized = normalizeLabel(raw);
    const confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0.5));
    return {
      label: normalized,
      confidence,
      source: 'Local/Self-hosted Transformer Model',
      rationale: 'Classification from self-hosted text model.'
    };
  } catch {
    return null;
  }
}

/**
 * Classifies claim using OpenAI with strict JSON response_format
 */
async function classifyWithOpenAI(text) {
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    const resp = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an objective text claim analyzer. Evaluate the reliability of the statement. Return valid JSON only with keys: label ("true", "false", or "uncertain"), confidence (0.0 to 1.0), and rationale (brief 1-2 sentence explanation in plain English).'
          },
          { role: 'user', content: `Claim: ${text.slice(0, 3000)}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 9000
      }
    );

    const content = resp.data.choices?.[0]?.message?.content || '';
    if (!content) return null;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return null;
    }

    const normalized = normalizeLabel(parsed.label);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6));
    const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : '';

    return {
      label: normalized,
      confidence,
      source: 'OpenAI Language Model',
      rationale: rationale || 'AI opinion — not checked against live sources.'
    };
  } catch {
    return null;
  }
}

module.exports = async function detectText(rawText) {
  const claim = (rawText || '').trim();
  if (!claim) {
    throw new AppError(400, 'empty_text', 'Please enter or paste text to check.');
  }

  if (claim.length > 5000) {
    throw new AppError(400, 'text_too_long', 'Text is too long. Please limit text to 5,000 characters.');
  }

  const length = claim.length;
  const words = claim.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Linguistic Pattern Analyzers
  // Removed "hoax" and "alert" as requested to prevent false positives
  const sensationalPatterns = [
    /\b(shocking|unbelievable|mind-blowing|you won'?t believe|miracle cure|magic remedy)\b/i,
    /\b(they don'?t want you to know|secret truth|hidden conspiracy|cover-up|conspiracy)\b/i,
    /\b(100% guaranteed|instant cure|banned everywhere|leaked secret)\b/i
  ];

  const viralUrgencyPatterns = [
    /\b(share before it'?s deleted|forward to everyone|forward to all|must see|wake up sheeple|repost now)\b/i,
    /\b(urgent warning|spread this everywhere)\b/i
  ];

  const objectiveIndicators = [
    /\b(according to|study published in|peer-reviewed|researchers from|officials confirmed)\b/i,
    /\b(reuters|associated press|department of|ministry of|spokesperson said|world health organization)\b/i,
    /\b(clinical trial|preliminary findings|official statistics|court ruling)\b/i
  ];

  const debunkingIndicators = [
    /\b(debunked|false claim|misleading statement|disproven by|fact-check found|hoax refuted)\b/i
  ];

  let sensationalHits = 0;
  sensationalPatterns.forEach(p => { if (p.test(claim)) sensationalHits++; });

  let urgencyHits = 0;
  viralUrgencyPatterns.forEach(p => { if (p.test(claim)) urgencyHits++; });

  let objectiveHits = 0;
  objectiveIndicators.forEach(p => { if (p.test(claim)) objectiveHits++; });

  let debunkHits = 0;
  debunkingIndicators.forEach(p => { if (p.test(claim)) debunkHits++; });

  // Punctuation & Capitalization Checks
  const exclamationCount = (claim.match(/!{2,}/g) || []).length;
  const questionCount = (claim.match(/\?{2,}/g) || []).length;
  const uppercaseWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /^[A-Z]+$/.test(w)).length;
  const capsRatio = wordCount > 0 ? uppercaseWords / wordCount : 0;

  // Has a date or year mentioned (e.g. 2023, 2024, Monday, October)?
  const hasDateMention = /\b(19\d\d|20\d\d|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(claim);

  // Compute Base Heuristic Score (0 to 100)
  let baseScore = 60; // neutral starting baseline

  // Penalize sensational words & urgent sharing pushes
  baseScore -= sensationalHits * 20;
  baseScore -= urgencyHits * 15;
  if (exclamationCount > 0) baseScore -= 10;
  if (capsRatio > 0.25) baseScore -= 15;

  // Reward objective markers and verified citations (CAPPED at +20 as requested)
  const objectiveBonus = Math.min(20, objectiveHits * 10);
  baseScore += objectiveBonus;

  // Debunking indicators: if the text mentions debunking, lower penalty
  if (debunkHits > 0) {
    baseScore = Math.max(50, baseScore + 15);
  }

  // Short claims without dates or context
  if (wordCount < 10) {
    baseScore = Math.max(35, Math.min(65, baseScore));
  }

  const heuristicScore = Math.max(5, Math.min(95, Math.round(baseScore)));

  // Try external services (microservice or OpenAI)
  const svc = await classifyWithMicroservice(claim);
  const llm = svc || await classifyWithOpenAI(claim);

  let finalLabel = 'uncertain';
  let confidenceLevel = 'low';
  let finalScore = heuristicScore;
  let headline = 'Not sure — please check more';
  let meaning = 'We checked the style of the words, but we cannot verify whether this claim is true.';

  if (llm) {
    if (llm.label === 'false') {
      finalLabel = 'likely_false';
      headline = 'Likely false or misleading';
      meaning = 'This statement contains wording and patterns common in unverified claims or misinformation.';
      finalScore = Math.round(30 - (llm.confidence * 20));
      confidenceLevel = llm.confidence > 0.75 ? 'high' : 'medium';
    } else if (llm.label === 'true') {
      finalLabel = 'likely_true';
      headline = 'Looks reliable';
      meaning = 'This text matches factual reporting style, though specific claims should still be checked against sources.';
      finalScore = Math.round(70 + (llm.confidence * 20));
      confidenceLevel = llm.confidence > 0.75 ? 'high' : 'medium';
    } else {
      finalLabel = 'uncertain';
      headline = 'Not sure — please check more';
      meaning = 'We could not find enough clear evidence to verify or refute this claim.';
      finalScore = 50;
      confidenceLevel = 'low';
    }
  } else {
    // Pure heuristics: cap confidenceLevel at "low" or "medium" as required
    if (heuristicScore <= 35) {
      finalLabel = 'likely_false';
      headline = 'Likely false or misleading';
      meaning = 'This statement uses language typical of sensational rumours or clickbait.';
      confidenceLevel = (sensationalHits > 1 || urgencyHits > 0) ? 'medium' : 'low';
    } else if (heuristicScore >= 75) {
      finalLabel = 'likely_true';
      headline = 'Looks reliable';
      meaning = 'This statement uses neutral, factual language with citations, but claims still need source verification.';
      confidenceLevel = objectiveHits > 1 ? 'medium' : 'low';
    } else {
      finalLabel = 'uncertain';
      headline = 'Not sure — please check more';
      meaning = 'There is not enough clear context to tell whether this is reliable.';
      confidenceLevel = 'low';
    }
  }

  // Construct plain-English reasons (using exact required translations)
  const reasons = [];

  // Plain language requirement: "Always include the reason: 'We checked writing style, not facts.'"
  reasons.push({ tone: 'info', text: 'We checked writing style, not facts.' });

  if (sensationalHits > 0) {
    reasons.push({ tone: 'bad', text: 'Uses shocking words to grab attention.' });
  }

  if (urgencyHits > 0) {
    reasons.push({ tone: 'bad', text: 'Pushes you to share quickly without checking.' });
  }

  if (capsRatio > 0.25 || exclamationCount > 0) {
    reasons.push({ tone: 'warn', text: 'Uses dramatic capitalization or multiple exclamation marks (ALL-CAPS / !!!).' });
  }

  if (objectiveHits > 0) {
    reasons.push({ tone: 'good', text: 'Names credible sources, research institutions, or official statements.' });
  }

  if (!hasDateMention && wordCount < 25) {
    reasons.push({ tone: 'warn', text: 'Does not say when or where this happened, making it hard to verify.' });
  }

  if (debunkHits > 0) {
    reasons.push({ tone: 'info', text: 'The text discusses fact-checking or debunking an existing claim.' });
  }

  if (llm?.rationale) {
    reasons.push({ tone: 'info', text: `AI opinion — not checked against live sources: ${llm.rationale}` });
  }

  const nextSteps = [
    'Search the exact claim on Google, Reuters Fact Check, or AltNews to see if it was debunked.',
    'Ask whoever sent you this message: "Where did this originally come from?"',
    'Do not forward or repost until you find at least one reliable news outlet that reported it.'
  ];

  const checks = [
    { name: 'Sensationalism & clickbait language check', ran: true, note: sensationalHits > 0 ? 'Detected hype words' : 'None detected' },
    { name: 'Viral urgency & pressure check', ran: true, note: urgencyHits > 0 ? 'Detected urgent sharing requests' : 'None detected' },
    { name: 'Source attribution check', ran: true, note: objectiveHits > 0 ? 'Found source citations' : 'No named institutions found' },
    { name: 'Writing style & formatting check', ran: true, note: 'Analyzed capitalization, punctuation, and length' },
    {
      name: 'AI language model check',
      ran: Boolean(llm),
      note: llm ? `Assisted by ${llm.source}` : 'Not run (no external model configured)'
    }
  ];

  return {
    type: 'text',
    input: {
      kind: 'text',
      preview: claim.slice(0, 300) + (claim.length > 300 ? '…' : ''),
      meta: {
        words: wordCount,
        chars: length
      }
    },
    verdict: {
      label: finalLabel,
      headline,
      meaning,
      score: finalScore,
      confidenceLevel
    },
    reasons,
    sources: {
      status: 'not_checked', // filled in by route via crossVerify
      items: []
    },
    nextSteps,
    checks,
    technical: {
      wordCount,
      length,
      sensationalHits,
      urgencyHits,
      objectiveHits,
      objectiveBonus,
      capsRatio: Number(capsRatio.toFixed(2)),
      exclamationCount,
      debunkHits,
      hasDateMention,
      heuristicScore,
      modelUsed: Boolean(llm),
      modelSource: llm?.source || null
    },
    notices: [],
    disclaimer: 'Satya Lens gives signals, not final proof. Always check with trusted sources.',

    // Deprecated compatibility aliases
    truthScore: finalScore,
    confidence: confidenceLevel === 'high' ? 0.85 : confidenceLevel === 'medium' ? 0.65 : 0.45,
    label: finalLabel,
    summary: meaning,
    explanations: reasons.map(r => r.text)
  };
};
