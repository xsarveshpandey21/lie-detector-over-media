const { test, describe } = require('node:test');
const assert = require('node:assert');
const { normalizeLabel } = require('../src/utils/labels');

describe('normalizeLabel helper', () => {
  test('correctly handles negations as false', () => {
    assert.strictEqual(normalizeLabel('untrue'), 'false');
    assert.strictEqual(normalizeLabel('not true'), 'false');
    assert.strictEqual(normalizeLabel('not accurate'), 'false');
    assert.strictEqual(normalizeLabel('False'), 'false');
    assert.strictEqual(normalizeLabel('fake news'), 'false');
    assert.strictEqual(normalizeLabel('misleading'), 'false');
    assert.strictEqual(normalizeLabel('incorrect statement'), 'false');
    assert.strictEqual(normalizeLabel('pants-on-fire'), 'false');
  });

  test('correctly handles positive verifications as true', () => {
    assert.strictEqual(normalizeLabel('True'), 'true');
    assert.strictEqual(normalizeLabel('accurate'), 'true');
    assert.strictEqual(normalizeLabel('correct'), 'true');
    assert.strictEqual(normalizeLabel('likely_true'), 'true');
    assert.strictEqual(normalizeLabel('factual'), 'true');
  });

  test('falls back to uncertain for neutral or unparseable input', () => {
    assert.strictEqual(normalizeLabel(''), 'uncertain');
    assert.strictEqual(normalizeLabel(null), 'uncertain');
    assert.strictEqual(normalizeLabel(undefined), 'uncertain');
    assert.strictEqual(normalizeLabel('half-true'), 'uncertain');
    assert.strictEqual(normalizeLabel('cannot determine'), 'uncertain');
  });
});

