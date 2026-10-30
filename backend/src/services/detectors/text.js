// Plain-English text detector with open-source NLP, strict label normalization, and transparent heuristic checks
const axios = require('axios');
const { normalizeLabel } = require('../../utils/labels');
const { AppError } = require('../../utils/errors');
const { analyzeTextNlp } = require('../nlp/openSourceNlp');
const { evaluateConfidence } = require('../confidence');

/**
 * Classifies claim using optional local open-source transformer model or cloud microservice
 */
async function classifyWithMicroservice(text) {
  const base = process.env.TEXT_MODEL_URL || 'http://localhost:9000';
  try {
    const { data } = await axios.post(
      `${base.replace(/\/$/, '')}/predict`,
      { text },
      { timeout: 4500 }
    );
    if (!data) return null;
    const raw = data.label;
    const normalized = normalizeLabel(raw);
    const confidence = Math.max(0, Math.min(1, Number(data.confidence) || 0.65));
    return {
      label: normalized,
      confidence,
      source: 'Open-Source RoBERTa / Transformer Model',
      rationale: 'Classification from local Hugging Face transformer text model.'
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
        timeout: 8000
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
      rationale: rationale || 'AI opinion — evaluated against standard reporting criteria.'
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

  // 1. Run local Open-Source NLP & Linguistic feature analysis
  const nlp = analyzeTextNlp(claim);
  const { metrics, matchedFactChecks } = nlp;

  // 2. Try connected transformer microservice or OpenAI
  const microservice = await classifyWithMicroservice(claim);
  const llm = microservice || await classifyWithOpenAI(claim);

  let finalLabel = nlp.label;
  let finalScore = nlp.score;
  let headline = 'Analysis complete';
  let meaning = 'We analyzed writing style, readability, and structural patterns.';

  // If external / open-source transformer model provided a verdict
  if (llm) {
    if (llm.label === 'false') {
      finalLabel = 'likely_false';
      headline = 'Likely false or misleading';
      meaning = 'This statement contains wording and patterns common in unverified claims or misinformation.';
      finalScore = Math.round(30 - (llm.confidence * 20));
    } else if (llm.label === 'true') {
      finalLabel = 'likely_true';
      headline = 'Looks reliable';
      meaning = 'This text matches factual reporting style, though specific claims should still be checked against sources.';
      finalScore = Math.round(70 + (llm.confidence * 20));
    } else {
      finalLabel = 'uncertain';
      headline = 'Not sure — please check more';
      meaning = 'We could not find enough clear evidence to verify or refute this claim.';
      finalScore = 50;
    }
  } else {
    // Pure open-source NLP heuristics (local registry never overrides verdict or sets confidence to high)
    if (finalLabel === 'likely_false') {
      headline = 'Likely false or sensational';
      meaning = 'This statement uses language typical of sensational rumors, clickbait, or urgent sharing pressure.';
    } else if (finalLabel === 'likely_true') {
      headline = 'Looks reliable';
      meaning = 'This statement uses balanced, factual language and cites reputable institutions or statistics.';
    } else {
      headline = 'Needs more context';
      meaning = 'There is not enough clear context to tell whether this is reliable.';
    }
  }

  // Evaluate Confidence assessment rules
  const confidenceAssessment = evaluateConfidence({
    matches: matchedFactChecks,
    nlpMetrics: metrics,
    externalModel: llm,
    contentType: 'text'
  });
  const confidenceLevel = confidenceAssessment.level;

  // Extract structured matches and references
  const matches = matchedFactChecks.map(m => ({
    matchType: m.matchType || 'registry_phrase',
    matchStrength: m.matchStrength || 80,
    matchedPhrases: m.matchedPhrases || [],
    relation: m.relation || 'similar_claim',
    similarityNote: m.similarityNote || 'Similar claim previously fact-checked',
    reference: m.reference
  }));

  const references = matchedFactChecks.map(m => m.reference).filter(Boolean);

  // If text has significant stylistic signals, attach a style pattern reference
  if (metrics.sensationalHits > 0 || metrics.urgencyHits > 0 || metrics.objectiveHits > 0) {
    references.push({
      id: 'ref-style-nlp',
      publisher: 'Satya Lens Linguistic Engine',
      title: 'Stylistic & Structural Pattern Analysis',
      rating: metrics.clickbaitScore >= 0.35 ? 'Sensational Markers Detected' : 'Objective Attribution Markers',
      ratingMeaning: metrics.clickbaitScore >= 0.35
        ? 'Identified emotional pressure, sensationalism, or urgent forwarding appeals in the text.'
        : 'Identified formal institutional citations and balanced journalistic language in the text.',
      claim: claim.slice(0, 140) + (claim.length > 140 ? '…' : ''),
      url: '',
      date: new Date().toISOString().split('T')[0],
      language: 'en',
      source: 'style_pattern',
      retrievedAt: new Date().toISOString()
    });
  }

  // Construct plain-English reasons with numbered reference links
  const reasons = [];

  // Required transparency reason
  reasons.push({ tone: 'info', text: 'We checked writing style, not facts.' });

  if (matchedFactChecks.length > 0) {
    const topMatch = matchedFactChecks[0];
    const topRefId = topMatch.referenceId || topMatch.reference?.id;
    reasons.push({
      tone: 'info',
      text: `Similar claim previously fact-checked: ${topMatch.publisher} reviewed a related claim (Rating: "${topMatch.rating}").`,
      refIds: topRefId ? [topRefId] : undefined
    });
  }

  if (metrics.sensationalHits > 0) {
    reasons.push({
      tone: 'bad',
      text: 'Uses shocking words or conspiracy framing to provoke strong emotions.',
      refIds: references.some(r => r.id === 'ref-style-nlp') ? ['ref-style-nlp'] : undefined
    });
  }

  if (metrics.urgencyHits > 0) {
    reasons.push({
      tone: 'bad',
      text: 'Pushes you to share or forward quickly before verifying.',
      refIds: references.some(r => r.id === 'ref-style-nlp') ? ['ref-style-nlp'] : undefined
    });
  }

  if (metrics.clickbaitScore >= 0.3) {
    reasons.push({
      tone: 'warn',
      text: `Clickbait pattern score is high (${Math.round(metrics.clickbaitScore * 100)}%).`,
      refIds: references.some(r => r.id === 'ref-style-nlp') ? ['ref-style-nlp'] : undefined
    });
  }

  if (metrics.objectiveHits > 0) {
    reasons.push({
      tone: 'good',
      text: 'Names credible research institutions, official agencies, or verified publishers.',
      refIds: references.some(r => r.id === 'ref-style-nlp') ? ['ref-style-nlp'] : undefined
    });
  }

  if (metrics.readingEase < 40) {
    reasons.push({ tone: 'info', text: `Writing style is complex or academic (${metrics.gradeLevel}, readability: ${metrics.readingEase}/100).` });
  } else if (metrics.readingEase > 70) {
    reasons.push({ tone: 'info', text: `Clear, accessible reading level (${metrics.gradeLevel}, readability: ${metrics.readingEase}/100).` });
  }

  if (llm?.rationale) {
    reasons.push({ tone: 'info', text: `${llm.source}: ${llm.rationale}` });
  }

  const nextSteps = [
    'Search the exact claim on Google Fact Check Tools, Reuters, or Snopes to see independent investigations.',
    'Ask whoever shared this: "What primary source or link does this come from?"',
    'Do not forward or repost until at least two established news outlets report the same story.'
  ];

  const checks = [
    {
      name: 'Sensationalism & clickbait detection',
      ran: true,
      note: metrics.sensationalHits > 0 ? `Detected ${metrics.sensationalHits} hype marker(s)` : 'Clear of clickbait markers'
    },
    {
      name: 'Viral urgency & pressure check',
      ran: true,
      note: metrics.urgencyHits > 0 ? 'Urgent forward requests detected' : 'No urgent forward requests'
    },
    {
      name: 'Source attribution & citations',
      ran: true,
      note: metrics.objectiveHits > 0 ? `Found ${metrics.objectiveHits} named source attribution(s)` : 'No named institutions found'
    },
    {
      name: 'Open-source readability & linguistic scan',
      ran: true,
      note: `Reading Ease ${metrics.readingEase}/100, ${metrics.gradeLevel}, Lexical Diversity ${Math.round(metrics.lexicalDiversity * 100)}%`
    },
    {
      name: 'Curated fact-check registry match',
      ran: true,
      note: matchedFactChecks.length > 0 ? `Matched ${matchedFactChecks.length} verified review(s)` : 'No direct matches in local registry'
    },
    {
      name: 'Transformer language model check',
      ran: Boolean(llm),
      note: llm ? `Assisted by ${llm.source}` : 'Open-source rule & statistical NLP engine used'
    }
  ];

  return {
    type: 'text',
    input: {
      kind: 'text',
      preview: claim.slice(0, 300) + (claim.length > 300 ? '…' : ''),
      meta: {
        words: metrics.wordCount,
        chars: metrics.charCount
      }
    },
    verdict: {
      label: finalLabel,
      headline,
      meaning,
      score: finalScore,
      confidenceLevel
    },
    confidence: confidenceAssessment,
    reasons,
    matches,
    references,
    sources: {
      status: matchedFactChecks.length > 0 ? 'checked' : 'not_checked',
      items: matchedFactChecks.slice(0, 5)
    },
    nextSteps,
    checks,
    technical: {
      wordCount: metrics.wordCount,
      charCount: metrics.charCount,
      sentenceCount: metrics.sentenceCount,
      readingEase: `${metrics.readingEase}/100`,
      gradeLevel: metrics.gradeLevel,
      lexicalDiversity: `${Math.round(metrics.lexicalDiversity * 100)}%`,
      subjectivityIndex: `${Math.round(metrics.subjectivityIndex * 100)}%`,
      emotionalIntensity: `${Math.round(metrics.emotionalIntensity * 100)}%`,
      clickbaitScore: `${Math.round(metrics.clickbaitScore * 100)}%`,
      sourceAttributionScore: `${Math.round(metrics.sourceAttributionScore * 100)}%`,
      factCheckMatches: matchedFactChecks.length,
      nlpEngine: llm ? llm.source : 'Open-Source Statistical & Rule-Based NLP Engine'
    },
    notices: [],
    disclaimer: 'Satya Lens gives signals, not final proof. Always check with trusted sources.',

    // Deprecated compatibility aliases
    truthScore: finalScore,
    confidence: confidenceAssessment.score / 100,
    label: finalLabel,
    summary: meaning,
    explanations: reasons.map(r => r.text)
  };
};
