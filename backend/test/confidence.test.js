const { describe, it } = require('node:test');
const assert = require('node:assert');
const { evaluateConfidence } = require('../src/services/confidence');

describe('Confidence Assessment Engine', () => {
  it('returns high confidence for live fact-check match with same_claim', () => {
    const result = evaluateConfidence({
      matches: [
        {
          matchType: 'live_api',
          relation: 'same_claim',
          matchStrength: 95
        }
      ]
    });
    assert.strictEqual(result.level, 'high');
    assert.ok(result.score >= 85);
    assert.match(result.reason, /exact claim/i);
  });

  it('returns high confidence when semantic similarity and NLI both agree', () => {
    const result = evaluateConfidence({
      matches: [
        {
          matchType: 'registry_semantic',
          relation: 'same_claim',
          matchStrength: 90
        }
      ]
    });
    assert.strictEqual(result.level, 'high');
    assert.ok(result.score >= 85);
  });

  it('returns medium confidence for strong registry phrase match (>= 80%)', () => {
    const result = evaluateConfidence({
      matches: [
        {
          matchType: 'registry_phrase',
          relation: 'similar_claim',
          matchStrength: 85
        }
      ]
    });
    assert.strictEqual(result.level, 'medium');
    assert.match(result.reason, /similarity/i);
  });

  it('returns medium confidence for clear style signals plus external model', () => {
    const result = evaluateConfidence({
      matches: [],
      nlpMetrics: {
        clickbaitScore: 0.5,
        sensationalHits: 2,
        urgencyHits: 1
      },
      externalModel: {
        confidence: 0.8
      }
    });
    assert.strictEqual(result.level, 'medium');
    assert.match(result.reason, /writing style patterns/i);
  });

  it('returns low confidence when only style signals exist without external evidence', () => {
    const result = evaluateConfidence({
      matches: [],
      nlpMetrics: {
        clickbaitScore: 0.1,
        sensationalHits: 0,
        urgencyHits: 0,
        sourceAttributionScore: 0.1
      },
      externalModel: null
    });
    assert.strictEqual(result.level, 'low');
    assert.match(result.reason, /linguistic writing style signals only/i);
  });
});

