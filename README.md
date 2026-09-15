# Roomie — PG/Hostel Management Platform

Roomie is a full-stack web application that connects **renters** (property owners/lister) with **tenants** (people looking for a PG, hostel, or shared apartment). Renters list rooms/properties with pricing, amenities, and photos; tenants search and filter listings and send inquiries directly to renters, who can then track and manage those inquiries.

The project is a classic **MERN-style** monorepo split into two independent apps:

```
PG-Hostel-Management/
├── backend/   Express + MongoDB REST API (JWT auth)
└── frontend/  React 19 SPA (Vite + Tailwind CSS v4)
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
├── controllers/
│   ├── authController.js     signup / login, JWT issuing
│   ├── propertyController.js CRUD + search/filter for listings
│   └── inquiryController.js  create/list/update tenant↔renter inquiries
├── middleware/
│   ├── authMiddleware.js     verifies Bearer JWT, attaches req.user
│   └── roleMiddleware.js     generic requireRole(...roles) guard
├── models/
│   ├── User.js                name, email, passwordHash, role (renter|tenant)
│   ├── Property.js            listing details + embedded Room subdocuments
│   └── Inquiry.js             tenant → property inquiry with status
├── routes/
│   ├── auth.js                 POST /signup, /login
│   ├── properties.js           GET / (public), GET /:id, POST/PUT/DELETE (auth)
│   └── inquiries.js            POST /, GET / (owner), GET /my (tenant), PUT /:id/status
└── .env.example                 MONGO_URI, PORT, JWT_SECRET

frontend/
├── src/
│   ├── main.jsx               React root, wraps <App/> in <AuthProvider/>
│   ├── App.jsx                 React Router route table
│   ├── api/
│   │   ├── api.js              Axios instance, injects Authorization header from localStorage
│   │   ├── properties.js       fetch/create/update/delete property helpers
│   │   └── inquiries.js        create/fetch/update inquiry helpers
│   ├── context/
│   │   └── AuthContext.jsx      global auth state (user, login, signup, logout)
│   ├── components/
│   │   ├── Header.jsx / Footer.jsx        site chrome
│   │   ├── ProtectedRoute.jsx              role-gated route wrapper
│   │   ├── ListingCard.jsx / SkeletonCard.jsx  property card + loading placeholder
│   │   ├── Modal.jsx                       generic modal shell
│   │   ├── InquiryModal.jsx                tenant "send inquiry" form
│   │   └── EditPropertyModal.jsx           renter "edit listing" form
│   └── screens/
│       ├── home.jsx                         landing page
│       ├── notfound.jsx                     404
│       ├── auth/Login.jsx, Signup.jsx        role-tabbed auth forms
│       ├── dashboard/Find.jsx               search/browse listings
│       ├── dashboard/RenterDashboard.jsx    renter's own listings
│       ├── dashboard/TenantDashboard.jsx    tenant's sent inquiries
│       └── listing/CreateListing.jsx, ListingDetail.jsx  multi-step listing form / detail page
└── tailwind.config.js, vite.config.js
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
- `photos[]` — array of image URLs (no file upload/storage backend — see [Known Limitations](#8-known-limitations)).
- `status` — `available` / `rented` / `coming_soon`.

**Inquiry** (`backend/models/Inquiry.js`)
- Links a `tenant` (User) to a `property` (Property), with a free-text `message`.
- `status` lifecycle: `new` → `contacted` → `closed`, updated by the renter (or self-closed by the tenant from their dashboard).

---

## 4. Backend Architecture

### Request Flow
`index.js` wires: `dotenv` → `express-async-errors` (so async route handlers don't need manual try/catch for error propagation) → `cors` (locked to `http://localhost:5173`) → `express.json()` → mounted routers → a catch-all error handler that returns `{ error: message }` with the appropriate status code.

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

### Styling
Tailwind CSS v4 is wired in via the `@tailwindcss/vite` plugin (no separate PostCSS config needed for the utility layer); `src/index.css` is just `@import "tailwindcss";`. A single custom theme color (`primary: #13a3e9`) is defined in `tailwind.config.js`.

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
```
`CLIENT_ORIGIN` is the single origin allowed to call this API (sets the CORS
`Access-Control-Allow-Origin` header) — set it to your deployed frontend's
URL in production.

The API starts on `http://localhost:5000` (or your `PORT`).

### Seeding sample data
```bash
cd backend
npm run seed    # wipes Users/Properties/Inquiries in MONGODB_URI's database and creates fresh sample data
```
Creates ~4 renters, ~5 tenants, and ~20 listings with realistic details and photo URLs, so pages have real content to browse or measure performance against. **This deletes existing Users/Properties/Inquiries data in the target database** — only run it against a dev database.

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

- **No image upload backend.** Listing photos are plain URL strings; the "Upload files" control in `CreateListing.jsx` only creates local `URL.createObjectURL` previews that are never sent to the server.
- **`roleMiddleware.js` is unused.** Role checks are duplicated inline in each controller instead of composed via `requireRole()` in the route definitions.
- **Renter inquiry inbox not surfaced in the UI.** `GET /api/inquiries` (list inquiries for a renter's properties) and `PUT /api/inquiries/:id/status` are implemented on the backend and in `src/api/inquiries.js`, but `RenterDashboard.jsx` only lists properties — there's no screen consuming `fetchOwnerInquiries`/`updateInquiryStatus` yet.
- **No ownership check on inquiry status updates.** `inquiryController.updateStatus` doesn't verify the requester actually owns the property tied to the inquiry.

---

## 9. Scripts Reference

**Backend** (`backend/package.json`)
- `npm start` — run once with plain `node`
- `npm run dev` — run with `nodemon` (auto-restart)
- `npm run seed` — wipe and repopulate the database with sample renters/tenants/listings

**Frontend** (`frontend/package.json`)
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — ESLint over the project
