const crypto = require("crypto");

/**
 * Generate a cryptographically random 8-character uppercase referral code.
 * e.g. "A3F2B1C4"
 * Uniqueness must be verified by the caller before persisting.
 *
 * @returns {string}
 */
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
};

module.exports = generateReferralCode;
