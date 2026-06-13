const mongoose = require("mongoose");
const Investment = require("../modules/investment/investment.model");
const RoiHistory = require("../modules/roi/roi.model");
const User       = require("../modules/user/user.model");

/**
 * Normalise a date to 00:00:00.000 UTC.
 * All ROI records are keyed on this value so the unique index { investment, date }
 * prevents double-crediting regardless of what time the job runs.
 */
const normalizeToMidnightUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Pure function. Returns the ROI amount for one investment on one day.
 * Formula: amount × (dailyRoiPercent / 100), rounded to 8 decimal places.
 */
const calculateDailyROI = (amount, dailyRoiPercent) => {
  return parseFloat(((amount * dailyRoiPercent) / 100).toFixed(8));
};

/**
 * Credits daily ROI to all active investments for the given date.
 * Idempotent: the unique index { investment, date } on RoiHistory silently
 * skips any investment already processed for that day (duplicate key 11000).
 */
const processDailyROI = async (targetDate = new Date()) => {
  const creditDate = normalizeToMidnightUTC(targetDate);

  const summary = {
    processedDate:        creditDate.toISOString().split("T")[0],
    totalProcessed:       0,
    totalCredited:        0,
    totalSkipped:         0,
    totalFailed:          0,
    completedInvestments: 0,
    errors:               [],
  };

  // ── Step 1: Fetch all active investments that haven't expired yet ─────────
  const activeInvestments = await Investment.find({
    status:  "Active",
    endDate: { $gte: creditDate },
  }).lean();

  summary.totalProcessed = activeInvestments.length;

  // ── Step 2: Process each investment ──────────────────────────────────────
  for (const investment of activeInvestments) {
    try {
      const roiAmount = calculateDailyROI(investment.amount, investment.dailyRoiPercent);

      // Attempt to insert ROI record — unique index prevents duplicates
      await RoiHistory.create({
        user:       investment.user,
        investment: investment._id,
        roiAmount,
        date:       creditDate,
        status:     "Credited",
      });

      // ── Step 3a: Atomically credit the user's wallet ─────────────────────
      // Using $inc ensures no race conditions even if multiple processes run.
      await User.findByIdAndUpdate(investment.user, {
        $inc: {
          walletBalance:  roiAmount,
          totalRoiEarned: roiAmount,
        },
      });

      // ── Step 3b: Update investment's running total ────────────────────────
      await Investment.findByIdAndUpdate(investment._id, {
        $inc: { totalRoiPaid: roiAmount },
      });

      summary.totalCredited++;

    } catch (err) {
      if (err.code === 11000) {
        summary.totalSkipped++; // already credited today
      } else {
        summary.totalFailed++;
        summary.errors.push(
          `Investment ${investment._id} (user ${investment.user}): ${err.message}`
        );
      }
    }
  }

  // Close out investments whose duration has ended
  const expiredResult = await Investment.updateMany(
    { status: "Active", endDate: { $lt: creditDate } },
    { $set: { status: "Completed" } }
  );
  summary.completedInvestments = expiredResult.modifiedCount;

  return summary;
};

module.exports = { processDailyROI, calculateDailyROI, normalizeToMidnightUTC };
