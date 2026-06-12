const jwt = require("jsonwebtoken");

/**
 * Sign and return a JWT for a given user ID.
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
