const mongoose = require("mongoose");
const User = require("../user/user.model");
const Investment = require("../investment/investment.model");
const RoiHistory = require("../roi/roi.model");

/**
 * Return aggregated dashboard stats for a user in minimal DB round-trips.
 * Runs three queries in parallel:
 *  1. User wallet fields (lean read)
 *  2. Investment aggregate (totals grouped by status)
 *  3. Last 5 ROI credits
 *
 * @param {string|ObjectId} userId
 * @returns {object} dashboard payload
 */
const getDashboardStats = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [user, investmentStats, recentRoi] = await Promise.all([
    User.findById(userObjectId)
      .select("fullName referralCode walletBalance totalRoiEarned totalLevelIncomeEarned")
      .lean(),

    Investment.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id:         "$status",
          count:       { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]),

    RoiHistory.find({ user: userObjectId })
      .select("roiAmount date status investment")
      .sort({ date: -1 })
      .limit(5)
      .lean(),
  ]);

  if (!user) throw { status: 404, message: "User not found." };

  // Reshape the investment aggregation result into a clean object
  const inv = { Active: 0, Completed: 0, Cancelled: 0, totalAmount: 0 };
  investmentStats.forEach((s) => {
    inv[s._id] = s.count;
    inv.totalAmount += s.totalAmount;
  });

  return {
    wallet: {
      balance:                user.walletBalance,
      totalRoiEarned:         user.totalRoiEarned,
      totalLevelIncomeEarned: user.totalLevelIncomeEarned,
      totalEarned:            +(user.totalRoiEarned + user.totalLevelIncomeEarned).toFixed(8),
    },
    investments: {
      active:        inv.Active,
      completed:     inv.Completed,
      cancelled:     inv.Cancelled,
      totalInvested: inv.totalAmount,
    },
    recentRoi,
  };
};

module.exports = { getDashboardStats };
