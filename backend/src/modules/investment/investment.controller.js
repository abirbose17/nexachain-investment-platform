const investmentService = require("./investment.service");
const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, sendError } = require("../../utils/response");

/**
 * GET /api/v1/investments/plans
 */
const getPlans = asyncHandler(async (req, res) => {
  const plans = investmentService.getPlans();
  return sendSuccess(res, { plans }, "Investment plans fetched successfully.");
});

/**
 * POST /api/v1/investments
 */
const createInvestment = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (amount === undefined || amount === null) {
    return sendError(res, "amount is required.", 400);
  }

  const investment = await investmentService.createInvestment(req.user._id, { amount });
  return sendSuccess(res, { investment }, "Investment created successfully.", 201);
});

/**
 * GET /api/v1/investments
 */
const getUserInvestments = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const data = await investmentService.getUserInvestments(req.user._id, { status, page, limit });
  return sendSuccess(res, data, "Investments fetched successfully.");
});

module.exports = { getPlans, createInvestment, getUserInvestments };
