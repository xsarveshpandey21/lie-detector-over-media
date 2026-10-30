const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

describe('API Route Validation & Status Codes', () => {
  test('GET /api/health returns operational status and boolean integration flags', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.name, 'Lie Detector Over Media');
    assert.strictEqual(res.body.author, 'Sarvesh Pandey');
    assert.strictEqual(typeof res.body.integrations.factCheckApi, 'boolean');
  });

  test('POST /api/analyze returns 400 on empty text', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ type: 'text', text: '   ' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'empty_text');
  });

  test('POST /api/analyze returns 400 on text over 5000 characters', async () => {
    const longText = 'A'.repeat(5001);
    const res = await request(app)
      .post('/api/analyze')
      .send({ type: 'text', text: longText });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'text_too_long');
  });

  test('POST /api/analyze returns 400 on invalid URL', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ type: 'url', url: 'not-a-valid-domain-url-without-dots' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'invalid_url');
  });

  test('POST /api/analyze returns 400 on unknown or unsupported content type', async () => {
    const res = await request(app)
      .post('/api/analyze')
      .send({ type: 'telepathy' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'unsupported_type');
  });

  test('POST /api/analyze returns 400 on wrong file type (e.g. text/html when image expected)', async () => {
    const textBuffer = Buffer.from('<html><body>not an image</body></html>');
    const res = await request(app)
      .post('/api/analyze')
      .field('type', 'image')
      .attach('file', textBuffer, { filename: 'test.html', contentType: 'text/html' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'invalid_file_type');
  });

  test('POST /api/analyze returns 413 on file exceeding MAX_UPLOAD_MB (4 MB)', async () => {
    // 4.5 MB buffer
    const largeBuffer = Buffer.alloc(4.5 * 1024 * 1024);
    const res = await request(app)
      .post('/api/analyze')
      .field('type', 'image')
      .attach('file', largeBuffer, { filename: 'huge.jpg', contentType: 'image/jpeg' });

    assert.strictEqual(res.status, 413);
    assert.strictEqual(res.body.error, 'file_too_large');
  });

  test('CORS in production without ALLOWED_ORIGIN allows same-origin and rejects cross-origin', async () => {
    const origEnv = process.env.NODE_ENV;
    const origAllowed = process.env.ALLOWED_ORIGIN;
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGIN;

    try {
      // Same-origin request: Origin matches Host
      const resSame = await request(app)
        .get('/api/health')
        .set('Host', 'liedetectorovermedia.com')
        .set('Origin', 'https://liedetectorovermedia.com');
      assert.strictEqual(resSame.status, 200);

      // Cross-origin request: Origin differs from Host
      const resCross = await request(app)
        .get('/api/health')
        .set('Host', 'liedetectorovermedia.com')
        .set('Origin', 'https://malicious-external-site.com');
      assert.strictEqual(resCross.status, 403);
      assert.strictEqual(resCross.body.error, 'cors_forbidden');
    } finally {
      process.env.NODE_ENV = origEnv;
      if (origAllowed) process.env.ALLOWED_ORIGIN = origAllowed;
    }
  });
});

