const dashboardService = require("./dashboard.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/response");

/**
 * GET /api/v1/dashboard
 */
const getDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats(req.user._id);
  return sendSuccess(res, stats, "Dashboard stats fetched successfully.");
});

module.exports = { getDashboard };
