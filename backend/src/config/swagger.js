/**
 * OpenAPI 3.0 specification â€” defined as a plain JS object.
 * No file-scanning (avoids Windows glob/backslash issues with swagger-jsdoc).
 * Served via swagger-ui-express at /api/docs.
 */
const swaggerSpec = {
  openapi: "3.0.0",

  info: {
    title: "NexaChain Investment Platform API",
    version: "1.0.0",
    description:
      "Production-grade REST API for the NexaChain Investment & Referral Platform.\n\n" +
      "**Authentication:** Obtain a JWT from `POST /auth/login`, then click **Authorize** " +
      "and enter `Bearer <token>`.\n\n" +
      "**Base URL:** `/api/v1`",
  },

  servers: [{ url: "/api/v1", description: "API v1" }],

  // ── Tags ─────────────────────────────────────────────────────────────────────
  tags: [
    { name: "System",      description: "Health and platform metadata" },
    { name: "Auth",        description: "Register, login, and current profile" },
    { name: "Investments", description: "Create and list investments" },
    { name: "Dashboard",   description: "Wallet and portfolio stats" },
    { name: "Referrals",   description: "Referral tree and level income earnings" },
  ],

  // ── Reusable components ───────────────────────────────────────────────────────
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the JWT from /auth/login here",
      },
    },

    schemas: {
      // ── Requests ────────────────────────────────────────────────────────────────
      RegisterRequest: {
        type: "object",
        required: ["fullName", "email", "mobile", "password"],
        properties: {
          fullName:     { type: "string",  example: "Alice Sharma" },
          email:        { type: "string",  format: "email", example: "alice@example.com" },
          mobile:       { type: "string",  example: "+919876543210" },
          password:     { type: "string",  minLength: 6, example: "Secret@123" },
          referralCode: {
            type: "string",
            example: "A3F2B1C4",
            description: "Referral code of the inviting user (optional)",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email:    { type: "string", format: "email", example: "alice@example.com" },
          password: { type: "string", example: "Secret@123" },
        },
      },

      CreateInvestmentRequest: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: {
            type: "number",
            minimum: 100,
            example: 1000,
            description:
              "Amount in USD. Plan resolved automatically:\n" +
              "- **Starter** $100â€“$999 â†’ 1.0%/day, 30 days\n" +
              "- **Silver** $1,000â€“$4,999 â†’ 1.5%/day, 60 days\n" +
              "- **Gold** $5,000â€“$9,999 â†’ 2.0%/day, 90 days\n" +
              "- **Platinum** $10,000+ â†’ 2.5%/day, 180 days",
          },
        },
      },

      // ── Models ────────────────────────────────────────────────────────────────
      UserProfile: {
        type: "object",
        properties: {
          id:             { type: "string",  example: "6657c1a2f1b2c3d4e5f60001" },
          fullName:       { type: "string",  example: "Alice Sharma" },
          email:          { type: "string",  example: "alice@example.com" },
          mobile:         { type: "string",  example: "+919876543210" },
          referralCode:   { type: "string",  example: "A3F2B1C4" },
          walletBalance:  { type: "number",  example: 250.75 },
          accountStatus:  { type: "string",  enum: ["Active", "Inactive", "Suspended"], example: "Active" },
          createdAt:      { type: "string",  format: "date-time" },
        },
      },

      Plan: {
        type: "object",
        properties: {
          name:            { type: "string",  example: "Silver" },
          minAmount:       { type: "number",  example: 1000 },
          maxAmount:       { type: "number",  nullable: true, example: 4999 },
          durationDays:    { type: "integer", example: 60 },
          dailyRoiPercent: { type: "number",  example: 1.5 },
        },
      },

      Investment: {
        type: "object",
        properties: {
          _id:             { type: "string",  example: "6657c1a2f1b2c3d4e5f60002" },
          user:            { type: "string",  example: "6657c1a2f1b2c3d4e5f60001" },
          amount:          { type: "number",  example: 1000 },
          plan:            { $ref: "#/components/schemas/Plan" },
          dailyRoiPercent: { type: "number",  example: 1.5 },
          startDate:       { type: "string",  format: "date-time" },
          endDate:         { type: "string",  format: "date-time" },
          totalRoiPaid:    { type: "number",  example: 45.0 },
          status:          { type: "string",  enum: ["Active", "Completed", "Cancelled"] },
          createdAt:       { type: "string",  format: "date-time" },
        },
      },

      Pagination: {
        type: "object",
        properties: {
          total:      { type: "integer", example: 42 },
          page:       { type: "integer", example: 1 },
          limit:      { type: "integer", example: 10 },
          totalPages: { type: "integer", example: 5 },
        },
      },

      DashboardStats: {
        type: "object",
        properties: {
          wallet: {
            type: "object",
            properties: {
              balance:                { type: "number", example: 320.50 },
              totalRoiEarned:         { type: "number", example: 270.00 },
              totalLevelIncomeEarned: { type: "number", example: 50.50 },
              totalEarned:            { type: "number", example: 320.50 },
            },
          },
          investments: {
            type: "object",
            properties: {
              active:        { type: "integer", example: 2 },
              completed:     { type: "integer", example: 3 },
              cancelled:     { type: "integer", example: 0 },
              totalInvested: { type: "number",  example: 6000.00 },
            },
          },
          recentRoi: {
            type: "array",
            items: {
              type: "object",
              properties: {
                _id:       { type: "string" },
                roiAmount: { type: "number", example: 15.00 },
                date:      { type: "string", format: "date-time" },
                status:    { type: "string", enum: ["Credited", "Pending", "Failed"] },
              },
            },
          },
        },
      },

      DirectReferral: {
        type: "object",
        properties: {
          _id:           { type: "string",  example: "6657c1a2f1b2c3d4e5f60003" },
          fullName:      { type: "string",  example: "Bob Jones" },
          email:         { type: "string",  example: "bob@example.com" },
          mobile:        { type: "string",  example: "+911234567890" },
          referralCode:  { type: "string",  example: "B1D3E2F4" },
          accountStatus: { type: "string",  example: "Active" },
          walletBalance: { type: "number",  example: 80.00 },
          createdAt:     { type: "string",  format: "date-time" },
        },
      },

      ReferralTree: {
        type: "object",
        properties: {
          totalLevels: { type: "integer", example: 2 },
          tree: {
            type: "array",
            items: {
              type: "object",
              properties: {
                level:   { type: "integer", example: 1 },
                count:   { type: "integer", example: 3 },
                members: {
                  type: "array",
                  items: { $ref: "#/components/schemas/DirectReferral" },
                },
              },
            },
          },
        },
      },

      ReferralEarning: {
        type: "object",
        properties: {
          _id:          { type: "string" },
          fromUser:     { $ref: "#/components/schemas/UserProfile" },
          investment: {
            type: "object",
            properties: {
              amount: { type: "number", example: 1000 },
              status: { type: "string", example: "Active" },
              plan:   { $ref: "#/components/schemas/Plan" },
            },
          },
          level:        { type: "integer", example: 2 },
          incomeAmount: { type: "number",  example: 7.50 },
          creditDate:   { type: "string",  format: "date-time" },
          createdAt:    { type: "string",  format: "date-time" },
        },
      },

      // ── Response envelopes ───────────────────────────────────────────────────────
      SuccessResponse: {
        type: "object",
        properties: {
          status:  { type: "string", example: "success" },
          message: { type: "string", example: "Operation successful" },
          data:    { type: "object" },
        },
      },

      ErrorResponse: {
        type: "object",
        properties: {
          status:  { type: "string", example: "error" },
          message: { type: "string", example: "Descriptive error message" },
          errors:  { type: "array", items: { type: "string" }, nullable: true },
        },
      },
    },

    // ── Reusable error responses ───────────────────────────────────────────────────────
    responses: {
      Unauthorized: {
        description: "Missing or invalid JWT",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" },
          example: { status: "error", message: "Access denied. No token provided." } } },
      },
      Forbidden: {
        description: "Account suspended or inactive",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" },
          example: { status: "error", message: "Your account is suspended or inactive." } } },
      },
      BadRequest: {
        description: "Validation failed or missing required field",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" },
          example: { status: "error", message: "fullName, email, mobile, and password are required." } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" },
          example: { status: "error", message: "User not found." } } },
      },
      Conflict: {
        description: "Duplicate resource (email or mobile already registered)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" },
          example: { status: "error", message: "Email is already registered." } } },
      },
    },
  },

  // ── Paths ─────────────────────────────────────────────────────────────────────
  paths: {

    // ── SYSTEM ─────────────────────────────────────────────────────────────────────
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        description:
          "Returns server uptime and MongoDB connection status. " +
          "Use as the target for uptime monitors and load-balancer health probes.",
        security: [],
        responses: {
          200: {
            description: "API is healthy",
            content: {
              "application/json": {
                example: {
                  status: "ok",
                  timestamp: "2026-06-12T10:00:00.000Z",
                  uptime: 3600.25,
                  services: { database: "connected" },
                },
              },
            },
          },
          503: {
            description: "API is degraded â€” database unreachable",
            content: {
              "application/json": {
                example: {
                  status: "degraded",
                  timestamp: "2026-06-12T10:00:00.000Z",
                  uptime: 3600.25,
                  services: { database: "unavailable" },
                },
              },
            },
          },
        },
      },
    },

    // ── AUTH ─────────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates a new user account. Optionally accepts a `referralCode` to link the new user " +
          "into the referral tree. Returns a signed JWT on success.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: {
                fullName: "Alice Sharma",
                email: "alice@example.com",
                mobile: "+919876543210",
                password: "Secret@123",
                referralCode: "A3F2B1C4",
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Registration successful.",
                  data: {
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NTdjMWEyIiwiaWF0IjoxNzE3MDAwMDAwfQ.abc123",
                    user: {
                      id: "6657c1a2f1b2c3d4e5f60001",
                      fullName: "Alice Sharma",
                      email: "alice@example.com",
                      mobile: "+919876543210",
                      referralCode: "D3A1F2B4",
                      walletBalance: 0,
                      accountStatus: "Active",
                      createdAt: "2026-06-12T10:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },

    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive a JWT",
        description: "Authenticates with email and password. Returns a signed JWT to use in the `Authorization: Bearer <token>` header for all protected routes.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: { email: "alice@example.com", password: "Secret@123" },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Login successful.",
                  data: {
                    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2NTdjMWEyIiwiaWF0IjoxNzE3MDAwMDAwfQ.abc123",
                    user: {
                      id: "6657c1a2f1b2c3d4e5f60001",
                      fullName: "Alice Sharma",
                      email: "alice@example.com",
                      mobile: "+919876543210",
                      referralCode: "D3A1F2B4",
                      walletBalance: 320.50,
                      accountStatus: "Active",
                      createdAt: "2026-06-12T10:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          403: { $ref: "#/components/responses/Forbidden" },
        },
      },
    },

    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user's profile",
        description: "Returns the full profile of the currently authenticated user. Requires a valid Bearer token.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Profile fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Profile fetched successfully.",
                  data: {
                    user: {
                      _id: "6657c1a2f1b2c3d4e5f60001",
                      fullName: "Alice Sharma",
                      email: "alice@example.com",
                      mobile: "+919876543210",
                      referralCode: "D3A1F2B4",
                      walletBalance: 320.50,
                      totalRoiEarned: 270.00,
                      totalLevelIncomeEarned: 50.50,
                      accountStatus: "Active",
                      createdAt: "2026-06-12T10:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // INVESTMENTS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    "/investments/plans": {
      get: {
        tags: ["Investments"],
        summary: "List all available investment plans",
        description: "Returns the four investment plans with their amount ranges, daily ROI percentages, and durations. No authentication required.",
        security: [],
        responses: {
          200: {
            description: "Plans fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Investment plans fetched successfully.",
                  data: {
                    plans: [
                      { name: "Starter",  minAmount: 100,   maxAmount: 999,   durationDays: 30,  dailyRoiPercent: 1.0 },
                      { name: "Silver",   minAmount: 1000,  maxAmount: 4999,  durationDays: 60,  dailyRoiPercent: 1.5 },
                      { name: "Gold",     minAmount: 5000,  maxAmount: 9999,  durationDays: 90,  dailyRoiPercent: 2.0 },
                      { name: "Platinum", minAmount: 10000, maxAmount: null,  durationDays: 180, dailyRoiPercent: 2.5 },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },

    "/investments": {
      post: {
        tags: ["Investments"],
        summary: "Create a new investment",
        description:
          "Creates an investment for the authenticated user. The plan is **automatically resolved** based on the amount â€” no need to specify a plan name.\n\n" +
          "| Plan | Range | Daily ROI | Duration |\n" +
          "|------|-------|-----------|----------|\n" +
          "| Starter | $100â€“$999 | 1.0% | 30 days |\n" +
          "| Silver | $1,000â€“$4,999 | 1.5% | 60 days |\n" +
          "| Gold | $5,000â€“$9,999 | 2.0% | 90 days |\n" +
          "| Platinum | $10,000+ | 2.5% | 180 days |",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateInvestmentRequest" },
              example: { amount: 1000 },
            },
          },
        },
        responses: {
          201: {
            description: "Investment created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Investment created successfully.",
                  data: {
                    investment: {
                      _id: "6657c1a2f1b2c3d4e5f60002",
                      user: "6657c1a2f1b2c3d4e5f60001",
                      amount: 1000,
                      plan: { name: "Silver", minAmount: 1000, maxAmount: 4999, durationDays: 60, dailyRoiPercent: 1.5 },
                      dailyRoiPercent: 1.5,
                      startDate: "2026-06-12T10:00:00.000Z",
                      endDate: "2026-08-11T10:00:00.000Z",
                      totalRoiPaid: 0,
                      status: "Active",
                      createdAt: "2026-06-12T10:00:00.000Z",
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },

      get: {
        tags: ["Investments"],
        summary: "Get all investments for the authenticated user",
        description: "Returns a paginated list of the authenticated user's investments. Filter by `status` to narrow results.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            schema: { type: "string", enum: ["Active", "Completed", "Cancelled"] },
            description: "Filter by investment status (optional)",
            example: "Active",
          },
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
            description: "Page number (default: 1)",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 10 },
            description: "Results per page (default: 10)",
          },
        ],
        responses: {
          200: {
            description: "Investments fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Investments fetched successfully.",
                  data: {
                    investments: [
                      {
                        _id: "6657c1a2f1b2c3d4e5f60002",
                        amount: 1000,
                        plan: { name: "Silver", dailyRoiPercent: 1.5, durationDays: 60 },
                        dailyRoiPercent: 1.5,
                        startDate: "2026-06-12T10:00:00.000Z",
                        endDate: "2026-08-11T10:00:00.000Z",
                        totalRoiPaid: 15.00,
                        status: "Active",
                      },
                    ],
                    pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // DASHBOARD
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get aggregated dashboard statistics",
        description:
          "Returns wallet balances, investment counts grouped by status, total invested amount, " +
          "and the 5 most recent ROI credits. All calculated server-side in a single aggregation.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard stats fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Dashboard stats fetched successfully.",
                  data: {
                    wallet: {
                      balance: 320.50,
                      totalRoiEarned: 270.00,
                      totalLevelIncomeEarned: 50.50,
                      totalEarned: 320.50,
                    },
                    investments: {
                      active: 2,
                      completed: 3,
                      cancelled: 0,
                      totalInvested: 6000.00,
                    },
                    recentRoi: [
                      { _id: "abc1", roiAmount: 15.00, date: "2026-06-12T00:00:00.000Z", status: "Credited" },
                      { _id: "abc2", roiAmount: 15.00, date: "2026-06-11T00:00:00.000Z", status: "Credited" },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // REFERRALS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    "/referrals/direct": {
      get: {
        tags: ["Referrals"],
        summary: "Get direct (level-1) referrals",
        description: "Returns every user who registered using the authenticated user's referral code.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Direct referrals fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Direct referrals fetched successfully.",
                  data: {
                    count: 2,
                    referrals: [
                      {
                        _id: "6657c1a2f1b2c3d4e5f60003",
                        fullName: "Bob Jones",
                        email: "bob@example.com",
                        mobile: "+911234567890",
                        referralCode: "B1D3E2F4",
                        accountStatus: "Active",
                        walletBalance: 80.00,
                        createdAt: "2026-06-10T08:00:00.000Z",
                      },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/referrals/tree": {
      get: {
        tags: ["Referrals"],
        summary: "Get the complete referral tree (up to 5 levels)",
        description:
          "Traverses the referral hierarchy using iterative BFS â€” no recursive DB calls. " +
          "Returns each level as a group with member count and member details. Maximum depth: 5 levels.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Referral tree fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Referral tree fetched successfully.",
                  data: {
                    totalLevels: 2,
                    tree: [
                      {
                        level: 1,
                        count: 2,
                        members: [
                          { _id: "abc1", fullName: "Bob Jones",   email: "bob@example.com",   referralCode: "B1D3E2F4" },
                          { _id: "abc2", fullName: "Carol Smith",  email: "carol@example.com", referralCode: "C2E3F4A1" },
                        ],
                      },
                      {
                        level: 2,
                        count: 1,
                        members: [
                          { _id: "abc3", fullName: "Dave Brown", email: "dave@example.com", referralCode: "D4A1B2C3" },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    "/referrals/earnings": {
      get: {
        tags: ["Referrals"],
        summary: "Get paginated referral / level income earnings",
        description:
          "Returns all level income credits received by the authenticated user, " +
          "populated with the source user and investment details.",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer", default: 1 },
            description: "Page number (default: 1)",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer", default: 10 },
            description: "Results per page (default: 10)",
          },
        ],
        responses: {
          200: {
            description: "Referral earnings fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SuccessResponse" },
                example: {
                  status: "success",
                  message: "Referral earnings fetched successfully.",
                  data: {
                    earnings: [
                      {
                        _id: "ref001",
                        fromUser: { fullName: "Bob Jones", email: "bob@example.com", referralCode: "B1D3E2F4" },
                        investment: { amount: 1000, status: "Active", plan: { name: "Silver" } },
                        level: 1,
                        incomeAmount: 1.50,
                        creditDate: "2026-06-12T00:00:00.000Z",
                      },
                    ],
                    pagination: { total: 15, page: 1, limit: 10, totalPages: 2 },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
