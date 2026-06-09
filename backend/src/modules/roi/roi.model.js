const mongoose = require("mongoose");

/**
 * ROI History model
 * A new document is created every day for each active investment
 * by the cron job, tracking the exact ROI credited on that date.
 */
const roiHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    roiAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Normalized to midnight UTC for easy deduplication checks
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Credited", "Pending", "Failed"],
      default: "Credited",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate ROI entries for same investment on same day
roiHistorySchema.index({ investment: 1, date: 1 }, { unique: true });

// Query indexes
roiHistorySchema.index({ user: 1 });
roiHistorySchema.index({ user: 1, date: -1 });
roiHistorySchema.index({ status: 1 });

module.exports = mongoose.model("RoiHistory", roiHistorySchema);
