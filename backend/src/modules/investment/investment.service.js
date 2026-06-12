const Investment = require("./investment.model");
const { INVESTMENT_PLANS } = require("../../config/plans");

/**
 * Resolve the correct investment plan for a given amount.
 * Plans are checked in order; Platinum has null maxAmount (uncapped).
 *
 * @param {number} amount
 * @returns {object} matching plan definition
 */
const _resolvePlan = (amount) => {
  const plan = INVESTMENT_PLANS.find(
    (p) => amount >= p.minAmount && (p.maxAmount === null || amount <= p.maxAmount)
  );
  if (!plan) {
    throw {
      status: 400,
      message: `Minimum investment is $${INVESTMENT_PLANS[0].minAmount}. Please enter a valid amount.`,
    };
  }
  return plan;
};

/**
 * Create a new investment for the authenticated user.
 * Determines plan automatically based on amount.
 *
 * @param {string|ObjectId} userId
 * @param {{ amount: number }} payload
 * @returns {Investment}
 */
const createInvestment = async (userId, { amount }) => {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    throw { status: 400, message: "A valid investment amount is required." };
  }

  const plan = _resolvePlan(numAmount);

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const investment = await Investment.create({
    user: userId,
    amount: numAmount,
    plan: {
      name:            plan.name,
      minAmount:       plan.minAmount,
      maxAmount:       plan.maxAmount,
      durationDays:    plan.durationDays,
      dailyRoiPercent: plan.dailyRoiPercent,
    },
    dailyRoiPercent: plan.dailyRoiPercent,
    startDate,
    endDate,
  });

  return investment;
};

/**
 * Get paginated investments for a user with optional status filter.
 *
 * @param {string|ObjectId} userId
 * @param {{ status?: string, page?: number, limit?: number }} options
 * @returns {{ investments: Investment[], pagination: object }}
 */
const getUserInvestments = async (userId, { status, page = 1, limit = 10 } = {}) => {
  const filter = { user: userId };
  if (status) {
    const allowed = ["Active", "Completed", "Cancelled"];
    if (!allowed.includes(status)) {
      throw { status: 400, message: `status must be one of: ${allowed.join(", ")}` };
    }
    filter.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [investments, total] = await Promise.all([
    Investment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Investment.countDocuments(filter),
  ]);

  return {
    investments,
    pagination: {
      total,
      page:       Number(page),
      limit:      Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Expose available investment plans (no auth required).
 * @returns {object[]}
 */
const getPlans = () => INVESTMENT_PLANS;

module.exports = { createInvestment, getUserInvestments, getPlans };
