const mongoose = require("mongoose");

/**
 * Referral / Level Income model
 * Records each credit event when a downline user's investment
 * triggers income for an upline user at a given level.
 */
const referralSchema = new mongoose.Schema(
  {
    // The user who RECEIVES the income
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The downline user whose action GENERATED the income
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Investment that triggered this income (for traceability)
    investment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      default: null,
    },
    // Level 1 = direct referral, Level 2 = referral's referral, etc.
    level: {
      type: Number,
      required: true,
      min: 1,
    },
    incomeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Used to prevent duplicate credits for the same day+investment
    creditDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index to prevent duplicate level income entries per day
referralSchema.index(
  { recipient: 1, investment: 1, level: 1, creditDate: 1 },
  { unique: true }
);

// Additional query indexes
referralSchema.index({ recipient: 1 });
referralSchema.index({ fromUser: 1 });
referralSchema.index({ creditDate: -1 });

module.exports = mongoose.model("Referral", referralSchema);
