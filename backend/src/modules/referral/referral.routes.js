const { Router } = require("express");
const router = Router();
const controller = require("./referral.controller");
const { protect } = require("../../middleware/auth.middleware");

// All referral routes require authentication
router.use(protect);

/**
 * @swagger
 * /referrals/direct:
 *   get:
 *     summary: Get all direct (level-1) referrals
 *     description: Returns every user who registered using the authenticated user's referral code.
 *     tags: [Referrals]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Direct referrals fetched successfully
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
 *                         count:
 *                           type: integer
 *                           example: 3
 *                         referrals:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/DirectReferral'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/direct", controller.getDirectReferrals);

/**
 * @swagger
 * /referrals/tree:
 *   get:
 *     summary: Get the complete referral tree (up to 5 levels)
 *     description: |
 *       Uses iterative BFS to traverse up to 5 levels deep without recursive DB calls.
 *       Returns each level as a group with member count and member details.
 *     tags: [Referrals]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Referral tree fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/ReferralTree'
 *             example:
 *               status: success
 *               message: Referral tree fetched successfully.
 *               data:
 *                 totalLevels: 2
 *                 tree:
 *                   - level: 1
 *                     count: 3
 *                     members:
 *                       - fullName: Bob Jones
 *                         email: bob@example.com
 *                         referralCode: B1D3E2F4
 *                   - level: 2
 *                     count: 5
 *                     members: []
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/tree", controller.getReferralTree);

/**
 * @swagger
 * /referrals/earnings:
 *   get:
 *     summary: Get paginated referral / level income earnings
 *     tags: [Referrals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Referral earnings fetched successfully
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
 *                         earnings:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ReferralEarning'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/earnings", controller.getReferralEarnings);

module.exports = router;
