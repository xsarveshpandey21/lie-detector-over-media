const { test, describe } = require('node:test');
const assert = require('node:assert');
const detectUrl = require('../src/services/detectors/url');
const detectImage = require('../src/services/detectors/image');
const { searchFactChecks } = require('../src/services/crossVerify');

describe('URL Detector', () => {
  test('flags reuters.com and bbc.co.uk as trusted sources', async () => {
    const resReuters = await detectUrl('https://www.reuters.com/world');
    assert.strictEqual(resReuters.verdict.label, 'likely_true');
    assert.strictEqual(resReuters.technical.isTrusted, true);

    const resBbc = await detectUrl('https://bbc.co.uk/news');
    assert.strictEqual(resBbc.verdict.label, 'likely_true');
    assert.strictEqual(resBbc.technical.isTrusted, true);
  });

  test('flags lookalike / typosquatting domain reuterss.com', async () => {
    const res = await detectUrl('https://reuterss.com/fake');
    assert.strictEqual(res.verdict.label, 'likely_false');
    assert.strictEqual(res.technical.lookalikeTarget, 'reuters.com');
  });

  test('flags IP address host', async () => {
    const res = await detectUrl('http://192.168.1.1/login');
    assert.strictEqual(res.verdict.label, 'likely_false');
    assert.strictEqual(res.technical.isIpAddress, true);
    assert.strictEqual(res.technical.https, false);
  });

  test('flags unencrypted http protocol', async () => {
    const res = await detectUrl('http://example.com/test');
    assert.strictEqual(res.technical.https, false);
    const hasHttpWarning = res.reasons.some(r => r.tone === 'warn' && r.text.includes('not secure'));
    assert.strictEqual(hasHttpWarning, true);
  });

  test('flags shortener domains like bit.ly', async () => {
    const res = await detectUrl('https://bit.ly/3xyz');
    assert.strictEqual(res.technical.isShortener, true);
    assert.strictEqual(res.verdict.label, 'uncertain');
  });
});

describe('Fact Check Cross Verification', () => {
  test('returns not_checked without API key (never invents fake results)', async () => {
    const originalKey = process.env.FACT_CHECK_GOOGLE_API_KEY;
    delete process.env.FACT_CHECK_GOOGLE_API_KEY;

    try {
      const res = await searchFactChecks('Some breaking news claim');
      assert.strictEqual(res.status, 'not_checked');
      assert.deepStrictEqual(res.items, []);
    } finally {
      if (originalKey) process.env.FACT_CHECK_GOOGLE_API_KEY = originalKey;
    }
  });
});

describe('Image Detector', () => {
  test('returns score null and AI detection not run when no external model configured', async () => {
    const originalUrl = process.env.IMAGE_DETECTOR_URL;
    delete process.env.IMAGE_DETECTOR_URL;

    try {
      // Create minimal valid JPEG buffer: 0xFFD8FF...
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9]);
      const mockFile = {
        buffer: jpegBuffer,
        originalname: 'test_photo.jpg',
        mimetype: 'image/jpeg'
      };

      const res = await detectImage(mockFile);
      assert.strictEqual(res.verdict.score, null);
      assert.strictEqual(res.verdict.label, 'uncertain');
      assert.strictEqual(res.verdict.headline, "We can't tell from the file alone");

      const aiCheck = res.checks.find(c => c.name === 'AI-generated media detection');
      assert.strictEqual(aiCheck?.ran, false);
    } finally {
      if (originalUrl) process.env.IMAGE_DETECTOR_URL = originalUrl;
    }
  });
});
