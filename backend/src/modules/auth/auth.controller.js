const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/response");

/**
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password, referralCode } = req.body;

  if (!fullName || !email || !mobile || !password) {
    return sendError(res, "fullName, email, mobile, and password are required.", 400);
  }

  const data = await authService.register({ fullName, email, mobile, password, referralCode });
  return sendSuccess(res, data, "Registration successful.", 201);
});

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, "Email and password are required.", 400);
  }

  const data = await authService.login({ email, password });
  return sendSuccess(res, data, "Login successful.");
});

/**
 * GET /api/v1/auth/me  (protected)
 */
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user }, "Profile fetched successfully.");
});

module.exports = { register, login, getMe };
