const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('Vercel Serverless Entrypoint (api/index.js)', () => {
  test('successfully loads api/index.js using root dependencies', () => {
    const apiApp = require('../../api/index.js');
    assert.ok(apiApp, 'api/index.js must export an Express application');
    assert.strictEqual(typeof apiApp.handle, 'function', 'Exported object must be a valid Express app');
  });
});

