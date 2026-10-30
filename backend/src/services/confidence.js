/**
 * Satya Lens - Confidence Assessment Engine
 *
 * Confidence Rules:
 * - HIGH: Live fact-check match (same claim) OR semantic similarity + NLI both agree.
 * - MEDIUM: Registry phrase match >= 0.8 OR clear style signals plus one other signal.
 * - LOW: Style signals only, or no external evidence.
 *
 * Never claims certainty. Provides plain-English transparency for the confidence score.
 */

/**
 * Calculates confidence level and transparent explanation
 *
 * @param {Object} params
 * @param {Array<Object>} [params.matches=[]] - Fact-check matches
 * @param {Object} [params.nlpMetrics={}] - Linguistic & NLP metrics
 * @param {Object|null} [params.externalModel=null] - Optional transformer / external model verdict
 * @param {string} [params.contentType='text'] - Type of content checked
 * @returns {{ level: 'high'|'medium'|'low', score: number, reason: string }}
 */
function evaluateConfidence({
  matches = [],
  nlpMetrics = {},
  externalModel = null,
  contentType = 'text'
} = {}) {
  // 1. High Confidence: Live fact-check match of the same claim, or semantic+NLI agreement
  const hasLiveSameClaim = matches.some(m => m.matchType === 'live_api' && m.relation === 'same_claim');
  const hasSemanticNliAgreement = matches.some(m => m.matchType === 'registry_semantic' && m.relation === 'same_claim');

  if (hasLiveSameClaim) {
    return {
      level: 'high',
      score: 92,
      reason: 'High because a published independent fact-checker investigated this exact claim.'
    };
  }

  if (hasSemanticNliAgreement) {
    return {
      level: 'high',
      score: 88,
      reason: 'High because neural semantic analysis and natural language inference both verified this claim against documented evidence.'
    };
  }

  // Content-type specific high confidence (e.g. known malicious link or definitive cryptographic signature)
  if (contentType === 'url' && nlpMetrics.isKnownMalicious) {
    return {
      level: 'high',
      score: 95,
      reason: 'High because this link is documented on official web security threat registries.'
    };
  }

  // 2. Medium Confidence:
  // - Registry phrase match >= 0.8 (matchStrength >= 80)
  // - Clear style signals plus one other signal (external model, local match, or strong citations)
  const strongRegistryMatch = matches.some(m => m.matchStrength >= 80);
  const anyRegistryMatch = matches.length > 0;

  const hasClearStyleSignals = Boolean(
    (nlpMetrics.clickbaitScore >= 0.35) ||
    (nlpMetrics.sensationalHits > 0 && nlpMetrics.urgencyHits > 0) ||
    (nlpMetrics.sourceAttributionScore >= 0.4)
  );

  const hasSecondSignal = Boolean(
    anyRegistryMatch ||
    externalModel ||
    (nlpMetrics.sourceAttributionScore >= 0.35 && nlpMetrics.wordCount >= 20)
  );

  if (strongRegistryMatch) {
    return {
      level: 'medium',
      score: 75,
      reason: 'Medium based on high similarity to a previously published fact-check investigation.'
    };
  }

  if (hasClearStyleSignals && hasSecondSignal) {
    const signalDesc = externalModel
      ? 'writing style patterns and an open-source language model signal'
      : anyRegistryMatch
        ? 'writing style patterns and a related fact-check match'
        : 'consistent writing style patterns and verifiable institutional citations';

    return {
      level: 'medium',
      score: 70,
      reason: `Medium based on ${signalDesc}.`
    };
  }

  if (anyRegistryMatch) {
    return {
      level: 'medium',
      score: 65,
      reason: 'Medium because a similar (not identical) claim was previously reviewed by fact-checkers.'
    };
  }

  if (externalModel && externalModel.confidence >= 0.75) {
    return {
      level: 'medium',
      score: 65,
      reason: 'Medium assisted by open-source sequence classification signals.'
    };
  }

  // 3. Low Confidence: Style signals only or no external evidence
  return {
    level: 'low',
    score: 45,
    reason: 'Low because this evaluation is based on linguistic writing style signals only, with no external fact-check evidence.'
  };
}

module.exports = {
  evaluateConfidence
};

