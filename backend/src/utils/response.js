/**
 * Standardised API response helpers.
 * Every response from the API follows the same envelope shape:
 *   { status, message, data? }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {*}      data       - payload to return
 * @param {string} message    - human-readable success message
 * @param {number} statusCode - HTTP status (default 200)
 */
const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  const payload = { status: "success", message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string}   message    - human-readable error message
 * @param {number}   statusCode - HTTP status (default 400)
 * @param {string[]} [errors]   - optional array of field-level error strings
 */
const sendError = (res, message = "An error occurred", statusCode = 400, errors = null) => {
  const payload = { status: "error", message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
