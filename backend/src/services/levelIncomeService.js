const mongoose = require("mongoose");
const User      = require("../modules/user/user.model");
const Referral  = require("../modules/referral/referral.model");
const { REFERRAL_LEVEL_PERCENTS, MAX_REFERRAL_LEVELS } = require("../config/plans");
const { normalizeToMidnightUTC } = require("./roiService");

/**
 * Pure function. Returns the level income for one ancestor based on the
 * investee's daily ROI and the level percentage from config/plans.js.
 */
const calculateLevelIncome = (investeeDailyRoi, level) => {
  const percent = REFERRAL_LEVEL_PERCENTS[level];
  if (!percent) return 0;
  return parseFloat(((investeeDailyRoi * percent) / 100).toFixed(8));
};

/**
 * Walks the referredBy chain upward from startUserId up to MAX_REFERRAL_LEVELS deep.
 * Returns an ordered array of ancestors: [{ userId, level }, ...]
 */
const getUplineChain = async (startUserId) => {
  const chain = [];
  let currentUserId = startUserId;

  for (let level = 1; level <= MAX_REFERRAL_LEVELS; level++) {
    const user = await User.findById(currentUserId).select("referredBy").lean();

    if (!user || !user.referredBy) break;

    chain.push({ userId: user.referredBy, level });
    currentUserId = user.referredBy;
  }

  return chain;
};

/**
 * Distributes level income to all upline ancestors for each credited investment.
 * Idempotent: the unique index { recipient, investment, level, creditDate } on
 * Referral silently skips records already processed for that day.
 */
const processLevelIncome = async (creditedROIs, targetDate = new Date()) => {
  const creditDate = normalizeToMidnightUTC(targetDate);

  const summary = {
    processedDate:  creditDate.toISOString().split("T")[0],
    totalInvestees: creditedROIs.length,
    totalCredited:  0,
    totalSkipped:   0,
    totalFailed:    0,
    errors:         [],
  };

  for (const { userId, investmentId, roiAmount } of creditedROIs) {
    let uplineChain;
    try {
      uplineChain = await getUplineChain(userId);
    } catch (err) {
      summary.totalFailed++;
      summary.errors.push(`getUplineChain for user ${userId}: ${err.message}`);
      continue;
    }

    if (uplineChain.length === 0) continue;

    for (const { userId: recipientId, level } of uplineChain) {
      try {
        const incomeAmount = calculateLevelIncome(roiAmount, level);
        if (incomeAmount <= 0) continue;

        // Unique index prevents duplicate credits for the same day
        await Referral.create({
          recipient:    recipientId,
          fromUser:     userId,
          investment:   investmentId,
          level,
          incomeAmount,
          creditDate,
        });

        await User.findByIdAndUpdate(recipientId, {
          $inc: {
            walletBalance:          incomeAmount,
            totalLevelIncomeEarned: incomeAmount,
          },
        });

        summary.totalCredited++;

      } catch (err) {
        if (err.code === 11000) {
          summary.totalSkipped++; // already credited today
        } else {
        } else {
          summary.totalFailed++;
          summary.errors.push(
            `Level ${level} income for recipient ${recipientId} from investment ${investmentId}: ${err.message}`
          );
        }
      }
    }
  }

  return summary;
};

module.exports = { processLevelIncome, calculateLevelIncome, getUplineChain };
