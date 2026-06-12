const mongoose = require("mongoose");
const User = require("../user/user.model");
const Referral = require("./referral.model");
const { MAX_REFERRAL_LEVELS } = require("../../config/plans");

/**
 * Fetch all direct (level-1) referrals for the authenticated user.
 *
 * @param {string|ObjectId} userId
 * @returns {User[]}
 */
const getDirectReferrals = async (userId) => {
  const referrals = await User.find({ referredBy: userId })
    .select("fullName email mobile referralCode accountStatus walletBalance createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return referrals;
};

/**
 * Build the full referral tree up to MAX_REFERRAL_LEVELS deep using
 * iterative BFS — avoids recursive DB calls and N+1 query patterns.
 *
 * @param {string|ObjectId} userId
 * @returns {{ totalLevels: number, tree: Array }}
 */
const getReferralTree = async (userId) => {
  const tree = [];
  let currentLevelIds = [new mongoose.Types.ObjectId(userId)];

  for (let level = 1; level <= MAX_REFERRAL_LEVELS; level++) {
    const members = await User.find({ referredBy: { $in: currentLevelIds } })
      .select("_id fullName email mobile referralCode accountStatus createdAt")
      .lean();

    if (members.length === 0) break;

    tree.push({
      level,
      count:   members.length,
      members,
    });

    currentLevelIds = members.map((u) => u._id);
  }

  return {
    totalLevels: tree.length,
    tree,
  };
};

/**
 * Get paginated referral / level income earnings for a user.
 *
 * @param {string|ObjectId} userId
 * @param {{ page?: number, limit?: number }} options
 * @returns {{ earnings: Referral[], pagination: object }}
 */
const getReferralEarnings = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [earnings, total] = await Promise.all([
    Referral.find({ recipient: userId })
      .populate("fromUser", "fullName email referralCode")
      .populate("investment", "amount plan status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Referral.countDocuments({ recipient: userId }),
  ]);

  return {
    earnings,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

module.exports = { getDirectReferrals, getReferralTree, getReferralEarnings };
