const mongoose = require("mongoose");
const Investment = require("../modules/investment/investment.model");
const RoiHistory = require("../modules/roi/roi.model");
const User       = require("../modules/user/user.model");

/**
 * normalizeToMidnightUTC
 * ──────────────────────
 * Returns a new Date set to 00:00:00.000 UTC for the given date.
 * All ROI records are keyed on midnight-UTC so that the unique index
 * { investment, date } reliably prevents double-crediting.
 *
 * @param {Date} date
 * @returns {Date}
 */
const normalizeToMidnightUTC = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * calculateDailyROI
 * ─────────────────
 * Pure function — no DB side-effects.
 * Returns the ROI amount for one investment on one day, rounded to 8 decimal
 * places (sufficient for both USD and crypto precision).
 *
 * Formula: amount × (dailyRoiPercent / 100)
 *
 * @param {number} amount          Principal investment amount
 * @param {number} dailyRoiPercent Daily ROI percentage (e.g. 1.5 = 1.5%)
 * @returns {number}
 */
const calculateDailyROI = (amount, dailyRoiPercent) => {
  return parseFloat(((amount * dailyRoiPercent) / 100).toFixed(8));
};

/**
 * processDailyROI
 * ───────────────
 * Core business logic for Task 3 — Daily ROI Distribution.
 *
 * Algorithm:
 *  1. Fetch all Active investments whose endDate has not yet passed.
 *  2. For each investment:
 *     a. Calculate today's ROI amount.
 *     b. Attempt to insert an RoiHistory document (unique index guards duplicates).
 *        - If the document already exists (code 11000), skip silently.
 *        - If any other error occurs, record it and continue (fail-safe).
 *     c. On success: atomically increment the user's walletBalance and
 *        totalRoiEarned, and the investment's totalRoiPaid.
 *  3. Mark investments whose endDate ≤ today as Completed.
 *  4. Return a structured summary for logging / API response.
 *
 * Idempotency guarantee:
 *  Running this function multiple times on the same day is safe.
 *  The unique compound index { investment, date } on RoiHistory rejects
 *  any duplicate insert, and the wallet increment only runs on a successful
 *  new insert — so no user is ever credited twice for the same day.
 *
 * @param {Date} [targetDate=new Date()]  Date to process ROI for (defaults to today)
 * @returns {Promise<{
 *   processedDate: string,
 *   totalProcessed: number,
 *   totalCredited: number,
 *   totalSkipped:  number,
 *   totalFailed:   number,
 *   completedInvestments: number,
 *   errors: string[]
 * }>}
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
      // Duplicate key = already processed for this date — skip silently
      if (err.code === 11000) {
        summary.totalSkipped++;
      } else {
        summary.totalFailed++;
        summary.errors.push(
          `Investment ${investment._id} (user ${investment.user}): ${err.message}`
        );
      }
    }
  }

  // ── Step 4: Mark expired investments as Completed ─────────────────────────
  // An investment is "Completed" once its endDate has passed.
  // We run this separately so even investments skipped above get closed.
  const expiredResult = await Investment.updateMany(
    { status: "Active", endDate: { $lt: creditDate } },
    { $set: { status: "Completed" } }
  );
  summary.completedInvestments = expiredResult.modifiedCount;

  return summary;
};

module.exports = { processDailyROI, calculateDailyROI, normalizeToMidnightUTC };
