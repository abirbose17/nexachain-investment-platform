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

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "NexaChain API running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
