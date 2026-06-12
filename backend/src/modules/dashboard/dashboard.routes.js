const { Router } = require("express");
const router = Router();
const controller = require("./dashboard.controller");
const { protect } = require("../../middleware/auth.middleware");

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get aggregated dashboard statistics for the authenticated user
 *     description: |
 *       Returns wallet balances, investment totals grouped by status, and the 5 most recent ROI credits.
 *       All figures are calculated server-side in a single optimized aggregation.
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardStats'
 *             example:
 *               status: success
 *               message: Dashboard stats fetched successfully.
 *               data:
 *                 wallet:
 *                   balance: 320.50
 *                   totalRoiEarned: 270.00
 *                   totalLevelIncomeEarned: 50.50
 *                   totalEarned: 320.50
 *                 investments:
 *                   active: 2
 *                   completed: 3
 *                   cancelled: 0
 *                   totalInvested: 6000.00
 *                 recentRoi:
 *                   - roiAmount: 15.00
 *                     date: "2026-06-10T00:00:00.000Z"
 *                     status: Credited
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", protect, controller.getDashboard);

module.exports = router;
