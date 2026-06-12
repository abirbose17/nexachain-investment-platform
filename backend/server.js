require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const cron       = require("node-cron");
const swaggerUi  = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const connectDB  = require("./src/config/db");
const { runDailyDistribution } = require("./src/cron/dailyDistribution");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ── Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "NexaChain API Docs",
  swaggerOptions: { persistAuthorization: true, docExpansion: "list" },
}));

// Raw spec as JSON (useful for Postman import / CI checks)
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

// ── API v1 router (single mount point — routes managed in src/routes/index.js)
app.use("/api/v1", require("./src/routes"));

// ── 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// ── Global error handler
// Handles Mongoose, JWT, and application-level errors uniformly
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ status: "error", message: `Invalid value for field: ${err.path}` });
  }
  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: "Validation failed", errors });
  }
  // Mongoose Duplicate Key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ status: "error", message: `${field} already exists.` });
  }
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ status: "error", message: "Invalid token. Please log in again." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ status: "error", message: "Token expired. Please log in again." });
  }

  // Log unexpected server errors only
  if (!err.status || err.status >= 500) console.error(err);

  res.status(err.status || 500).json({
    status:  "error",
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health:  http://localhost:${PORT}/api/v1/health`);
  console.log(`API:     http://localhost:${PORT}/api/v1`);
  console.log(`Swagger: http://localhost:${PORT}/api/docs`);

  // ── Daily distribution cron ──────────────────────────────────────────────
  // Runs every day at exactly 12:00 AM (00:00) UTC.
  // Cron expression: minute(0) hour(0) day(*) month(*) weekday(*)
  //
  // Duplicate-processing safeguards — two independent layers:
  //   Layer 1 · isDistributionRunning flag
  //     Prevents a second trigger from firing while the current run is still
  //     in progress (e.g. slow DB, server restart mid-job, accidental double-schedule).
  //     The flag is always released in the `finally` block so the next night is
  //     never permanently blocked.
  //
  //   Layer 2 · DB-level unique indexes (idempotent even if flag is bypassed)
  //     RoiHistory  { investment, date }                        → blocks double ROI credit
  //     Referral    { recipient, investment, level, creditDate } → blocks double level income
  //     Wallet $inc only fires after a successful new insert, so balances are
  //     never incremented twice for the same record.
  let isDistributionRunning = false;

  // ── PRODUCTION schedule (12:00 AM UTC daily) — uncomment for production ──
  // cron.schedule("0 0 * * *", async () => {
  //   if (isDistributionRunning) {
  //     console.warn("[Cron] Daily distribution already running — skipping duplicate trigger.");
  //     return;
  //   }
  //   isDistributionRunning = true;
  //   console.log("[Cron] Triggering daily distribution…");
  //   try {
  //     const result = await runDailyDistribution();
  //     console.log("[Cron] Daily distribution complete:", JSON.stringify(result, null, 2));
  //   } catch (err) {
  //     console.error("[Cron] Daily distribution failed:", err.message);
  //   } finally {
  //     isDistributionRunning = false;
  //   }
  // }, { timezone: "UTC" });

  // ── DEMO schedule (every 5 minutes) — remove for production ──────────────
  cron.schedule("*/5 * * * *", async () => {
    if (isDistributionRunning) {
      console.warn("[Cron][DEMO] Distribution already running — skipping duplicate trigger.");
      return;
    }

    isDistributionRunning = true;
    console.log("[Cron][DEMO] Triggering daily distribution…");

    try {
      const result = await runDailyDistribution();
      console.log("[Cron][DEMO] Distribution complete:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("[Cron][DEMO] Distribution failed:", err.message);
    } finally {
      isDistributionRunning = false;
    }
  });

  console.log("[Cron][DEMO] Distribution scheduled every 5 minutes");
});
