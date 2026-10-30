class AppError extends Error {
  /**
   * @param {number} status - HTTP status code (400, 404, 413, 429, 500, etc.)
   * @param {string} code - Machine-readable error code
   * @param {string} message - Plain English message for the end user
   */
  constructor(status, code, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

module.exports = { AppError };

