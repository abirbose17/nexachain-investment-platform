const jwt = require("jsonwebtoken");
const User = require("../modules/user/user.model");
const asyncHandler = require("../utils/asyncHandler");
const { sendError } = require("../utils/response");

/**
 * Protect middleware — verifies the Bearer JWT, attaches req.user.
 * Usage: router.get("/private", protect, controller)
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "Access denied. No token provided.", 401);
  }

  const token = authHeader.split(" ")[1];

  // jwt.verify throws JsonWebTokenError / TokenExpiredError on failure —
  // both are caught by asyncHandler and forwarded to the global error handler.
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).lean();

  if (!user) {
    return sendError(res, "The user belonging to this token no longer exists.", 401);
  }

  if (user.accountStatus !== "Active") {
    return sendError(res, "Your account is suspended or inactive.", 403);
  }

  req.user = user;
  next();
});

module.exports = { protect };
