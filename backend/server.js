require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const cron       = require("node-cron");
const swaggerUi  = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const connectDB  = require("./src/config/db");
const { runDailyDistribution } = require("./src/cron/dailyDistribution");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: "NexaChain API Docs",
  swaggerOptions: { persistAuthorization: true, docExpansion: "list" },
}));
app.get("/api/docs.json", (req, res) => res.json(swaggerSpec));

app.use("/api/v1", require("./src/routes"));

app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// Global error handler — normalises Mongoose, JWT, and app-level errors
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.name === "CastError") {
    return res.status(400).json({ status: "error", message: `Invalid value for field: ${err.path}` });
  }
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ status: "error", message: "Validation failed", errors });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ status: "error", message: `${field} already exists.` });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ status: "error", message: "Invalid token. Please log in again." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ status: "error", message: "Token expired. Please log in again." });
  }

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

  // Idempotency: isDistributionRunning flag (in-process) + DB unique indexes (cross-process)
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
