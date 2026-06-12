/**
 * Wraps an async route handler and forwards any thrown errors to Express's
 * next(err) so the global error handler can process them uniformly.
 *
 * @param {Function} fn - async (req, res, next) handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
