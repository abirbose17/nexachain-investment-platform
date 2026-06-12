const { Router } = require("express");
const router = Router();
const controller = require("./investment.controller");
const { protect } = require("../../middleware/auth.middleware");

/**
 * @swagger
 * /investments/plans:
 *   get:
 *     summary: List all available investment plans
 *     tags: [Investments]
 *     security: []
 *     responses:
 *       200:
 *         description: Plans fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         plans:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Plan'
 */
router.get("/plans", controller.getPlans);

/**
 * @swagger
 * /investments:
 *   post:
 *     summary: Create a new investment
 *     description: |
 *       Submits an investment. The plan is automatically resolved based on amount:
 *       | Plan     | Amount Range       | Daily ROI | Duration |
 *       |----------|--------------------|-----------|----------|
 *       | Starter  | $100 – $999        | 1.0%      | 30 days  |
 *       | Silver   | $1,000 – $4,999    | 1.5%      | 60 days  |
 *       | Gold     | $5,000 – $9,999    | 2.0%      | 90 days  |
 *       | Platinum | $10,000+           | 2.5%      | 180 days |
 *     tags: [Investments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvestmentRequest'
 *           example:
 *             amount: 1000
 *     responses:
 *       201:
 *         description: Investment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         investment:
 *                           $ref: '#/components/schemas/Investment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", protect, controller.createInvestment);

/**
 * @swagger
 * /investments:
 *   get:
 *     summary: Get all investments for the authenticated user
 *     tags: [Investments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Completed, Cancelled]
 *         description: Filter by investment status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Investments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         investments:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Investment'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", protect, controller.getUserInvestments);

module.exports = router;
