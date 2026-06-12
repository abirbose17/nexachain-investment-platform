const mongoose = require("mongoose");
const User      = require("../modules/user/user.model");
const Referral  = require("../modules/referral/referral.model");
const { REFERRAL_LEVEL_PERCENTS, MAX_REFERRAL_LEVELS } = require("../config/plans");
const { normalizeToMidnightUTC } = require("./roiService");

/**
 * calculateLevelIncome
 * ────────────────────
 * Pure function — no DB side-effects.
 * Returns the income amount for one upline level based on the investee's
 * daily ROI and the level's percentage rate.
 *
 * Formula:  investeeDailyRoi × (levelPercent / 100)
 *
 * @param {number} investeeDailyRoi  The ROI amount earned by the downline user today
 * @param {number} level             Referral level (1–5)
 * @returns {number}
 */
const calculateLevelIncome = (investeeDailyRoi, level) => {
  const percent = REFERRAL_LEVEL_PERCENTS[level];
  if (!percent) return 0;
  return parseFloat(((investeeDailyRoi * percent) / 100).toFixed(8));
};

/**
 * getUplineChain
 * ──────────────
 * Walks the referral hierarchy upward from a given user, collecting up to
 * MAX_REFERRAL_LEVELS ancestors.
 *
 * Uses iterative DB lookups (one per level) to avoid unbounded recursion.
 * Each lookup is a lean, index-covered query on `_id` — extremely fast.
 *
 * @param {mongoose.Types.ObjectId|string} startUserId  The investee's user ID
 * @returns {Promise<Array<{ userId: ObjectId, level: number }>>}
 *   Ordered list from level-1 (direct referrer) up to level-5
 */
const getUplineChain = async (startUserId) => {
  const chain = [];
  let currentUserId = startUserId;

  for (let level = 1; level <= MAX_REFERRAL_LEVELS; level++) {
    // Fetch only the referredBy field — single index-covered read
    const user = await User.findById(currentUserId).select("referredBy").lean();

    if (!user || !user.referredBy) break; // no more upline

    chain.push({ userId: user.referredBy, level });
    currentUserId = user.referredBy;
  }

  return chain;
};

/**
 * processLevelIncome
 * ──────────────────
 * Core business logic for Task 3 — Referral / Level Income Distribution.
 *
 * Algorithm:
 *  1. Accept a list of { userId, investmentId, roiAmount } objects
 *     (produced by the daily ROI job for each successfully credited investment).
 *  2. For each credited investment:
 *     a. Walk the upline chain (up to 5 levels).
 *     b. Calculate the income amount for each ancestor.
 *     c. Attempt to insert a Referral document (unique compound index guards duplicates).
 *        - Code 11000 → already processed → skip.
 *        - Other error → record and continue.
 *     d. On success: atomically $inc the recipient's walletBalance and
 *        totalLevelIncomeEarned.
 *  3. Return a structured summary.
 *
 * Idempotency guarantee:
 *  The unique index { recipient, investment, level, creditDate } on the
 *  Referral collection means re-running for the same date is fully safe.
 *  Wallet increments only fire on a successful new insert.
 *
 * @param {Array<{
 *   userId:       mongoose.Types.ObjectId,
 *   investmentId: mongoose.Types.ObjectId,
 *   roiAmount:    number
 * }>} creditedROIs  Investments that received ROI today
 *
 * @param {Date} [targetDate=new Date()]  Processing date (defaults to today)
 *
 * @returns {Promise<{
 *   processedDate:  string,
 *   totalInvestees: number,
 *   totalCredited:  number,
 *   totalSkipped:   number,
 *   totalFailed:    number,
 *   errors:         string[]
 * }>}
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
    // ── Step 1: Walk up the referral tree ───────────────────────────────────
    let uplineChain;
    try {
      uplineChain = await getUplineChain(userId);
    } catch (err) {
      summary.totalFailed++;
      summary.errors.push(`getUplineChain for user ${userId}: ${err.message}`);
      continue;
    }

    if (uplineChain.length === 0) continue; // user has no referrers — skip

    // ── Step 2: Credit each ancestor in the chain ───────────────────────────
    for (const { userId: recipientId, level } of uplineChain) {
      try {
        const incomeAmount = calculateLevelIncome(roiAmount, level);
        if (incomeAmount <= 0) continue; // guard against zero/negative credits

        // Insert referral record — unique index prevents duplicates
        await Referral.create({
          recipient:    recipientId,
          fromUser:     userId,
          investment:   investmentId,
          level,
          incomeAmount,
          creditDate,
        });

        // Atomically credit the upline user's wallet
        await User.findByIdAndUpdate(recipientId, {
          $inc: {
            walletBalance:          incomeAmount,
            totalLevelIncomeEarned: incomeAmount,
          },
        });

        summary.totalCredited++;

      } catch (err) {
        if (err.code === 11000) {
          // Already processed this combination for today
          summary.totalSkipped++;
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
