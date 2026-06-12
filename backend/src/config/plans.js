/**
 * Investment plan definitions.
 * maxAmount: null  →  no upper bound (Platinum plan).
 *
 * dailyRoiPercent: percentage of invested amount credited daily.
 *   e.g. 1.5  →  1.5 % of amount per day
 */
const INVESTMENT_PLANS = [
  {
    name: "Starter",
    minAmount: 100,
    maxAmount: 999,
    durationDays: 30,
    dailyRoiPercent: 1.0,
  },
  {
    name: "Silver",
    minAmount: 1000,
    maxAmount: 4999,
    durationDays: 60,
    dailyRoiPercent: 1.5,
  },
  {
    name: "Gold",
    minAmount: 5000,
    maxAmount: 9999,
    durationDays: 90,
    dailyRoiPercent: 2.0,
  },
  {
    name: "Platinum",
    minAmount: 10000,
    maxAmount: null, // uncapped
    durationDays: 180,
    dailyRoiPercent: 2.5,
  },
];

/**
 * Percentage of downline's daily ROI credited to each upline level.
 * Level 1 = direct referral of the investor.
 */
const REFERRAL_LEVEL_PERCENTS = {
  1: 10,
  2: 5,
  3: 3,
  4: 2,
  5: 1,
};

/** Maximum depth of the referral tree used for level income. */
const MAX_REFERRAL_LEVELS = 5;

module.exports = { INVESTMENT_PLANS, REFERRAL_LEVEL_PERCENTS, MAX_REFERRAL_LEVELS };
