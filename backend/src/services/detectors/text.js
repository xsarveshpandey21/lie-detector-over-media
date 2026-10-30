// Enhanced text claim detector with supervised microservice, LLM integration, and comprehensive NLP heuristics
const axios = require('axios');

async function classifyWithMicroservice(text) {
  const base = process.env.TEXT_MODEL_URL;
  if (!base) return null;
  try {
    const { data } = await axios.post(
      `${base.replace(/\/$/, '')}/predict`,
      { text },
      { timeout: 8000 }
    );
    if (!data) return null;
    const mapped = String(data.label || '').toLowerCase();
    const label = mapped.includes('true') ? 'true' : mapped.includes('false') ? 'false' : 'uncertain';
    const confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0.5));
    return { label, confidence, rationale: 'Supervised transformer model prediction' };
  } catch {
    return null;
  }
}

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
            content: 'You are an objective fact-checking classifier. Evaluate the veracity of the claim. Respond strictly with JSON: {"label":"True"|"False"|"Uncertain","confidence":0.0-1.0,"rationale":"Brief explanation of verification reasoning"}'
          },
          { role: 'user', content: `Claim: ${text}` }
        ],
        temperature: 0
      },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 10000
      }
    );
    const content = resp.data.choices?.[0]?.message?.content || '';
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    const rawLabel = String(parsed.label || '').toLowerCase();
    const label = rawLabel.includes('true') ? 'true' : rawLabel.includes('false') ? 'false' : 'uncertain';
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5));
    return { label, confidence, rationale: parsed.rationale || 'AI fact-checking analysis' };
  } catch {
    return null;
  }
}

module.exports = async function detectText(text) {
  const claim = (text || '').trim();
  if (!claim) {
    throw new Error('Claim text is empty. Please provide text to analyze.');
  }

  const length = claim.length;
  const words = claim.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Linguistic Pattern Analyzers
  const sensationalPatterns = [
    /\b(shocking|unbelievable|mind-blowing|you won'?t believe|miracle|magic cure)\b/i,
    /\b(they don'?t want you to know|secret truth|hidden conspiracy|cover-up|hoax)\b/i,
    /\b(guaranteed|100% cure|instant remedy|banned everywhere)\b/i
  ];

  const viralUrgencyPatterns = [
    /\b(share before it'?s deleted|forward to everyone|must see|wake up sheeple|repost now)\b/i,
    /\b(urgent warning|alert|emergency announcement)\b/i
  ];

  const objectiveIndicators = [
    /\b(according to|study published in|peer-reviewed|researchers from|officials confirmed)\b/i,
    /\b(reuters|associated press|department of|ministry of|spokesperson said)\b/i,
    /\b(data released|quarterly report|clinical trial|preliminary findings)\b/i
  ];

  const debunkingIndicators = [
    /\b(debunked|false claim|misleading statement|disproven by|fact-check found)\b/i
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

  // Compute Base Heuristic Score (0 = Fake, 100 = True)
  let baseScore = 65; // neutral starting point

  // Penalize sensationalism and spam urgency
  baseScore -= sensationalHits * 20;
  baseScore -= urgencyHits * 15;
  if (exclamationCount > 0) baseScore -= 10;
  if (capsRatio > 0.25) baseScore -= 15;

  // Reward objective markers and verified citations
  baseScore += objectiveHits * 18;

  // Short claims without context have higher uncertainty
  if (wordCount < 8) {
    baseScore = Math.max(35, Math.min(65, baseScore));
  }

  // Clamp base score between 5 and 95
  const heuristicTruthScore = Math.max(5, Math.min(95, Math.round(baseScore)));

  let heuristicLabel = 'uncertain';
  if (heuristicTruthScore >= 70) heuristicLabel = 'true';
  else if (heuristicTruthScore <= 40) heuristicLabel = 'false';

  // Attempt external integrations (microservice or OpenAI)
  const svc = await classifyWithMicroservice(claim);
  const llm = svc || await classifyWithOpenAI(claim);

  let finalLabel = heuristicLabel;
  let confidence = 0.65;
  let finalScore = heuristicTruthScore;

  if (llm) {
    finalLabel = llm.label;
    confidence = Number(llm.confidence) || 0.75;
    if (finalLabel === 'true') {
      finalScore = Math.round(75 + confidence * 20);
    } else if (finalLabel === 'false') {
      finalScore = Math.round(35 - confidence * 25);
    } else {
      finalScore = 50;
    }
  } else {
    // Confidence based on signal strength
    const signalStrength = Math.abs(heuristicTruthScore - 50) / 50;
    confidence = Number((0.55 + signalStrength * 0.35).toFixed(2));
  }

  // Format human-friendly explanations
  const explanations = [];
  if (llm?.rationale) {
    explanations.push(`AI Analysis: ${llm.rationale}`);
  }
  if (sensationalHits > 0) {
    explanations.push('Detected sensational or hyperbolic phrasing commonly used in clickbait.');
  }
  if (urgencyHits > 0) {
    explanations.push('Contains artificial urgency markers encouraging rapid reposting without verification.');
  }
  if (capsRatio > 0.25 || exclamationCount > 0) {
    explanations.push('Formatting contains excessive capitalization or dramatic punctuation.');
  }
  if (objectiveHits > 0) {
    explanations.push('Includes formal attribution or references to credible institutions and studies.');
  }
  if (debunkHits > 0) {
    explanations.push('Text explicitly mentions fact-checking or debunking information.');
  }
  if (wordCount < 10) {
    explanations.push('Claim is brief and lacks surrounding context.');
  }
  if (explanations.length === 0) {
    explanations.push('No obvious sensational flags or direct verified citations detected; further cross-referencing recommended.');
  }

  const labelText = finalLabel === 'true' ? 'likely_true' : finalLabel === 'false' ? 'likely_false' : 'uncertain';

  return {
    type: 'text',
    truthScore: Math.max(0, Math.min(100, finalScore)),
    confidence: Number(confidence.toFixed(2)),
    label: labelText,
    explanations,
    summary: llm
      ? `Verified using ${svc ? 'custom model' : 'AI reasoning'} with linguistic heuristics.`
      : 'Evaluated via comprehensive linguistic heuristics and bias indicators.',
    breakdown: {
      heuristics: {
        sensationalHits,
        urgencyHits,
        objectiveHits,
        capsRatio: Number(capsRatio.toFixed(2)),
        wordCount,
        heuristicScore: heuristicTruthScore
      },
      model: {
        used: !!llm,
        source: svc ? 'microservice' : (llm ? 'openai' : 'heuristic')
      }
    }
  };
};
