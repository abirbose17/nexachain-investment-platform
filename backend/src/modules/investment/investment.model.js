const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Starter", "Pro", "Elite"
    minAmount: { type: Number, required: true },
    maxAmount: { type: Number, required: true },
    durationDays: { type: Number, required: true }, // total plan duration in days
    dailyRoiPercent: { type: Number, required: true }, // e.g. 1.5 means 1.5% per day
  },
  { _id: false }
);

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Investment amount is required"],
      min: [1, "Amount must be greater than 0"],
    },
    plan: {
      type: planSchema,
      required: true,
    },
    dailyRoiPercent: {
      type: Number,
      required: true, // stored flat for quick access during cron jobs
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalRoiPaid: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for frequent query patterns
investmentSchema.index({ user: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model("Investment", investmentSchema);
