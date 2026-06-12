const Investment = require("../modules/investment/investment.model");
const { processDailyROI, normalizeToMidnightUTC } = require("../services/roiService");
const { processLevelIncome } = require("../services/levelIncomeService");

/**
 * runDailyDistribution
 * ────────────────────
 * Orchestrator that:
 *   1. Runs the daily ROI calculation for all active investments.
 *   2. Collects the list of successfully credited investments.
 *   3. Passes them to the level-income distributor.
 *   4. Returns a combined summary for logging.
 *
 * This function is called both by the cron job (automatically at midnight)
 * and by the admin trigger endpoint (for manual / backfill runs).
 *
 * @param {Date} [targetDate=new Date()]  Date to process (defaults to today)
 * @returns {Promise<{ roi: object, levelIncome: object }>}
 */
const runDailyDistribution = async (targetDate = new Date()) => {
  const creditDate = normalizeToMidnightUTC(targetDate);

  console.log(`[Distribution] Starting for date: ${creditDate.toISOString().split("T")[0]}`);

  // ── Step 1: Process ROI ───────────────────────────────────────────────────
  const roiSummary = await processDailyROI(targetDate);

  console.log(
    `[ROI]  Processed: ${roiSummary.totalProcessed} | ` +
    `Credited: ${roiSummary.totalCredited} | ` +
    `Skipped: ${roiSummary.totalSkipped} | ` +
    `Failed: ${roiSummary.totalFailed} | ` +
    `Completed investments: ${roiSummary.completedInvestments}`
  );
  if (roiSummary.errors.length) console.error("[ROI]  Errors:", roiSummary.errors);

  // ── Step 2: Build the list of investments credited today ──────────────────
  // We re-query investments that received ROI today rather than trusting the
  // in-memory summary, so the list is accurate even after partial runs.
  const creditedInvestments = await Investment.find({
    status:  "Active",
    endDate: { $gte: creditDate },
  }).select("_id user amount dailyRoiPercent").lean();

  const creditedROIs = creditedInvestments.map((inv) => ({
    userId:       inv.user,
    investmentId: inv._id,
    roiAmount:    parseFloat(((inv.amount * inv.dailyRoiPercent) / 100).toFixed(8)),
  }));

  // ── Step 3: Process level income ─────────────────────────────────────────
  const levelSummary = await processLevelIncome(creditedROIs, targetDate);

  console.log(
    `[Level] Investees: ${levelSummary.totalInvestees} | ` +
    `Credited: ${levelSummary.totalCredited} | ` +
    `Skipped: ${levelSummary.totalSkipped} | ` +
    `Failed: ${levelSummary.totalFailed}`
  );
  if (levelSummary.errors.length) console.error("[Level] Errors:", levelSummary.errors);

  console.log(`[Distribution] Complete for ${creditDate.toISOString().split("T")[0]}`);

  return { roi: roiSummary, levelIncome: levelSummary };
};

module.exports = { runDailyDistribution };
