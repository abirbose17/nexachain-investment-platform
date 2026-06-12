# NexaChain Investment Platform

A full-stack **MERN** investment and referral platform where users invest capital across tiered plans, earn daily ROI automatically, and grow passive income through a 5-level referral network.

---

## Why We Built It

Most investment platforms are black boxes — you deposit money and have no visibility into how returns are calculated, when they are credited, or how your referral network is performing. NexaChain was built to demonstrate a **transparent, auditable** investment system where:

- Every ROI credit is stored as an immutable history record
- Every referral income event is traceable to the source investment
- The distribution engine is idempotent — running it twice never double-credits anyone
- All business logic is exposed through a documented REST API

---

## What the Platform Does

### 1. Investment Plans
Users invest any amount and the system auto-assigns the matching plan:

| Plan     | Min Amount | Max Amount | Daily ROI | Duration |
|----------|-----------|-----------|-----------|----------|
| Starter  | $100      | $999      | 1.0%      | 30 days  |
| Silver   | $1,000    | $4,999    | 1.5%      | 60 days  |
| Gold     | $5,000    | $9,999    | 2.0%      | 90 days  |
| Platinum | $10,000   | Uncapped  | 2.5%      | 180 days |

### 2. Daily ROI Distribution
A cron job runs every day at **12:00 AM UTC**. For each active investment it:
1. Calculates `amount × (dailyRoiPercent / 100)`
2. Creates a `RoiHistory` record (unique index prevents duplicates)
3. Atomically increments the user's wallet balance
4. Marks expired investments as `Completed`

### 3. 5-Level Referral / Level Income System
When a downline user earns ROI, every ancestor in the referral chain up to 5 levels deep receives a percentage of that ROI:

| Level | Income Rate |
|-------|------------|
| L1 (direct referral)    | 10% of downline's daily ROI |
| L2 | 5%  |
| L3 | 3%  |
| L4 | 2%  |
| L5 | 1%  |

Each credit is stored in a `Referral` record with a unique compound index to guarantee idempotency.

### 4. Idempotent Scheduler (Task 5)
The cron service has two independent layers of protection against double-processing:
- **In-process lock** (`isDistributionRunning` flag) — skips concurrent triggers
- **DB unique indexes** — `{ investment, date }` on ROI history and `{ recipient, investment, level, creditDate }` on referrals block any duplicate writes at the database level

### 5. React Dashboard
A dark-themed single-page app with:
- Stat cards (wallet balance, total ROI, level income, active investments)
- Area and bar charts for ROI trend visualization
- Investment creation form (auto-selects plan by amount)
- Paginated investment history with status filter
- Referral earnings table with per-level breakdown
- Visual referral tree showing your network by level

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v24 | Runtime |
| **Express** | 5.x | HTTP framework |
| **MongoDB Atlas** | — | Cloud database |
| **Mongoose** | 9.6.3 | ODM + schema validation |
| **bcryptjs** | 3.x | Password hashing |
| **jsonwebtoken** | 9.0.3 | JWT auth (7-day expiry) |
| **node-cron** | 4.x | Scheduled ROI distribution |
| **swagger-ui-express** | 5.x | Interactive API docs |
| **dotenv** | 17.x | Environment configuration |
| **cors** | 2.x | Cross-origin requests |
| **nodemon** | 3.x | Dev auto-restart |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI framework |
| **Vite** | 8.x | Build tool / dev server |
| **React Router DOM** | 7.x | Client-side routing |
| **Axios** | 1.x | HTTP client with interceptors |
| **Zustand** | 5.x | Auth state management (persisted) |
| **Recharts** | 3.x | Charts (AreaChart, BarChart) |
| **CSS Modules** | — | Scoped component styling |

---

## Project Structure

```
nexachain-investment-platform/
├── backend/                        # Express API server
│   ├── server.js                   # App bootstrap, cron, Swagger mount
│   ├── .env                        # Secrets (not committed)
│   └── src/
│       ├── config/
│       │   ├── db.js               # Mongoose connection
│       │   ├── plans.js            # Investment plans + referral percentages
│       │   └── swagger.js          # OpenAPI 3.0 spec (plain JS object)
│       ├── modules/                # Feature modules (model + service + controller + routes)
│       │   ├── auth/               # Register, login, JWT middleware
│       │   ├── user/               # User model
│       │   ├── investment/         # Plans, create, list investments
│       │   ├── dashboard/          # Aggregated stats endpoint
│       │   ├── referral/           # Direct referrals, tree, earnings
│       │   └── roi/                # ROI history model
│       ├── services/
│       │   ├── roiService.js       # ROI calculation + daily processor
│       │   └── levelIncomeService.js # Upline chain walker + level income processor
│       ├── cron/
│       │   └── dailyDistribution.js # Orchestrator: ROI → level income
│       ├── middleware/
│       │   └── auth.middleware.js  # JWT protect middleware
│       ├── routes/
│       │   └── index.js            # Central route registry
│       ├── utils/                  # asyncHandler, response helpers, token/code generators
│       └── seed/
│           └── seed.js             # 12 demo users, 15 investments, 75 ROI records
│
└── dashboard/                      # React + Vite frontend
    └── src/
        ├── App.jsx                 # Router + protected/guest route wrappers
        ├── config/api.js           # Base URL config
        ├── lib/axios.js            # Axios instance + auth/401 interceptors
        ├── store/authStore.js      # Zustand persisted auth store
        ├── services/api.js         # authApi, investmentApi, dashboardApi, referralApi
        ├── hooks/useFetch.js       # Generic data-fetching hook with refetch
        ├── components/
        │   ├── layout/Layout.jsx   # Sidebar navigation + user info
        │   └── ui/                 # Button, Card, Badge, Spinner
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── DashboardPage.jsx   # Stat cards + ROI area chart
            ├── InvestmentsPage.jsx # Plan cards + create form + history table
            ├── ROIHistoryPage.jsx  # Bar chart + active investments table
            ├── ReferralsPage.jsx   # Direct referrals + earnings table
            └── ReferralTreePage.jsx # Visual level-by-level network tree
```

---

## API Reference

Interactive docs available at `http://localhost:5000/api/docs` (Swagger UI).

### Base URL
```
http://localhost:5000/api/v1
```

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | — | Server health check |
| POST | `/auth/register` | — | Register new user (optional referral code) |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/auth/me` | ✅ | Get authenticated user profile |
| GET | `/investments/plans` | — | List all investment plans |
| POST | `/investments` | ✅ | Create investment (plan auto-resolved by amount) |
| GET | `/investments` | ✅ | List user's investments (paginated, filterable by status) |
| GET | `/dashboard` | ✅ | Aggregated wallet + investment + ROI stats |
| GET | `/referrals/direct` | ✅ | Direct (L1) referrals list |
| GET | `/referrals/tree` | ✅ | Full referral tree by level (BFS, up to 5 levels) |
| GET | `/referrals/earnings` | ✅ | Paginated level income history |
| POST | `/admin/run-distribution` | 🔑 | Manually trigger ROI + level income distribution |

> 🔑 Admin endpoint requires `x-admin-secret` header matching `ADMIN_SECRET` in `.env`.

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_128_char_hex_secret
JWT_EXPIRES_IN=7d
ADMIN_SECRET=your_admin_secret
```

```bash
# Seed the database with demo data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd dashboard
npm install
```

Create `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Demo Credentials

All seeded accounts use password: **`Demo@1234`**

| User | Email | Referral Code | Network |
|------|-------|---------------|---------|
| Alice Sharma | alice@nexademo.com | ALICE001 | Root — 3-level deep network |
| Bob Patel | bob@nexademo.com | BOB00002 | L1 under Alice |
| Carol Mendes | carol@nexademo.com | CAROL003 | L2 under Alice |
| Dave Chaudhary | dave@nexademo.com | DAVE0004 | L2 under Alice |
| Eve Krishnan | eve@nexademo.com | EVE00005 | L1 under Alice |
| Frank Nair | frank@nexademo.com | FRANK006 | L2 under Alice |
| Grace Iyer | grace@nexademo.com | GRACE007 | L3 under Alice |
| Henry Rao | henry@nexademo.com | HENRY008 | L1 under Alice |
| Ivan Desai | ivan@nexademo.com | IVAN0009 | Root — 2-level network |
| Julia Mathews | julia@nexademo.com | JULIA010 | L1 under Ivan |
| Kate Fernandez | kate@nexademo.com | KATE0011 | L2 under Ivan |
| Leo Kapoor | leo@nexademo.com | LEO00012 | Standalone |

**Best account to demo:** `alice@nexademo.com` — has the deepest referral tree, multiple active investments, and ROI + level income history.

---

## Database Models

| Model | Collection | Purpose |
|-------|-----------|---------|
| `User` | `users` | Accounts, wallet balance, referral code, referredBy |
| `Investment` | `investments` | Active/completed investments with embedded plan snapshot |
| `RoiHistory` | `roihistories` | Daily ROI credit per investment — unique `{ investment, date }` |
| `Referral` | `referrals` | Level income events — unique `{ recipient, investment, level, creditDate }` |

---

## Cron Job Details

Located in [backend/src/cron/dailyDistribution.js](backend/src/cron/dailyDistribution.js).

**Schedule:** Every day at 12:00 AM UTC (`"0 0 * * *"`)  
**Demo schedule:** Every 5 minutes (`"*/5 * * * *"`) — swap in `server.js`

**Execution flow:**
```
cron fires
  └─ isDistributionRunning check (skip if locked)
       └─ runDailyDistribution(today)
            ├─ processDailyROI()
            │    ├─ fetch Active investments (endDate >= today)
            │    ├─ for each: RoiHistory.create() → 11000 skip or wallet $inc
            │    └─ mark expired investments Completed
            └─ processLevelIncome()
                 ├─ for each credited investment: walk referredBy chain (up to 5 hops)
                 ├─ for each ancestor: Referral.create() → 11000 skip or wallet $inc
                 └─ return summary { credited, skipped, failed }
```
