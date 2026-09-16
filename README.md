# Roomie — PG/Hostel Management Platform

Roomie is a full-stack web application that connects **renters** (property owners/lister) with **tenants** (people looking for a PG, hostel, or shared apartment). Renters list rooms/properties with pricing, amenities, and photos; tenants search and filter listings and send inquiries directly to renters, who can then track and manage those inquiries.

The project is a classic **MERN-style** monorepo split into two independent apps:

```
PG-Hostel-Management/
├── backend/   Express + MongoDB REST API (JWT auth)
├── frontend/  React 19 SPA (Vite + Tailwind CSS v4)
└── e2e/       Playwright cross-browser test suite (its own package - see Getting Started)
```

---

## 1. Tech Stack

| Layer          | Technology                                                                 |
|----------------|-----------------------------------------------------------------------------|
| Frontend       | React 19, React Router v7, Vite 7, Tailwind CSS v4, Axios                  |
| Backend        | Node.js, Express 4, Mongoose 7 (MongoDB)                                    |
| Auth           | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing              |
| Dev tooling    | Nodemon (backend live-reload), ESLint (frontend), `express-async-errors`   |

---

## 2. Repository Layout

```
backend/
├── index.js                 Express app entry point, DB connection, middleware wiring
├── constants/
│   └── listingOptions.js     single source of truth for propertyType/audience/furnishing/status/amenities
├── controllers/
│   ├── authController.js     signup / login, JWT issuing
│   ├── propertyController.js CRUD + search/filter for listings
│   └── inquiryController.js  create/list/update tenant↔renter inquiries
├── lib/
│   └── imagePipeline.js      validates/rotates/strips/resizes photos, uploads to Cloudinary
├── middleware/
│   ├── authMiddleware.js     verifies Bearer JWT, attaches req.user
│   ├── roleMiddleware.js     generic requireRole(...roles) guard (unused, see Known Limitations)
│   └── upload.js              multer config for POST /api/uploads/photos
├── models/
│   ├── User.js                name, email, passwordHash, role (renter|tenant)
│   ├── Property.js            listing details + embedded Room subdocuments; enum validation from constants/listingOptions.js
│   └── Inquiry.js             tenant → property inquiry with status
├── routes/
│   ├── auth.js                 POST /signup, /login
│   ├── properties.js           GET / (public), GET /:id, POST/PUT/DELETE (auth)
│   ├── inquiries.js            POST /, GET / (owner), GET /my (tenant), PUT /:id/status
│   ├── uploads.js               POST /photos (auth, renter)
│   └── meta.js                  GET /options (public)
├── seed.js                    sample-data generator (`--plan` for a dry-run summary)
├── migrate-amenities.js       one-off data migration (`--dry-run` supported)
└── .env.example                 MONGO_URI, PORT, JWT_SECRET, CLOUDINARY_*

frontend/
├── public/
│   └── robots.txt             crawler rules (disallows auth-gated routes)
├── src/
│   ├── main.jsx               React root, wraps <App/> in <AuthProvider/>
│   ├── App.jsx                 React Router route table
│   ├── api/
│   │   ├── api.js              Axios instance, injects Authorization header from localStorage
│   │   ├── properties.js       fetch/create/update/delete property helpers
│   │   ├── inquiries.js        create/fetch/update inquiry helpers
│   │   ├── uploads.js           POST /api/uploads/photos helper
│   │   └── meta.js              fetches + caches GET /api/meta/options
│   ├── context/
│   │   └── AuthContext.jsx      global auth state (user, login, signup, logout)
│   ├── hooks/
│   │   └── useListingOptions.js  wraps api/meta.js with {options, loading, error}
│   ├── components/
│   │   ├── Header.jsx / Footer.jsx        site chrome
│   │   ├── ProtectedRoute.jsx              role-gated route wrapper
│   │   ├── ListingCard.jsx / SkeletonCard.jsx  property card + loading placeholder
│   │   ├── Modal.jsx                       generic modal shell
│   │   ├── InquiryModal.jsx                tenant "send inquiry" form
│   │   ├── EditPropertyModal.jsx           renter "edit listing" form
│   │   └── Seo.jsx                         per-page <title>/meta/OG tags (React 19 native head hoisting)
│   └── screens/
│       ├── home.jsx                         landing page
│       ├── notfound.jsx                     404
│       ├── auth/Login.jsx, Signup.jsx        role-tabbed auth forms
│       ├── dashboard/Find.jsx               search/browse listings
│       ├── dashboard/RenterDashboard.jsx    renter's own listings
│       ├── dashboard/TenantDashboard.jsx    tenant's sent inquiries
│       └── listing/CreateListing.jsx, ListingDetail.jsx  multi-step listing form / detail page
└── vite.config.js

e2e/
├── playwright.config.js
└── tests/                    core-flow / protected-routes / responsive specs, helpers.js
```

---

## 3. Domain Model & Core Concepts

### Roles
Every `User` has exactly one role:
- **`renter`** — lists properties, receives and manages inquiries.
- **`tenant`** — browses/searches properties, sends inquiries.

Role is chosen at signup and is required at login (login fails with 403 if the role selected doesn't match the account's actual role). Route access is enforced **twice**:
- **Frontend**: `ProtectedRoute` (`frontend/src/components/ProtectedRoute.jsx`) redirects unauthenticated users to `/login` and role-mismatched users to `/`.
- **Backend**: controllers check `req.user.role` directly (e.g. only `renter` can create a property, only `tenant` can create an inquiry).

### Entities

**User** (`backend/models/User.js`)
- `name`, `email` (unique), `passwordHash`, `role` (`renter`/`tenant`), `phone`, `avatarUrl`.
- `verifyPassword()` instance method compares plaintext password against the bcrypt hash.

**Property** (`backend/models/Property.js`)
- Owned by a `User` (`owner` ref).
- Descriptive fields: `title`, `description`, `propertyType` (PG/Apartment/Hostel), `targetAudience` (women/men/co-ed), `furnishing`, `petsAllowed`, `mealsProvided`, `amenities[]`.
- `rooms[]` — embedded `Room` subdocuments (`name`, `price`, `occupancy`, `availableFrom`, `status`); `totalRooms`/`occupancyPerRoom` are derived summary fields.
- `price`/`currency` — top-level default price shown on cards (falls back to first room's price on the frontend).
- `location` — `address`, `lat`/`lng`, `googleMapsUrl`.
- `photos[]` — legacy plain image URLs (still supported). `photoAssets[]` — the current photo pipeline's output: Cloudinary-hosted, multi-width (`srcset`-ready) processed images (see [Image uploads](#image-uploads)).
- `status` — `available` / `rented` / `coming_soon`.

**Inquiry** (`backend/models/Inquiry.js`)
- Links a `tenant` (User) to a `property` (Property), with a free-text `message`.
- `status` lifecycle: `new` → `contacted` → `closed`, updated by the renter (or self-closed by the tenant from their dashboard).

---

## 4. Backend Architecture

### Request Flow
`index.js` wires: `dotenv` → `express-async-errors` (so async route handlers don't need manual try/catch for error propagation) → `cors` (origin from `CLIENT_ORIGIN` env var, falls back to `http://localhost:5173`) → `express.json()` → mounted routers → a catch-all error handler that returns `{ error: message }` with the appropriate status code.

### Authentication
- `POST /api/auth/signup` — hashes password with `bcryptjs`, creates the `User`, returns `{ token, user }`.
- `POST /api/auth/login` — verifies password, verifies the requested `role` matches the stored role, returns `{ token, user }`.
- JWT payload: `{ id, role, email }`, signed with `JWT_SECRET`, expires in `7d`.
- `authMiddleware` reads the `Authorization: Bearer <token>` header, verifies the token, loads the full `User` (minus `passwordHash`) into `req.user` for downstream handlers.
- `roleMiddleware.requireRole(...roles)` exists as a reusable guard but route files currently perform role checks **inline inside the controllers** rather than composing it into the route chain — worth refactoring if more roles/permissions are added.

### Properties API (`/api/properties`)
| Method | Path         | Auth | Description |
|--------|--------------|------|-------------|
| GET    | `/`          | No   | List + filter properties (see below) |
| GET    | `/:id`       | No   | Single property, populated with owner info |
| POST   | `/`          | Yes (renter) | Create a listing owned by `req.user` |
| PUT    | `/:id`       | Yes (owner)  | Update a listing you own |
| DELETE | `/:id`       | Yes (owner)  | Delete a listing you own |

List filters (all optional query params): `amenities` (comma-separated, matched with `$all`), `minPrice`/`maxPrice`, `audience`, `propertyType`, `furnishing`, `status`, `query` (case-insensitive regex over `title`/`description`/`location.address`), `page`/`limit` (pagination).

### Inquiries API (`/api/inquiries`)
| Method | Path            | Auth | Description |
|--------|-----------------|------|-------------|
| POST   | `/`             | Yes (tenant) | Create an inquiry for a property |
| GET    | `/`             | Yes (renter) | List inquiries for properties you own |
| GET    | `/my`           | Yes          | List inquiries you (as tenant) have sent |
| PUT    | `/:id/status`   | Yes          | Update inquiry status (intended for the owning renter) |

### Uploads API (`/api/uploads`)
| Method | Path         | Auth | Description |
|--------|--------------|------|-------------|
| POST   | `/photos`    | Yes (renter) | Process + upload up to 8 listing photos (see [Image uploads](#image-uploads)) |

### Meta API (`/api/meta`)
| Method | Path         | Auth | Description |
|--------|--------------|------|-------------|
| GET    | `/options`   | No   | Canonical `propertyType`/`targetAudience`/`furnishing`/`status`/`amenities` values (`backend/constants/listingOptions.js`), consumed by `Find.jsx` and `CreateListing.jsx` instead of hardcoding their own copies |

---

## 5. Frontend Architecture

### Routing (`src/App.jsx`)
Single `<BrowserRouter>` with a persistent `Header`/`Footer` around all routes:

| Path                  | Screen              | Access |
|-----------------------|----------------------|--------|
| `/`                   | `home.jsx`           | Public |
| `/login`, `/signup`   | `auth/Login`, `auth/Signup` | Public |
| `/find`               | `dashboard/Find`     | Public — search & filter listings |
| `/listing/:id`        | `listing/ListingDetail` | Public (inquiry/edit actions gated by role) |
| `/create-listing`     | `listing/CreateListing` | `renter` only |
| `/renter-dashboard`   | `dashboard/RenterDashboard` | `renter` only |
| `/tenant-dashboard`   | `dashboard/TenantDashboard` | `tenant` only |
| `*`                   | `notfound.jsx`       | Public |

### State & Data Fetching
- **`AuthContext`** (`src/context/AuthContext.jsx`) is the single source of truth for the logged-in user. On mount it hydrates from `localStorage` (`token` + `user`), and exposes `login`, `signup`, `logout`. There is no token-refresh or expiry check on the client — an expired JWT is only discovered when an API call returns 401.
- **`api/api.js`** creates a shared Axios instance with a request interceptor that attaches `Authorization: Bearer <token>` from `localStorage` to every outgoing request.
- **`api/properties.js`** / **`api/inquiries.js`** are thin wrapper functions around that Axios instance, used by screens instead of calling Axios directly.

### Key Screens
- **`Find.jsx`** — combined search bar (debounced 500ms), property type/audience/price/amenity filters, a "recommended" strip, and a filtered results grid with skeleton loading states.
- **`CreateListing.jsx`** — a 5-step wizard (Basic → Amenities → Rooms & Pricing → Photos → Location & Contact) that assembles one `Property` payload and POSTs it on final submit. Photos are added as URLs; local file selection only generates client-side object-URL previews (no upload endpoint exists yet).
- **`ListingDetail.jsx`** — fetches one property, shows full details, and conditionally renders either an "Edit Property" action (owner) or a "Send Inquiry" action (`InquiryModal`, tenant only).
- **`RenterDashboard.jsx`** — fetches all properties and client-side filters to the ones owned by the current user, rendering them via `ListingCard`.
- **`TenantDashboard.jsx`** — fetches the tenant's own inquiries (`GET /api/inquiries/my`) and lets them jump to the listing or mark an inquiry `closed`.

### Styling & Theming
Tailwind CSS v4 is wired in via the `@tailwindcss/vite` plugin (no separate PostCSS config needed for the utility layer). Tailwind v4 is CSS-first and does not read a `tailwind.config.js` unless one explicitly opts in with `@config` (this project doesn't have one) — tokens are defined directly in `src/index.css`.

- **Tokens** — an OKLCH-generated accent scale (built on `#13a3e9`) and a neutral scale, 50–900, with separate semantic `--color-accent`/`--color-surface`/`--color-fg`/`--color-border` values for light and dark mode. Applied app-wide: Header/Footer, home, Login/Signup, both dashboards, ListingDetail, CreateListing, the modals, ProtectedRoute's loading state, the route Suspense fallback, and notfound.jsx.
- **Dark mode** — class-based via Tailwind v4's `@custom-variant dark`. `useTheme`/`ThemeToggle` (`src/hooks`, `src/components`) default to the OS `prefers-color-scheme`, persist a manual override to `localStorage`, and apply it through a blocking inline script in `index.html` so there's no flash of the wrong theme on load.
- **Fonts** — Fraunces (headings only) + Inter (body/UI), self-hosted via `@fontsource`.

---

## 6. Getting Started

### Prerequisites
- Node.js (LTS) and npm
- A MongoDB instance (local `mongod` or a hosted URI, e.g. MongoDB Atlas)

### Backend setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in real values, see below
npm run dev             # nodemon, reloads on change
# or: npm start
```

`.env` variables:
```
MONGODB_URI=mongodb://localhost:27017/pg_hostel
PORT=5000
JWT_SECRET=<any long random string>
CLIENT_ORIGIN=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<from your Cloudinary dashboard>
CLOUDINARY_API_KEY=<from your Cloudinary dashboard>
CLOUDINARY_API_SECRET=<from your Cloudinary dashboard>
```
`CLIENT_ORIGIN` is the single origin allowed to call this API (sets the CORS
`Access-Control-Allow-Origin` header) — set it to your deployed frontend's
URL in production. The `CLOUDINARY_*` vars are used to upload listing
photos (see [Image uploads](#image-uploads) below) — get them from
[cloudinary.com](https://cloudinary.com)'s dashboard after creating a free
account. Photo upload/edit/delete won't work without them, but the rest of
the app runs fine if they're unset.

The API starts on `http://localhost:5000` (or your `PORT`).

### Seeding sample data
```bash
cd backend
npm run seed:plan   # prints the planned counts (no database/network calls) - review before seeding
npm run seed         # wipes Users/Properties/Inquiries in MONGODB_URI's database and creates fresh sample data
```
Creates 4 renters, 5 tenants, and 21 listings covering every `propertyType`
x `targetAudience` combination except two deliberately-empty ones (so the
"No results found" state has something real to test), with prices spread
INR 3000–25000 and amenities distributed so every filter combination in
`/find` returns a real, checkable result. **This deletes existing
Users/Properties/Inquiries data in the target database** — only run it
against a dev database.

### Image uploads

Listing photos uploaded through `/create-listing` go through a real
server-side pipeline, not just a URL field:

1. `POST /api/uploads/photos` (authenticated, renter only) accepts up to 8
   image files (JPEG/PNG/WebP, 8MB max each — `backend/middleware/upload.js`).
2. `backend/lib/imagePipeline.js` validates each file is actually a decodable
   image (via `sharp`, independent of the browser-supplied MIME type), reads
   its EXIF orientation and auto-rotates, strips all metadata, and generates
   WebP versions at up to three widths (400/800/1200px — never upscaled past
   the original).
3. Each width is uploaded to Cloudinary as its own stored file (not a
   Cloudinary on-the-fly transformation URL) under the `roomie/properties`
   folder, and the resulting URLs/widths/Cloudinary `public_id`s are saved on
   the `Property` document's `photoAssets` field.
4. The frontend renders `photoAssets` with `srcset`/`sizes` so the browser
   picks the right width automatically. Deleting a listing deletes all of
   its Cloudinary files too.

The older `photos: [String]` field (plain pasted URLs) still works
alongside this — both render, so existing data doesn't need migrating.

### Frontend setup
```bash
cd frontend
npm install
cp .env.example .env   # optional locally; defaults already match the backend above
npm run dev    # Vite dev server, defaults to http://localhost:5173
```

`.env` variables:
```
VITE_API_URL=http://localhost:5000/api
```
`VITE_API_URL` is the Axios base URL (`src/api/api.js`) the frontend calls.
Vite only exposes env vars prefixed `VITE_` to client code, and only
variables present **at build time** are baked into the bundle — set this in
your hosting provider's environment settings before building for
production, not after.

If you change ports or deploy, set `VITE_API_URL` (frontend) and
`CLIENT_ORIGIN` (backend) to match each other.

### Typical flow to try it locally
1. Start MongoDB, then the backend, then the frontend.
2. Sign up as a **renter** at `/signup`, then create a listing at `/create-listing`.
3. Sign up (or log in as) a **tenant** in a second browser/incognito session, browse `/find`, open the listing, and send an inquiry.
4. Log back in as the renter and view the inquiry at `/renter-dashboard` (currently only the tenant's own dashboard surfaces inquiry status in the UI; the renter-side inquiry inbox API exists at `GET /api/inquiries` but isn't yet wired into `RenterDashboard.jsx`).

### End-to-end tests (Playwright)
Cross-browser tests live in their own `e2e/` package (separate from `frontend/`
and `backend/` so it can't affect either deployed build — see its
`package.json` description). They assume the backend and frontend dev
servers are already running (see above), rather than starting them
automatically.

```bash
cd e2e
npm install
npx playwright install   # first time only, downloads browser binaries
npm test                 # runs chromium, firefox, webkit + a mobile-viewport project
npm run test:mobile      # just the mobile-viewport project (Pixel 5 dimensions)
npm run test:headed      # same as `test`, with visible browser windows
npm run report           # opens the last HTML report
```

What's covered:
- `core-flow.spec.js` — a full renter → tenant journey through the real UI: signup, create a listing, search `/find`, open the listing, send an inquiry (including the native `alert()` confirmation and the focus-trapped dialog from Phase 4), and confirm it shows up on the tenant's dashboard. Runs on chromium, firefox, and webkit.
- `protected-routes.spec.js` — unauthenticated and wrong-role visitors are redirected away from role-gated routes. Runs on chromium, firefox, and webkit.
- `responsive.spec.js` — no horizontal overflow and key CTAs are reachable on a real mobile viewport (Pixel 5, 393×851), on `/`, `/find`, and a listing detail page.

These tests create real users/listings/inquiries through the UI against your
local dev database — that's expected test data, not a bulk operation; re-run
freely.

Two real bugs were found and fixed this way (not browser-specific — both
failed identically on chromium, firefox, and webkit, so cross-browser testing
wasn't what surfaced them, an ordinary single-browser run would have too):
- `CreateListing.jsx` sent `targetAudience`/`furnishing` as `""` when a user
  didn't touch those selects, which the `Property` model's enum validation
  (added while fixing the `/find` filter bug, see below) rejected outright —
  `""` is a defined value and gets checked against the enum, unlike an
  absent field. Fixed by sending `undefined` instead of `""` so the field is
  genuinely absent and `furnishing` falls back to its schema default.
- `/find` had two buttons both accessibly named "Search" (the tab and the
  actual submit button), which was fine for sighted mouse users but ambiguous
  for anything resolving by accessible name/role — including screen readers,
  not just this test suite. Fixed by renaming the tab to "Browse".

---

## 7. Deployment

A minimal free-tier setup: **MongoDB Atlas** (database) + **Render** (backend) + **Vercel** (frontend). Having a live URL is useful for real PageSpeed Insights data (lab data from a local machine differs from what Google's servers measure against a live host).

### 1. MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and password.
3. Network Access → allow access from anywhere (`0.0.0.0/0`) for simplicity, or Render's specific IPs if you want it tighter.
4. Copy the connection string — this is your production `MONGODB_URI` (append a database name, e.g. `/pg_hostel`, before the `?` query string).

### 2. Backend on Render
1. New → Web Service, point it at this repo, root directory `backend`.
2. Build command: `npm install`. Start command: `npm start`.
3. Environment variables: `MONGODB_URI` (from Atlas), `JWT_SECRET` (a long random string), `CLIENT_ORIGIN` (fill in after step 3, once you have the Vercel URL), `PORT` is set by Render automatically.
4. Deploy, then note the resulting URL (e.g. `https://your-app.onrender.com`).

### 3. Frontend on Vercel
1. New Project, point it at this repo, root directory `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output directory: `dist`.
3. Environment variable: `VITE_API_URL` = `https://your-app.onrender.com/api` (must be set **before** the build runs, since Vite bakes it into the bundle).
4. Deploy, then note the resulting URL (e.g. `https://your-app.vercel.app`).

### 4. Close the loop
Go back to Render and set `CLIENT_ORIGIN` to your Vercel URL, then redeploy the backend so CORS allows it.

### 5. Seed the live database (optional)
Run `MONGODB_URI=<your Atlas URI> npm run seed` locally (pointed at Atlas instead of localhost) so the live site has content to demo and measure.

---

## 8. Known Limitations

These are useful to know before extending the app — noted here rather than fixed silently, since some may be deliberate simplifications for a coursework project:

- **`roleMiddleware.js` is unused.** Role checks are duplicated inline in each controller instead of composed via `requireRole()` in the route definitions.
- **Renter inquiry inbox not surfaced in the UI.** `GET /api/inquiries` (list inquiries for a renter's properties) and `PUT /api/inquiries/:id/status` are implemented on the backend and in `src/api/inquiries.js`, but `RenterDashboard.jsx` only lists properties — there's no screen consuming `fetchOwnerInquiries`/`updateInquiryStatus` yet.
- **No ownership check on inquiry status updates.** `inquiryController.updateStatus` doesn't verify the requester actually owns the property tied to the inquiry.

---

## 9. Scripts Reference

**Backend** (`backend/package.json`)
- `npm start` — run once with plain `node`
- `npm run dev` — run with `nodemon` (auto-restart)
- `npm run seed` — wipe and repopulate the database with sample renters/tenants/listings
- `npm run seed:plan` — print the planned seed counts with zero database/network calls
- `npm run migrate:amenities` — normalize stored `amenities` values to the canonical slugs in `constants/listingOptions.js`
- `npm run migrate:amenities:dry` — print what the amenities migration would change, without writing anything

**Frontend** (`frontend/package.json`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — ESLint over the project

**E2E** (`e2e/package.json`, see [End-to-end tests](#end-to-end-tests-playwright))
- `npm test` — run the full Playwright suite (chromium, firefox, webkit, mobile)
- `npm run test:mobile` — just the mobile-viewport project
- `npm run test:headed` — same as `test`, with visible browser windows
- `npm run report` — open the last HTML report
