const { describe, it } = require('node:test');
const assert = require('node:assert');
const factCheckData = require('../src/data/factChecks.json');

describe('Reference Shape Validation', () => {
  it('every entry in factChecks.json conforms to Reference schema', () => {
    assert.ok(factCheckData.length > 0, 'Registry must not be empty');

    for (const entry of factCheckData) {
      assert.ok(entry.id, `Entry missing id: ${JSON.stringify(entry)}`);
      assert.ok(entry.publisher, `Entry missing publisher: ${entry.id}`);
      assert.ok(entry.claim, `Entry missing claim: ${entry.id}`);
      assert.ok(entry.rating, `Entry missing rating: ${entry.id}`);
      assert.ok(entry.ratingMeaning, `Entry missing ratingMeaning: ${entry.id}`);
      assert.ok(entry.url, `Entry missing url: ${entry.id}`);
      assert.match(entry.url, /^https?:\/\//i, `URL must start with http/https: ${entry.url}`);
      assert.match(entry.date, /^\d{4}-\d{2}-\d{2}$/, `Date must be YYYY-MM-DD: ${entry.date}`);
      assert.ok(entry.language, `Entry missing language: ${entry.id}`);
      assert.strictEqual(entry.verificationStatus, 'verified', `Only verified entries allowed: ${entry.id}`);
      assert.ok(entry.verifiedOn, `Entry missing verifiedOn: ${entry.id}`);
      assert.match(entry.verifiedOn, /^\d{4}-\d{2}-\d{2}$/, `verifiedOn must be YYYY-MM-DD: ${entry.verifiedOn}`);
      assert.ok(Array.isArray(entry.phrases), `phrases must be an array: ${entry.id}`);
      assert.ok(entry.phrases.length >= 3, `phrases must contain at least 3 items: ${entry.id}`);
    }
  });
});

