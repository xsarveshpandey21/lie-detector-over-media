const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { verifyRegistry } = require('../../scripts/verifyReferences');

describe('Dead-Link Checker Unit Tests (Mocked HTTP)', () => {
  it('marks reference verified when HTTP returns 200 and matches content', async () => {
    const mockClient = {
      get: async (url) => {
        return {
          status: 200,
          data: '<html><title>Apollo 11 Mission Overview</title><body>NASA moon landing lunar surface documentation</body></html>'
        };
      }
    };

    const mockEntries = [
      {
        id: 'mock-001',
        publisher: 'NASA',
        claim: 'Apollo 11 landed on the moon.',
        phrases: ['apollo 11', 'lunar surface'],
        url: 'https://example.com/apollo-11',
        verificationStatus: 'unverified'
      }
    ];

    const result = await verifyRegistry({
      entries: mockEntries,
      httpClient: mockClient,
      silent: true,
      noExit: true
    });

    assert.strictEqual(result.passed, 1);
    assert.strictEqual(result.failed, 0);
    assert.strictEqual(mockEntries[0].verificationStatus, 'verified');
    assert.ok(mockEntries[0].verifiedOn);
  });

  it('marks reference unverified when HTTP returns 404 dead link', async () => {
    const mockClient = {
      get: async () => {
        const err = new Error('Request failed with status code 404');
        err.response = { status: 404 };
        throw err;
      }
    };

    const mockEntries = [
      {
        id: 'mock-dead-001',
        publisher: 'Test Org',
        claim: 'Dead link claim.',
        phrases: ['dead link'],
        url: 'https://example.com/404-link',
        verificationStatus: 'verified'
      }
    ];

    const result = await verifyRegistry({
      entries: mockEntries,
      httpClient: mockClient,
      silent: true,
      noExit: true
    });

    assert.strictEqual(result.passed, 0);
    assert.strictEqual(result.failed, 1);
    assert.strictEqual(mockEntries[0].verificationStatus, 'unverified');
    assert.strictEqual(result.report[0].status, 'FAILED');
  });
});

