const { test, describe } = require('node:test');
const assert = require('node:assert');
const { matchLocalFactChecks } = require('../src/utils/factCheckMatcher');

describe('Local Fact-Check Matching (Strict Matching & Debunking Rejection)', () => {
  test('must NOT match benign health advice: "Health officials confirmed the covid virus vaccine is safe according to the WHO"', () => {
    const text = 'Health officials confirmed the covid virus vaccine is safe according to the WHO';
    const matches = matchLocalFactChecks(text);
    assert.strictEqual(matches.length, 0, 'Must not match generic covid/virus/vaccine words');
  });

  test('must NOT match sunset observation: "The sun will set in the west tonight and NASA said it will be a clear sky"', () => {
    const text = 'The sun will set in the west tonight and NASA said it will be a clear sky';
    const matches = matchLocalFactChecks(text);
    assert.strictEqual(matches.length, 0, 'Must not match sunset observation');
  });

  test('must NOT match warm water medical advice: "Doctors recommend drinking warm water to ease a cold"', () => {
    const text = 'Doctors recommend drinking warm water to ease a cold';
    const matches = matchLocalFactChecks(text);
    assert.strictEqual(matches.length, 0, 'Must not match harmless drinking warm water advice');
  });

  test('must NOT match debunking report: "Fake news: some people say the moon landing was staged, but Apollo evidence disproves it"', () => {
    const text = 'Fake news: some people say the moon landing was staged, but Apollo evidence disproves it';
    const matches = matchLocalFactChecks(text);
    assert.strictEqual(matches.length, 0, 'Must reject text containing debunking words (disproves)');
  });

  test('MUST match specific 5G rumor: "5G towers spread covid virus radiation"', () => {
    const text = '5G towers spread covid virus radiation';
    const matches = matchLocalFactChecks(text);
    assert.ok(matches.length >= 1, 'Must match 5G radiation virus rumor');
    assert.strictEqual(matches[0].publisher, 'Reuters Fact Check');
    assert.strictEqual(matches[0].rating, 'False');
    assert.strictEqual(matches[0].isLocalRegistry, true);
    assert.strictEqual(matches[0].similarityNote, 'Similar claim previously fact-checked');
  });

  test('MUST match Apollo moon landing hoax: "Apollo moon landing was faked in a Hollywood studio"', () => {
    const text = 'Apollo moon landing was faked in a Hollywood studio';
    const matches = matchLocalFactChecks(text);
    assert.ok(matches.length >= 1, 'Must match Apollo moon landing faked rumor');
    assert.strictEqual(matches[0].publisher, 'Reuters Fact Check');
    assert.strictEqual(matches[0].rating, 'False');
    assert.strictEqual(matches[0].isLocalRegistry, true);
  });

  test('every entry in factChecks.json has verifiedOn and valid URL', () => {
    const factCheckData = require('../src/data/factChecks.json');
    for (const entry of factCheckData) {
      assert.ok(entry.verifiedOn, `Missing verifiedOn in entry: ${entry.claim}`);
      assert.ok(entry.url.startsWith('https://'), `Invalid URL in entry: ${entry.url}`);
      assert.ok(entry.phrases && entry.phrases.length >= 3, `Need at least 3 specific phrases in entry: ${entry.claim}`);
    }
  });
});

