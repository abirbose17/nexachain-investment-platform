require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");

// Import models (registers them with Mongoose)
require("./src/modules/user/user.model");
require("./src/modules/investment/investment.model");
require("./src/modules/referral/referral.model");
require("./src/modules/roi/roi.model");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ── API v1 router (single mount point — routes managed in src/routes/index.js)
app.use("/api/v1", require("./src/routes"));

// ── 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Route not found" });
});

// ── Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/v1/health`);
  console.log(`API:    http://localhost:${PORT}/api/v1`);
});
