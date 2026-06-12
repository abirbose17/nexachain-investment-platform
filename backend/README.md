# NexaChain Backend

REST API server for the NexaChain Investment Platform. Built with **Express 5**, **MongoDB Atlas**, and **Mongoose 9**.

---

## Table of Contents

- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Documentation](#api-documentation)
- [Service Functions](#service-functions)
- [Utility Functions](#utility-functions)
- [Cron Job](#cron-job)
- [Middleware](#middleware)
- [Error Handling](#error-handling)
- [Database Seeding](#database-seeding)
- [Assumptions](#assumptions)

---

## Project Setup

### Prerequisites
- Node.js v18 or higher
- A MongoDB Atlas cluster (or local MongoDB v6+)

### Installation

```bash
# From the repo root
cd backend
npm install
```

### Running the server

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000` by default.

### Available scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `nodemon server.js` | Development server with auto-restart |
| `npm start` | `node server.js` | Production server |
| `npm run seed` | `node src/seed/seed.js` | Seed demo data into MongoDB |
| `npm run seed:clean` | `node src/seed/seed.js --clean` | Drop all collections then re-seed |

---

## Environment Variables

Create a `.env` file in the `backend/` directory. An `.env.example` is provided as a template.

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | HTTP port (default: `5000`) | `5000` |
| `MONGO_URI` | **Yes** | Full MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/nexachain-ip` |
| `JWT_SECRET` | **Yes** | Secret for signing JWTs — use a 128-char hex string | `c3c9b843...` |
| `JWT_EXPIRES_IN` | No | JWT expiry duration (default: `7d`) | `7d` |
| `ADMIN_SECRET` | **Yes** | Secret header value for admin endpoints | `nexachain_admin_2026` |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Project Structure

```
backend/
├── server.js                    # App entry point — Express bootstrap, cron, Swagger
├── .env                         # Secrets (not committed)
├── .env.example                 # Template
├── package.json
└── src/
    ├── config/
    │   ├── db.js                # Mongoose connect / disconnect
    │   ├── plans.js             # Investment plan definitions + referral percentages
    │   └── swagger.js           # OpenAPI 3.0 spec (plain JS object, no jsdoc scanning)
    │
    ├── modules/                 # Feature-based modules (model + service + controller + routes)
    │   ├── auth/
    │   │   ├── auth.service.js
    │   │   ├── auth.controller.js
    │   │   └── auth.routes.js
    │   ├── user/
    │   │   └── user.model.js
    │   ├── investment/
    │   │   ├── investment.model.js
    │   │   ├── investment.service.js
    │   │   ├── investment.controller.js
    │   │   └── investment.routes.js
    │   ├── dashboard/
    │   │   ├── dashboard.service.js
    │   │   ├── dashboard.controller.js
    │   │   └── dashboard.routes.js
    │   ├── referral/
    │   │   ├── referral.model.js
    │   │   ├── referral.service.js
    │   │   ├── referral.controller.js
    │   │   └── referral.routes.js
    │   └── roi/
    │       └── roi.model.js
    │
    ├── services/                # Cross-module business logic
    │   ├── roiService.js        # Daily ROI calculation and distribution
    │   └── levelIncomeService.js# Referral chain walker and level income processor
    │
    ├── cron/
    │   └── dailyDistribution.js # Orchestrates ROI → level income daily run
    │
    ├── middleware/
    │   └── auth.middleware.js   # JWT protect middleware
    │
    ├── routes/
    │   └── index.js             # Central route registry — all routes mounted here
    │
    ├── utils/
    │   ├── asyncHandler.js      # Wraps async handlers, forwards errors to Express
    │   ├── response.js          # sendSuccess / sendError helpers
    │   ├── generateToken.js     # JWT signer
    │   └── generateReferralCode.js # Crypto-random 8-char referral code generator
    │
    └── seed/
        └── seed.js              # Demo data: 12 users, 15 investments, 75 ROI records
```

---

## Database Models

### User (`users` collection)

| Field | Type | Notes |
|---|---|---|
| `fullName` | String | Required |
| `email` | String | Unique, lowercase |
| `mobile` | String | Unique |
| `password` | String | bcrypt hashed, `select: false` |
| `referralCode` | String | Unique, 8-char uppercase hex |
| `referredBy` | ObjectId → User | Null for root users |
| `walletBalance` | Number | Default 0, updated via `$inc` |
| `totalRoiEarned` | Number | Lifetime ROI total |
| `totalLevelIncomeEarned` | Number | Lifetime level income total |
| `accountStatus` | Enum | `Active` / `Inactive` / `Suspended` |

**Instance method:** `comparePassword(candidate)` — bcrypt comparison.

### Investment (`investments` collection)

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | Owner |
| `amount` | Number | Principal |
| `plan` | Embedded object | Snapshot of plan at time of investment |
| `dailyRoiPercent` | Number | Flat copy for cron efficiency |
| `startDate` | Date | Investment creation date |
| `endDate` | Date | `startDate + durationDays` |
| `totalRoiPaid` | Number | Running ROI total |
| `status` | Enum | `Active` / `Completed` / `Cancelled` |

**Indexes:** `{ user }`, `{ status }`, `{ user, status }`

### RoiHistory (`roihistories` collection)

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId → User | |
| `investment` | ObjectId → Investment | |
| `roiAmount` | Number | Daily credit amount |
| `date` | Date | Normalized to midnight UTC |
| `status` | Enum | `Credited` / `Pending` / `Failed` |

**Unique index:** `{ investment, date }` — core idempotency guard (blocks double ROI credit)

### Referral (`referrals` collection)

| Field | Type | Notes |
|---|---|---|
| `recipient` | ObjectId → User | Who receives the income |
| `fromUser` | ObjectId → User | Downline user that triggered it |
| `investment` | ObjectId → Investment | Source investment |
| `level` | Number | 1–5 |
| `incomeAmount` | Number | Amount credited |
| `creditDate` | Date | Normalized to midnight UTC |

**Unique index:** `{ recipient, investment, level, creditDate }` — blocks double level income credit

---

## API Documentation

Swagger UI is available at **`http://localhost:5000/api/docs`** when the server is running.  
Raw OpenAPI JSON: `GET http://localhost:5000/api/docs.json`

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```
The JWT is returned by `/auth/register` and `/auth/login`.

---

### System

#### `GET /health`
Health check endpoint. Returns DB connection status and server uptime.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-06-13T10:00:00.000Z",
  "uptime": 3600.25,
  "services": { "database": "connected" }
}
```

---

### Auth

#### `POST /auth/register`
Register a new user account.

**Request body:**
```json
{
  "fullName": "Alice Sharma",
  "email": "alice@example.com",
  "mobile": "+919876543210",
  "password": "MyPass@123",
  "referralCode": "BOB00002"
}
```
`referralCode` is optional. If provided, it must match an existing user's code.

**Response (201):**
```json
{
  "status": "success",
  "message": "Registration successful.",
  "data": {
    "token": "<jwt>",
    "user": { "fullName": "...", "email": "...", "referralCode": "...", ... }
  }
}
```

---

#### `POST /auth/login`
Authenticate and receive a JWT.

**Request body:**
```json
{
  "email": "alice@nexademo.com",
  "password": "Demo@1234"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": { "token": "<jwt>", "user": { ... } }
}
```

---

#### `GET /auth/me` 🔒
Get the authenticated user's profile.

---

### Investments

#### `GET /investments/plans`
List all available investment plans (public).

**Response (200):**
```json
{
  "data": {
    "plans": [
      { "name": "Starter", "minAmount": 100, "maxAmount": 999, "dailyRoiPercent": 1, "durationDays": 30 },
      { "name": "Silver",  "minAmount": 1000, "maxAmount": 4999, "dailyRoiPercent": 1.5, "durationDays": 60 },
      { "name": "Gold",    "minAmount": 5000, "maxAmount": 9999, "dailyRoiPercent": 2, "durationDays": 90 },
      { "name": "Platinum","minAmount": 10000, "maxAmount": null, "dailyRoiPercent": 2.5, "durationDays": 180 }
    ]
  }
}
```

---

#### `POST /investments` 🔒
Create a new investment. Plan is auto-selected based on the amount.

**Request body:**
```json
{ "amount": 1500 }
```

**Response (201):** Returns the created investment document.

---

#### `GET /investments` 🔒
Get the authenticated user's investments (paginated).

**Query params:**

| Param | Type | Description |
|---|---|---|
| `status` | string | Filter: `Active`, `Completed`, `Cancelled` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

---

### Dashboard

#### `GET /dashboard` 🔒
Returns aggregated stats in a single call (3 parallel DB queries internally).

**Response (200):**
```json
{
  "data": {
    "wallet": {
      "balance": 1420.50,
      "totalRoiEarned": 1200.00,
      "totalLevelIncomeEarned": 220.50,
      "totalEarned": 1420.50
    },
    "investments": {
      "active": 2,
      "completed": 1,
      "cancelled": 0,
      "totalInvested": 6000.00
    },
    "recentRoi": [...]
  }
}
```

---

### Referrals

#### `GET /referrals/direct` 🔒
List direct (Level 1) referrals of the authenticated user.

#### `GET /referrals/tree` 🔒
Full referral tree up to 5 levels deep, grouped by level with member count.

**Response (200):**
```json
{
  "data": {
    "totalLevels": 3,
    "tree": [
      { "level": 1, "count": 3, "members": [...] },
      { "level": 2, "count": 5, "members": [...] },
      { "level": 3, "count": 1, "members": [...] }
    ]
  }
}
```

#### `GET /referrals/earnings` 🔒
Paginated level income history. Supports `?page=1&limit=10`.

---

### Admin

#### `POST /admin/run-distribution` 🔑
Manually trigger the daily ROI + level income distribution.

**Required header:**
```
x-admin-secret: <ADMIN_SECRET from .env>
```

**Request body (optional):**
```json
{ "date": "2026-06-13" }
```
Omit `date` to process for today.

---

## Service Functions

### `roiService.js`

#### `normalizeToMidnightUTC(date) → Date`
Normalizes any Date to `00:00:00.000 UTC` for that calendar day.  
All ROI records are keyed on this value so the unique index `{ investment, date }` reliably prevents double-crediting regardless of what time of day the job runs.

---

#### `calculateDailyROI(amount, dailyRoiPercent) → number`
Pure function — no database side-effects.  
**Formula:** `amount × (dailyRoiPercent / 100)` rounded to 8 decimal places.

```js
calculateDailyROI(1000, 1.5)  // → 15.00000000
calculateDailyROI(100, 1.0)   // →  1.00000000
```

---

#### `processDailyROI(targetDate?) → Promise<summary>`
Core daily ROI distribution engine.

**Steps:**
1. Fetches all `Active` investments where `endDate >= targetDate`
2. For each investment:
   - Calculates ROI amount
   - Attempts `RoiHistory.create()` — duplicate (11000) → silently skipped
   - On success: atomically `$inc` user's `walletBalance` + `totalRoiEarned` and investment's `totalRoiPaid`
3. Marks all investments with `endDate < targetDate` as `Completed`
4. Returns `{ processedDate, totalProcessed, totalCredited, totalSkipped, totalFailed, completedInvestments, errors }`

**Idempotency:** Safe to run multiple times on the same date. The unique DB index is the source of truth.

---

### `levelIncomeService.js`

#### `calculateLevelIncome(investeeDailyRoi, level) → number`
Pure function. Applies the level percentage to the downline's ROI.

| Level | Rate | Example (ROI = $15) |
|---|---|---|
| 1 | 10% | $1.50 |
| 2 | 5% | $0.75 |
| 3 | 3% | $0.45 |
| 4 | 2% | $0.30 |
| 5 | 1% | $0.15 |

---

#### `getUplineChain(startUserId) → Promise<[{ userId, level }]>`
Iteratively walks the `referredBy` field upward from `startUserId`, collecting up to 5 ancestors.  
Uses lean, index-covered reads on `_id` for maximum speed. Returns early if any user in the chain has no referrer.

---

#### `processLevelIncome(creditedROIs, targetDate?) → Promise<summary>`
Distributes level income to all eligible upline users for the day.

**Steps:**
1. For each `{ userId, investmentId, roiAmount }` in `creditedROIs`:
   - Calls `getUplineChain(userId)` to get ancestors
   - For each ancestor: calculates income, attempts `Referral.create()` — duplicate → skip
   - On success: `$inc` recipient's `walletBalance` + `totalLevelIncomeEarned`
2. Returns `{ processedDate, totalInvestees, totalCredited, totalSkipped, totalFailed, errors }`

---

### `auth.service.js`

#### `register(payload) → Promise<{ token, user }>`
- Checks for duplicate `email` / `mobile` (throws 409 if found)
- Validates `referralCode` against existing users (throws 400 if invalid)
- Generates a unique referral code in a collision-safe loop using `crypto.randomBytes`
- Creates the user and returns a signed JWT

#### `login({ email, password }) → Promise<{ token, user }>`
- Finds user by email (explicitly selects `+password` since it's `select: false`)
- Compares password with bcrypt
- Checks `accountStatus === "Active"`
- Returns signed JWT

---

### `investment.service.js`

#### `_resolvePlan(amount) → planObject` *(private)*
Finds the matching plan by checking `minAmount <= amount <= maxAmount`. Platinum uses `null` as uncapped max.

#### `createInvestment(userId, { amount }) → Promise<Investment>`
Resolves plan automatically, calculates `endDate = today + durationDays`, creates and returns the investment document.

#### `getUserInvestments(userId, { status, page, limit }) → Promise<{ investments, pagination }>`
Paginated query with optional status filter. Returns investments sorted by `createdAt` descending.

#### `getPlans() → planObject[]`
Returns the `INVESTMENT_PLANS` array from `config/plans.js`.

---

### `referral.service.js`

#### `getDirectReferrals(userId) → Promise<User[]>`
Fetches all users where `referredBy === userId`, sorted newest first.

#### `getReferralTree(userId) → Promise<{ totalLevels, tree }>`
Iterative BFS (Breadth-First Search) up to 5 levels. Avoids recursive DB calls and N+1 patterns by querying each level as a batch using `{ referredBy: { $in: currentLevelIds } }`.

#### `getReferralEarnings(userId, { page, limit }) → Promise<{ earnings, pagination }>`
Paginated query on `Referral` collection with `fromUser` and `investment` populated.

---

### `dashboard.service.js`

#### `getDashboardStats(userId) → Promise<dashboardPayload>`
Runs **3 DB queries in parallel** using `Promise.all`:
1. User wallet fields (lean read)
2. Investment aggregate grouped by status (`$group` on status with sum of amounts)
3. Last 5 ROI history records

Reshapes the aggregation result into a clean `{ active, completed, cancelled, totalInvested }` object.

---

## Utility Functions

### `asyncHandler(fn) → middleware`
Wraps any `async (req, res, next)` handler. Catches rejected promises and forwards them to Express's global error handler via `next(err)`.

```js
router.get("/example", asyncHandler(async (req, res) => {
  // Any thrown error here is automatically caught and forwarded
  const data = await someService();
  sendSuccess(res, data);
}));
```

---

### `sendSuccess(res, data, message, statusCode)`
Sends a consistent JSON envelope:
```json
{ "status": "success", "message": "...", "data": { ... } }
```

### `sendError(res, message, statusCode, errors?)`
```json
{ "status": "error", "message": "...", "errors": ["..."] }
```

---

### `generateToken(userId) → string`
Signs a JWT with `{ id: userId }` payload using `process.env.JWT_SECRET` and `JWT_EXPIRES_IN` (default `7d`).

---

### `generateReferralCode() → string`
Returns a cryptographically random 8-character uppercase hex string (e.g. `A3F2B1C4`) using `crypto.randomBytes(4)`. Uniqueness must be verified by the caller.

---

## Cron Job

File: `src/cron/dailyDistribution.js`  
Scheduled in: `server.js`

### Schedule
- **Production:** `"0 0 * * *"` — every day at 12:00 AM UTC (commented out)
- **Demo:** `"*/5 * * * *"` — every 5 minutes (active)

To switch to production, swap the comment blocks in `server.js`.

### Execution Flow

```
cron fires
  │
  ├─ isDistributionRunning? → yes → log warning, return early
  │
  └─ set isDistributionRunning = true
       │
       └─ runDailyDistribution(today)
            │
            ├─ processDailyROI(today)
            │    ├─ fetch Active investments (endDate >= today)
            │    ├─ per investment: RoiHistory.create() → 11000 skip / wallet $inc
            │    └─ mark expired investments Completed
            │
            ├─ re-query Active investments to build creditedROIs list
            │
            └─ processLevelIncome(creditedROIs, today)
                 ├─ per investment: getUplineChain(userId) → walk referredBy 5 levels
                 ├─ per ancestor: Referral.create() → 11000 skip / wallet $inc
                 └─ return summary
       │
       └─ finally: isDistributionRunning = false
```

### Idempotency Layers

| Layer | Mechanism | Protects Against |
|---|---|---|
| In-process lock | `isDistributionRunning` flag | Concurrent triggers in same process |
| DB unique index | `RoiHistory { investment, date }` | Double ROI credit across restarts |
| DB unique index | `Referral { recipient, investment, level, creditDate }` | Double level income credit |
| Atomic wallet update | `$inc` only after successful insert | Balance incremented twice |

---

## Middleware

### `protect` (auth.middleware.js)
Extracts and verifies the `Authorization: Bearer <token>` header.  
Attaches the decoded user document to `req.user`.  
Returns `401` if the token is missing, invalid, or expired.  
Returns `403` if the user's `accountStatus` is not `Active`.

---

## Error Handling

The global error handler in `server.js` normalizes all error types:

| Error Type | HTTP Status | Trigger |
|---|---|---|
| Mongoose `CastError` | 400 | Invalid ObjectId in URL param |
| Mongoose `ValidationError` | 400 | Schema validation failure |
| Mongoose `11000` duplicate key | 409 | Unique field conflict (email, mobile, etc.) |
| `JsonWebTokenError` | 401 | Malformed or tampered token |
| `TokenExpiredError` | 401 | Expired JWT |
| Any other error | 500 | Unexpected server error |

Service-layer errors use `throw { status, message }` objects which are forwarded by `asyncHandler`.

---

## Database Seeding

The seed script creates a consistent dataset for development and demos.

```bash
npm run seed          # Seed (skips if data exists)
npm run seed:clean    # Drop all collections, then re-seed fresh
```

### Seeded Data

- **12 users** with a 3-level referral network (Alice root → Bob/Eve/Henry → Carol/Dave/Frank → Grace) plus an Ivan chain and a standalone Leo
- **15 investments** spread across all 4 plans
- **75 ROI history records** (5 days × 15 investments)
- **15 referral earning records**
- **All passwords:** `Demo@1234`

### Best demo accounts

| Account | Why |
|---|---|
| `alice@nexademo.com` | Deepest tree (3 levels, 7 downline members), highest earnings |
| `ivan@nexademo.com` | 2-level tree with earnings |
| `leo@nexademo.com` | Standalone — good for testing a user with no referral network |

---

## Assumptions

1. **Plan auto-selection** — The system automatically assigns an investment plan based on the amount. Users cannot manually pick a plan. This simplifies the UI and prevents invalid plan/amount combinations.

2. **ROI is credited on creation day** — The first ROI credit happens on the same day the investment is created if the cron runs after the creation. There is no "T+1" delay.

3. **Level income is derived from credited ROI** — Level income is only generated when ROI is successfully credited to a downline user. If ROI is skipped (e.g. already credited), no level income is generated for that day for that investment.

4. **Wallet is append-only** — `walletBalance` is only ever increased via `$inc`. There is no withdrawal mechanism implemented. This is by design for the current scope.

5. **Password hashing** — bcrypt with the default salt rounds (10) is used. Password strength enforcement (minimum length 6) is handled at the Mongoose schema level.

6. **Referral code uniqueness** — Codes are generated via `crypto.randomBytes(4)` (4 billion possibilities). A collision loop in `auth.service.js` retries on the rare chance of a collision.

7. **Timezone** — All date operations use UTC. The cron schedule uses `{ timezone: "UTC" }`. All ROI dates are normalized to midnight UTC before DB insertion.

8. **No soft delete** — Users and investments are never deleted. Investments are transitioned to `Completed` or `Cancelled` status. This preserves the full audit trail.

9. **Swagger spec is a plain JS object** — `swagger-jsdoc` was not used because its glob pattern resolution produces Windows backslashes, causing zero endpoints to be scanned. The spec is maintained manually in `src/config/swagger.js`.

10. **Admin endpoint is header-protected** — The `/admin/run-distribution` endpoint uses a static `x-admin-secret` header rather than a full admin role system. This is intentional for the current scope; a real production system would use role-based access control.
