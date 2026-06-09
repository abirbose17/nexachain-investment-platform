const { Router } = require("express");
const mongoose = require("mongoose");
const router = Router();

/**
 * Central route registry.
 * Add each module's router here as it is built.
 * server.js stays clean — it only mounts this file once.
 *
 * Pattern: router.use("/resource", require("../modules/<name>/<name>.routes"));
 */

// ── Health check
router.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus = dbState === 1 ? "connected" : "unavailable";
  const status = dbState === 1 ? "ok" : "degraded";

  res.status(dbState === 1 ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
    },
  });
});

// router.use("/auth",        require("../modules/auth/auth.routes"));
// router.use("/investments", require("../modules/investment/investment.routes"));
// router.use("/dashboard",   require("../modules/dashboard/dashboard.routes"));
// router.use("/referrals",   require("../modules/referral/referral.routes"));

module.exports = router;
