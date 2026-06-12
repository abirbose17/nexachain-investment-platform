/**
 * Database Seeder
 * ───────────────
 * Drops all existing documents in every collection, then inserts
 * a realistic set of demo data:
 *   • 12 Users  (with a 3-level referral tree)
 *   • 15 Investments (spread across all four plans)
 *   • 20 ROI History records
 *   • 18 Referral / Level Income records
 *
 * Usage:
 *   node src/seed/seed.js           — seed the database
 *   node src/seed/seed.js --clean   — wipe all collections only
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");

const User       = require("../modules/user/user.model");
const Investment = require("../modules/investment/investment.model");
const Referral   = require("../modules/referral/referral.model");
const RoiHistory = require("../modules/roi/roi.model");
const { INVESTMENT_PLANS } = require("../config/plans");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a date N days ago from now (midnight UTC). */
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Return a date N days from now. */
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

/** Pick a random plan and return it with the given investment amount. */
const buildPlanForAmount = (amount) => {
  return INVESTMENT_PLANS.find(
    (p) => amount >= p.minAmount && (p.maxAmount === null || amount <= p.maxAmount)
  );
};

// ── User fixtures ─────────────────────────────────────────────────────────────
/*
 * Referral tree layout:
 *
 *   alice  (root — no referrer)
 *     ├── bob       (ref by alice   — L1)
 *     │     ├── carol    (ref by bob   — L2)
 *     │     └── dave     (ref by bob   — L2)
 *     ├── eve       (ref by alice   — L1)
 *     │     └── frank    (ref by eve   — L2)
 *     │           └── grace (ref by frank — L3)
 *     └── henry     (ref by alice   — L1)
 *
 *   ivan   (root — no referrer)
 *     └── julia     (ref by ivan   — L1)
 *           └── kate    (ref by julia  — L2)
 *
 *   leo    (root — no referrer, no referrals)
 */

const RAW_USERS = [
  // id tag, name, email, mobile, password, referralCode, referredByTag, wallet, roi, levelIncome
  { tag: "alice", fullName: "Alice Sharma",   email: "alice@nexademo.com",  mobile: "+919001000001", password: "Demo@1234", referralCode: "ALICE001", referredByTag: null,    walletBalance: 1420.50, totalRoiEarned: 1200.00, totalLevelIncomeEarned: 220.50 },
  { tag: "bob",   fullName: "Bob Patel",      email: "bob@nexademo.com",    mobile: "+919001000002", password: "Demo@1234", referralCode: "BOB00002", referredByTag: "alice", walletBalance: 850.00,  totalRoiEarned: 750.00,  totalLevelIncomeEarned: 100.00 },
  { tag: "carol", fullName: "Carol Mendes",   email: "carol@nexademo.com",  mobile: "+919001000003", password: "Demo@1234", referralCode: "CAROL003", referredByTag: "bob",   walletBalance: 420.00,  totalRoiEarned: 420.00,  totalLevelIncomeEarned: 0 },
  { tag: "dave",  fullName: "Dave Chaudhary", email: "dave@nexademo.com",   mobile: "+919001000004", password: "Demo@1234", referralCode: "DAVE0004", referredByTag: "bob",   walletBalance: 310.00,  totalRoiEarned: 310.00,  totalLevelIncomeEarned: 0 },
  { tag: "eve",   fullName: "Eve Krishnan",   email: "eve@nexademo.com",    mobile: "+919001000005", password: "Demo@1234", referralCode: "EVE00005", referredByTag: "alice", walletBalance: 640.75,  totalRoiEarned: 590.00,  totalLevelIncomeEarned: 50.75 },
  { tag: "frank", fullName: "Frank Nair",     email: "frank@nexademo.com",  mobile: "+919001000006", password: "Demo@1234", referralCode: "FRANK006", referredByTag: "eve",   walletBalance: 215.00,  totalRoiEarned: 180.00,  totalLevelIncomeEarned: 35.00 },
  { tag: "grace", fullName: "Grace Iyer",     email: "grace@nexademo.com",  mobile: "+919001000007", password: "Demo@1234", referralCode: "GRACE007", referredByTag: "frank", walletBalance: 90.00,   totalRoiEarned: 90.00,   totalLevelIncomeEarned: 0 },
  { tag: "henry", fullName: "Henry Rao",      email: "henry@nexademo.com",  mobile: "+919001000008", password: "Demo@1234", referralCode: "HENRY008", referredByTag: "alice", walletBalance: 500.00,  totalRoiEarned: 500.00,  totalLevelIncomeEarned: 0 },
  { tag: "ivan",  fullName: "Ivan Desai",     email: "ivan@nexademo.com",   mobile: "+919001000009", password: "Demo@1234", referralCode: "IVAN0009", referredByTag: null,    walletBalance: 950.25,  totalRoiEarned: 880.00,  totalLevelIncomeEarned: 70.25 },
  { tag: "julia", fullName: "Julia Mathews",  email: "julia@nexademo.com",  mobile: "+919001000010", password: "Demo@1234", referralCode: "JULIA010", referredByTag: "ivan",  walletBalance: 375.00,  totalRoiEarned: 375.00,  totalLevelIncomeEarned: 0 },
  { tag: "kate",  fullName: "Kate Fernandez", email: "kate@nexademo.com",   mobile: "+919001000011", password: "Demo@1234", referralCode: "KATE0011", referredByTag: "julia", walletBalance: 120.00,  totalRoiEarned: 120.00,  totalLevelIncomeEarned: 0 },
  { tag: "leo",   fullName: "Leo Kapoor",     email: "leo@nexademo.com",    mobile: "+919001000012", password: "Demo@1234", referralCode: "LEO00012", referredByTag: null,    walletBalance: 0,       totalRoiEarned: 0,       totalLevelIncomeEarned: 0 },
];

// ── Investment fixtures ───────────────────────────────────────────────────────
// [ userTag, amount, startDaysAgo, status ]
const INV_FIXTURES = [
  // alice — 2 investments
  ["alice",  5000, 60, "Active"],
  ["alice",  1000, 90, "Completed"],
  // bob — 2 investments
  ["bob",    2500, 45, "Active"],
  ["bob",     500, 35, "Active"],
  // carol
  ["carol",  1500, 30, "Active"],
  // dave
  ["dave",   1000, 25, "Active"],
  // eve — 2 investments
  ["eve",    3000, 55, "Active"],
  ["eve",     250, 20, "Completed"],
  // frank
  ["frank",   500, 15, "Active"],
  // grace
  ["grace",   100, 10, "Active"],
  // henry
  ["henry",  2000, 50, "Active"],
  // ivan — 2 investments
  ["ivan",  10000, 70, "Active"],
  ["ivan",   1000, 100, "Completed"],
  // julia
  ["julia",  1500, 40, "Active"],
  // kate
  ["kate",    200, 12, "Active"],
];

// ── Main ─────────────────────────────────────────────────────────────────────

const seed = async () => {
  const cleanOnly = process.argv.includes("--clean");

  console.log("\n🔗  Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  Connected:", mongoose.connection.host);

  // ── Wipe ────────────────────────────────────────────────────────────────
  console.log("\n🗑   Dropping existing documents…");
  await Promise.all([
    User.deleteMany({}),
    Investment.deleteMany({}),
    Referral.deleteMany({}),
    RoiHistory.deleteMany({}),
  ]);
  console.log("    Users, Investments, Referrals, RoiHistory — cleared.");

  if (cleanOnly) {
    console.log("\n✅  Clean-only run complete.\n");
    process.exit(0);
  }

  // ── Seed Users ───────────────────────────────────────────────────────────
  console.log("\n👤  Seeding users…");

  // Build tag → ObjectId map
  const tagToId = {};

  // Insert without referredBy first.
  // Passwords are plain text — the User pre-save hook hashes them automatically.
  for (const u of RAW_USERS) {
    const created = await User.create({
      fullName:               u.fullName,
      email:                  u.email,
      mobile:                 u.mobile,
      password:               u.password,
      referralCode:           u.referralCode,
      referredBy:             null,
      walletBalance:          u.walletBalance,
      totalRoiEarned:         u.totalRoiEarned,
      totalLevelIncomeEarned: u.totalLevelIncomeEarned,
      accountStatus:          "Active",
    });
    tagToId[u.tag] = created._id;
    process.stdout.write(`    Created: ${u.fullName} (${u.referralCode})\n`);
  }

  // Second pass: wire up referredBy
  for (const u of RAW_USERS) {
    if (u.referredByTag) {
      await User.findByIdAndUpdate(tagToId[u.tag], {
        referredBy: tagToId[u.referredByTag],
      });
    }
  }
  console.log(`    ✅  ${RAW_USERS.length} users seeded.`);

  // ── Seed Investments ─────────────────────────────────────────────────────
  console.log("\n💰  Seeding investments…");
  const investmentDocs = [];

  for (const [userTag, amount, startDaysAgoN, status] of INV_FIXTURES) {
    const plan      = buildPlanForAmount(amount);
    const startDate = daysAgo(startDaysAgoN);
    const endDate   = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // dailyROI × days elapsed (capped at plan duration)
    const daysElapsed   = Math.min(startDaysAgoN, plan.durationDays);
    const totalRoiPaid  = parseFloat(((amount * plan.dailyRoiPercent) / 100 * daysElapsed).toFixed(2));

    const inv = await Investment.create({
      user:            tagToId[userTag],
      amount,
      plan: {
        name:            plan.name,
        minAmount:       plan.minAmount,
        maxAmount:       plan.maxAmount,
        durationDays:    plan.durationDays,
        dailyRoiPercent: plan.dailyRoiPercent,
      },
      dailyRoiPercent: plan.dailyRoiPercent,
      startDate,
      endDate,
      totalRoiPaid,
      status,
    });

    investmentDocs.push({ inv, userTag, amount, startDaysAgoN, plan, daysElapsed });
    process.stdout.write(`    Created: ${userTag.padEnd(6)} | $${String(amount).padStart(6)} | ${plan.name.padEnd(8)} | ${status}\n`);
  }
  console.log(`    ✅  ${INV_FIXTURES.length} investments seeded.`);

  // ── Seed ROI History ─────────────────────────────────────────────────────
  console.log("\n📈  Seeding ROI history…");
  const roiDocs = [];
  let roiCount = 0;

  for (const { inv, userTag, amount, plan, daysElapsed } of investmentDocs) {
    // Seed last N days of ROI (max 5 days per investment to keep dataset manageable)
    const daysToSeed = Math.min(daysElapsed, 5);
    for (let d = daysToSeed; d >= 1; d--) {
      const roiDate    = daysAgo(d);
      const roiAmount  = parseFloat(((amount * plan.dailyRoiPercent) / 100).toFixed(2));

      const roi = await RoiHistory.create({
        user:       tagToId[userTag],
        investment: inv._id,
        roiAmount,
        date:       roiDate,
        status:     "Credited",
      });
      roiDocs.push(roi);
      roiCount++;
    }
  }
  console.log(`    ✅  ${roiCount} ROI history records seeded.`);

  // ── Seed Referral / Level Income ─────────────────────────────────────────
  console.log("\n🤝  Seeding referral earnings…");
  /*
   * Level income rates (from plans.js):
   *   L1 → 10%, L2 → 5%, L3 → 3%  (of investee's daily ROI)
   */
  const LEVEL_RATES = { 1: 0.10, 2: 0.05, 3: 0.03 };

  // Hardcode the upline chains per referral tree layout
  const CHAINS = [
    // [ investeeTag, uplineTag, level ]
    ["bob",   "alice", 1],
    ["carol", "bob",   1], ["carol", "alice", 2],
    ["dave",  "bob",   1], ["dave",  "alice", 2],
    ["eve",   "alice", 1],
    ["frank", "eve",   1], ["frank", "alice", 2],
    ["grace", "frank", 1], ["grace", "eve",   2], ["grace", "alice", 3],
    ["henry", "alice", 1],
    ["julia", "ivan",  1],
    ["kate",  "julia", 1], ["kate",  "ivan",  2],
  ];

  let refCount = 0;

  for (const [investeeTag, recipientTag, level] of CHAINS) {
    // Pick the first active investment of the investee as the trigger
    const triggerInv = investmentDocs.find(
      (d) => d.userTag === investeeTag && d.inv.status === "Active"
    );
    if (!triggerInv) continue;

    const dailyRoi   = parseFloat(((triggerInv.amount * triggerInv.plan.dailyRoiPercent) / 100).toFixed(2));
    const income     = parseFloat((dailyRoi * LEVEL_RATES[level]).toFixed(2));
    const creditDate = daysAgo(1);

    await Referral.create({
      recipient:    tagToId[recipientTag],
      fromUser:     tagToId[investeeTag],
      investment:   triggerInv.inv._id,
      level,
      incomeAmount: income,
      creditDate,
    });

    process.stdout.write(`    L${level}: ${investeeTag.padEnd(6)} → ${recipientTag.padEnd(6)} | $${income}\n`);
    refCount++;
  }
  console.log(`    ✅  ${refCount} referral earning records seeded.`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Seed complete.");
  console.log(`  Users:        ${await User.countDocuments()}`);
  console.log(`  Investments:  ${await Investment.countDocuments()}`);
  console.log(`  ROI History:  ${await RoiHistory.countDocuments()}`);
  console.log(`  Referrals:    ${await Referral.countDocuments()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n  Test credentials (all users):");
  console.log("  Password : Demo@1234");
  console.log("  Example  : alice@nexademo.com / Demo@1234\n");

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("\n❌  Seed failed:", err.message || err);
  mongoose.disconnect().finally(() => process.exit(1));
});
