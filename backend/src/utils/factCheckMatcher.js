/**
 * Re-exports from shared claimMatcher service for backward compatibility
 */
const {
  matchLocalFactChecks,
  matchClaimAgainstRegistry,
  DEBUNKING_PATTERNS
} = require('../services/claimMatcher');

module.exports = {
  matchLocalFactChecks,
  matchClaimAgainstRegistry,
  DEBUNKING_PATTERNS
};
