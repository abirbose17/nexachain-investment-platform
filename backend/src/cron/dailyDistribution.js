const Investment = require("../modules/investment/investment.model");
const { processDailyROI, normalizeToMidnightUTC } = require("../services/roiService");
const { processLevelIncome } = require("../services/levelIncomeService");
const logger = require("../utils/logger");

/**
 * Orchestrates the daily run: ROI distribution first, then level income.
 * Called by the cron job and by the admin trigger endpoint.
 */
const runDailyDistribution = async (targetDate = new Date()) => {
  const creditDate = normalizeToMidnightUTC(targetDate);

  logger.info(`[Distribution] Starting for date: ${creditDate.toISOString().split("T")[0]}`);

  const roiSummary = await processDailyROI(targetDate);

  logger.info(
    `[ROI]  Processed: ${roiSummary.totalProcessed} | ` +
    `Credited: ${roiSummary.totalCredited} | ` +
    `Skipped: ${roiSummary.totalSkipped} | ` +
    `Failed: ${roiSummary.totalFailed} | ` +
    `Completed investments: ${roiSummary.completedInvestments}`
  );
  if (roiSummary.errors.length) logger.error("[ROI]  Errors", { errors: roiSummary.errors });

  // Re-query active investments to build the level income input list.
  // This keeps the list accurate even after a partial ROI run.
  const creditedInvestments = await Investment.find({
    status:  "Active",
    endDate: { $gte: creditDate },
  }).select("_id user amount dailyRoiPercent").lean();

  const creditedROIs = creditedInvestments.map((inv) => ({
    userId:       inv.user,
    investmentId: inv._id,
    roiAmount:    parseFloat(((inv.amount * inv.dailyRoiPercent) / 100).toFixed(8)),
  }));


  const levelSummary = await processLevelIncome(creditedROIs, targetDate);

  logger.info(
    `[Level] Investees: ${levelSummary.totalInvestees} | ` +
    `Credited: ${levelSummary.totalCredited} | ` +
    `Skipped: ${levelSummary.totalSkipped} | ` +
    `Failed: ${levelSummary.totalFailed}`
  );
  if (levelSummary.errors.length) logger.error("[Level] Errors", { errors: levelSummary.errors });

  logger.info(`[Distribution] Complete for ${creditDate.toISOString().split("T")[0]}`);

  return { roi: roiSummary, levelIncome: levelSummary };
};

module.exports = { runDailyDistribution };
