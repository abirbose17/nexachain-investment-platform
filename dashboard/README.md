# NexaChain Dashboard

React single-page application for the NexaChain Investment Platform. Built with **React 19**, **Vite 8**, **Zustand**, and **Recharts**.

---

## Table of Contents

- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Routing & Protected Routes](#routing--protected-routes)
- [State Management](#state-management)
- [API Layer](#api-layer)
- [Custom Hooks](#custom-hooks)
- [Pages](#pages)
- [Components](#components)
- [Assumptions](#assumptions)

---

## Project Setup

### Prerequisites
- Node.js v18 or higher
- The backend server running on `http://localhost:5000`

### Installation

```bash
# From the repo root
cd dashboard
npm install
```

### Running the app

```bash
# Development server (http://localhost:5173)
npm run dev

# Production build (output to dist/)
npm run build

# Preview the production build locally
npm run preview
```

---

## Environment Variables

Create a `.env` file in the `dashboard/` directory:

| Variable | Required | Description | Default |
|---|---|---|---|
| `VITE_API_URL` | No | Backend API base URL | `http://localhost:5000/api/v1` |

```env
VITE_API_URL=http://localhost:5000/api/v1
```

> All Vite environment variables must be prefixed with `VITE_` to be accessible in the browser.

---

## Project Structure

```
dashboard/
├── .env
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                      # React DOM entry point
    ├── App.jsx                       # Router setup + route guards
    ├── index.css                     # Global dark-theme CSS variables + resets
    │
    ├── config/
    │   └── api.js                    # Exports BASE_URL from VITE_API_URL env var
    │
    ├── lib/
    │   └── axios.js                  # Configured Axios instance with interceptors
    │
    ├── store/
    │   └── authStore.js              # Zustand auth store (persisted to localStorage)
    │
    ├── services/
    │   └── api.js                    # All API call functions grouped by domain
    │
    ├── hooks/
    │   └── useFetch.js               # Generic data-fetching hook
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx            # Sidebar + main content shell
    │   │   └── Layout.module.css
    │   └── ui/
    │       ├── Button.jsx            # Primary / ghost / danger variants
    │       ├── Button.module.css
    │       ├── Card.jsx              # Dark rounded card wrapper
    │       ├── Card.module.css
    │       ├── Badge.jsx             # Colour-coded status badge
    │       ├── Badge.module.css
    │       ├── Spinner.jsx           # Loading spinner
    │       └── Spinner.module.css
    │
    └── pages/
        ├── LoginPage.jsx             # Email + password login form
        ├── RegisterPage.jsx          # Full registration form
        ├── Auth.module.css           # Shared auth page styles
        ├── DashboardPage.jsx         # Overview: stat cards + ROI area chart
        ├── DashboardPage.module.css
        ├── InvestmentsPage.jsx       # Plan cards + create form + investment table
        ├── ROIHistoryPage.jsx        # Bar chart + active investment table
        ├── ReferralsPage.jsx         # Direct referrals + level income earnings
        ├── ReferralTreePage.jsx      # Visual multi-level referral network
        ├── ReferralTreePage.module.css
        └── TablePage.module.css      # Shared table / plan / form styles
```

---

## Routing & Protected Routes

File: `src/App.jsx`

React Router DOM v7 is used for client-side routing. Two route guard components control access:

### `ProtectedRoute`
Checks `isAuthenticated` from the Zustand auth store. If `false`, redirects to `/login`.

```jsx
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
```

### `GuestRoute`
Redirects already-authenticated users away from auth pages to `/dashboard`.

```jsx
function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}
```

### Route Map

| Path | Component | Guard |
|---|---|---|
| `/login` | `LoginPage` | GuestRoute |
| `/register` | `RegisterPage` | GuestRoute |
| `/dashboard` | `DashboardPage` | ProtectedRoute + Layout |
| `/investments` | `InvestmentsPage` | ProtectedRoute + Layout |
| `/roi-history` | `ROIHistoryPage` | ProtectedRoute + Layout |
| `/referrals` | `ReferralsPage` | ProtectedRoute + Layout |
| `/referral-tree` | `ReferralTreePage` | ProtectedRoute + Layout |
| `*` (catch-all) | — | Redirects to `/dashboard` |

---

## State Management

File: `src/store/authStore.js`

Zustand with the `persist` middleware stores auth state in **localStorage** under the key `nexachain-auth`. The user stays logged in across browser refreshes.

### Store shape

```js
{
  token: string | null,          // JWT from backend
  user: object | null,           // User profile object
  isAuthenticated: boolean,      // true when token + user are set
}
```

### Actions

| Action | Signature | Description |
|---|---|---|
| `setAuth` | `(token, user) → void` | Called after login/register — stores JWT + user, sets `isAuthenticated: true` |
| `updateUser` | `(user) → void` | Update user profile without touching the token |
| `logout` | `() → void` | Clears all auth state; Zustand store and localStorage are both wiped |

### Usage

```jsx
// Read full store
const { user, isAuthenticated } = useAuthStore();

// Select a single slice (prevents re-renders on unrelated state changes)
const logout = useAuthStore((s) => s.logout);
const setAuth = useAuthStore((s) => s.setAuth);
```

---

## API Layer

### `src/lib/axios.js` — Axios instance

A pre-configured Axios instance with two interceptors:

**Request interceptor** — attaches the Bearer JWT to every outgoing request:
```js
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Response interceptor** — handles global 401 (expired/invalid token):
- Calls `logout()` to clear stale auth state from both Zustand and localStorage
- Redirects the browser to `/login`

Individual components never need to handle token expiry — it's handled once globally.

---

### `src/services/api.js` — API functions

All API calls are grouped by domain. Every function returns an Axios response promise.

#### `authApi`

| Function | HTTP | Endpoint | Auth |
|---|---|---|---|
| `authApi.register(data)` | POST | `/auth/register` | — |
| `authApi.login(data)` | POST | `/auth/login` | — |
| `authApi.me()` | GET | `/auth/me` | Bearer |

#### `investmentApi`

| Function | HTTP | Endpoint | Auth |
|---|---|---|---|
| `investmentApi.getPlans()` | GET | `/investments/plans` | — |
| `investmentApi.create({ amount })` | POST | `/investments` | Bearer |
| `investmentApi.getAll({ status?, page?, limit? })` | GET | `/investments` | Bearer |

#### `dashboardApi`

| Function | HTTP | Endpoint | Auth |
|---|---|---|---|
| `dashboardApi.getStats()` | GET | `/dashboard` | Bearer |

#### `referralApi`

| Function | HTTP | Endpoint | Auth |
|---|---|---|---|
| `referralApi.getDirect()` | GET | `/referrals/direct` | Bearer |
| `referralApi.getTree()` | GET | `/referrals/tree` | Bearer |
| `referralApi.getEarnings({ page?, limit? })` | GET | `/referrals/earnings` | Bearer |

---

## Custom Hooks

### `useFetch(fetchFn, deps?) → { data, loading, error, refetch }`

File: `src/hooks/useFetch.js`

Generic data-fetching hook that wraps any API function with loading/error state management and automatic re-fetch on dependency changes.

**Parameters:**

| Param | Type | Description |
|---|---|---|
| `fetchFn` | `() => Promise<AxiosResponse>` | The API function to call |
| `deps` | `Array` | Dependency array — re-triggers the fetch when any value changes |

**Returns:**

| Key | Type | Description |
|---|---|---|
| `data` | `any \| null` | `res.data.data` from the API response |
| `loading` | `boolean` | `true` while the request is in flight |
| `error` | `string \| null` | Error message string, or `null` on success |
| `refetch` | `() => void` | Manually re-trigger the fetch (e.g. after a mutation) |

**Usage examples:**

```jsx
// Simple — runs once on mount
const { data, loading, error } = useFetch(dashboardApi.getStats);

// With deps — re-fetches when page or status changes
const { data, loading, refetch } = useFetch(
  () => investmentApi.getAll({ page, status }),
  [page, status]
);

// Refetch after a create operation
const handleCreate = async () => {
  await investmentApi.create({ amount });
  refetch(); // triggers a fresh list fetch
};
```

**Internal implementation notes:**
- `fetchFn` is wrapped in `useCallback` with `deps` — prevents stale closures
- A `useEffect` depends on the memoized callback, re-running when `deps` change
- `res.data.data` is extracted automatically — all backend responses follow `{ status, message, data }` envelope

---

## Pages

### `LoginPage` — `/login`
Email + password controlled form. On submit calls `authApi.login()`, stores result with `setAuth()`, navigates to `/dashboard`. Inline error display. Demo credentials shown as a hint.

### `RegisterPage` — `/register`
Inputs for full name, email, mobile, password, and optional referral code. `referralCode` is omitted from the request body if left empty. Same post-success flow as login.

### `DashboardPage` — `/dashboard`
Fetches `dashboardApi.getStats()`. Renders:
- 8 stat cards in a responsive 4-column grid (wallet, ROI, level income, investments)
- Recharts **`AreaChart`** with gradient fill for recent ROI trend
- Recent ROI table (last 5 records with date, amount, badge)

### `InvestmentsPage` — `/investments`
- 4 plan cards (informational — amount range, daily ROI %, duration)
- Create investment form — amount input only; plan is auto-resolved by backend
- Paginated investment table with status filter dropdown
- `refetch()` called immediately after a successful create

### `ROIHistoryPage` — `/roi-history`
- Recharts **`BarChart`** showing last 5 ROI credit amounts
- Active investments table with daily ROI amount calculated client-side as `amount × rate / 100`

### `ReferralsPage` — `/referrals`
- Direct referrals table (name, email, code, wallet, status, join date)
- Level income earnings table paginated; level shown as colour-coded badge (L1=purple, L2=teal, L3=yellow, L4=red, L5=gray)

### `ReferralTreePage` — `/referral-tree`
- One coloured band per level, each with a member count header
- Member cards show avatar initial + name + referral code
- Empty state message for users with no referrals

---

## Components

### `Layout`
Sticky sidebar (240px) with brand, nav links, user info, and sign-out button. `NavLink` applies an `.active` CSS class automatically. Main content area fills remaining width.

### `Button`
Props: `variant` (`primary` | `ghost` | `danger`), `loading` (boolean), `full` (full-width). Shows spinner and disables itself when `loading` is true to prevent double-submission.

### `Card`
Dark rounded container. Accepts `className` for additional layout styles and spreads all other props onto the `<div>`.

### `Badge`
Pill-shaped status label. Colour is mapped from the label string:
`Active/Credited → green` | `Completed → blue` | `Cancelled/Failed → red` | `Pending → yellow`

### `Spinner`
Centered CSS animation. Rendered by pages while `useFetch` returns `loading: true`.

---

## Global CSS Variables

`src/index.css` defines the full design token set:

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0f1117` | Page background |
| `--bg-card` | `#1a1d27` | Card / sidebar |
| `--bg-card2` | `#22263a` | Hover / code background |
| `--border` | `#2e3354` | All borders |
| `--text` | `#e8eaf6` | Primary text |
| `--text-muted` | `#8892b0` | Labels, hints |
| `--accent` | `#6c63ff` | Brand purple |
| `--accent-2` | `#00d4aa` | Success teal |
| `--accent-3` | `#ff6b6b` | Danger red |
| `--accent-4` | `#ffd93d` | Warning yellow |
| `--radius` | `12px` | Card corners |
| `--radius-sm` | `8px` | Input / button corners |

---

## Assumptions

1. **Token in localStorage** — Zustand `persist` serializes auth to localStorage. Tokens survive refreshes. The trade-off vs `httpOnly` cookies is accepted for this SPA architecture.

2. **Global 401 handling** — The Axios response interceptor handles all 401s. Components never need individual token-expiry logic.

3. **No form validation library** — Controlled inputs with local `useState` are sufficient for the current form complexity. HTML5 `required` attributes provide basic browser-level validation.

4. **Plan auto-resolution** — Users enter an amount; the backend resolves the plan. Plan cards are informational displays only.

5. **No optimistic updates** — After mutations (e.g. create investment), the list is always refetched from the server to stay consistent with the DB state.

6. **Server-side pagination** — All paginated tables use `?page=N&limit=10` query params. No client-side data slicing.

7. **Charts use last 5 ROI records** — Dashboard and ROI history charts use the `recentRoi` array from `/dashboard`. A dedicated paginated ROI history endpoint is not needed on the overview page.

8. **CSS Modules** — Every component has a scoped `.module.css` file. No CSS-in-JS. Global tokens and resets live only in `index.css`.

9. **React StrictMode** — Enabled in `main.jsx`. Effects run twice in development — this is expected and intentional, not a bug.

10. **No PWA / offline** — The app requires a live API connection. No service workers or caching are implemented.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
