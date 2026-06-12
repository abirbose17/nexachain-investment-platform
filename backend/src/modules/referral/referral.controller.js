const referralService = require("./referral.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/response");

/**
 * GET /api/v1/referrals/direct
 */
const getDirectReferrals = asyncHandler(async (req, res) => {
  const referrals = await referralService.getDirectReferrals(req.user._id);
  return sendSuccess(
    res,
    { count: referrals.length, referrals },
    "Direct referrals fetched successfully."
  );
});

/**
 * GET /api/v1/referrals/tree
 */
const getReferralTree = asyncHandler(async (req, res) => {
  const tree = await referralService.getReferralTree(req.user._id);
  return sendSuccess(res, tree, "Referral tree fetched successfully.");
});

/**
 * GET /api/v1/referrals/earnings
 */
const getReferralEarnings = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const data = await referralService.getReferralEarnings(req.user._id, { page, limit });
  return sendSuccess(res, data, "Referral earnings fetched successfully.");
});

module.exports = { getDirectReferrals, getReferralTree, getReferralEarnings };
