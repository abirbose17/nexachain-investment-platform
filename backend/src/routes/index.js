const { Router } = require("express");
const mongoose = require("mongoose");
const router = Router();
const { runDailyDistribution } = require("../cron/dailyDistribution");

// ── Health check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     description: Returns server uptime and MongoDB connection status. Use this as the target for uptime monitors and load-balancer health probes.
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             example:
 *               status: ok
 *               timestamp: "2026-06-10T10:00:00.000Z"
 *               uptime: 3600.25
 *               services:
 *                 database: connected
 *       503:
 *         description: API is degraded (DB unavailable)
 */
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? "connected" : "unavailable";
  const status   = dbState === 1 ? "ok" : "degraded";

  res.status(dbState === 1 ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    services:  { database: dbStatus },
  });
});

// ── Feature modules
router.use("/auth",        require("../modules/auth/auth.routes"));
router.use("/investments", require("../modules/investment/investment.routes"));
router.use("/dashboard",   require("../modules/dashboard/dashboard.routes"));
router.use("/referrals",   require("../modules/referral/referral.routes"));

// ── Admin: manual distribution trigger
// POST /api/v1/admin/run-distribution
// Body (optional): { "date": "YYYY-MM-DD" }  — omit to run for today
// Protected by a static ADMIN_SECRET header in non-production environments.
// In production, replace with a proper admin role middleware.
router.post("/admin/run-distribution", async (req, res) => {
  const adminSecret = req.headers["x-admin-secret"];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ status: "error", message: "Forbidden." });
  }

  const targetDate = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(targetDate.getTime())) {
    return res.status(400).json({ status: "error", message: "Invalid date format. Use YYYY-MM-DD." });
  }

  try {
    const result = await runDailyDistribution(targetDate);
    return res.json({ status: "success", message: "Distribution complete.", data: result });
  } catch (err) {
    console.error("[Admin] Distribution error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
