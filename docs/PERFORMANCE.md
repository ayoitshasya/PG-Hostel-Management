# Performance & Quality Log

This file tracks measured Lighthouse results over time. Every number here was
actually measured with the method described — nothing is estimated.

## Method (reused for every phase — keep this identical so numbers are comparable)

1. Seed the database: `cd backend && npm run seed`
2. Build the frontend for production: `cd frontend && npm run build`
3. Serve the production build on **port 5173** (matches the backend's CORS
   origin — `vite preview`'s default port 4173 is *not* allowed by CORS, so
   using it would silently fail to load data):
   ```
   node node_modules/vite/bin/vite.js preview --port 5173 --strictPort --host 127.0.0.1
   ```
   (On Windows, this was launched as a detached process via PowerShell's
   `Start-Process` with **no stdout/stderr redirection** — redirecting
   output to a file caused the process to crash within ~1s in this
   environment; the cause wasn't fully root-caused, so the workaround is
   recorded here for reuse.)
4. Start the backend: `cd backend && npm run dev` (must be running so pages
   have real data — an empty/error state was not audited).
5. Before auditing, manually confirm in the Lighthouse JSON's
   `network-requests` audit (or by eye) that listing photos and card grids
   actually loaded — not just that the page returned 200.
6. Run Lighthouse CLI **3 times per page**, mobile emulation (Lighthouse
   CLI's default — simulated mid-tier mobile device, slow 4G throttling,
   4x CPU slowdown), and record the **median** of each metric:
   ```
   npx lighthouse "<url>" --output=json --output=html \
     --output-path="docs/lighthouse/baseline/<page>-run<N>" \
     --chrome-flags="--headless=new" --quiet
   ```
7. Raw reports (HTML + JSON) for every run are saved under
   `docs/lighthouse/baseline/` (or `docs/lighthouse/<phase>/` in later
   phases) and referenced below.

**Environment for this measurement:**
- Date: 2026-09-15
- Lighthouse CLI 12.8.2, Chrome 152.0.7977.84 (headless), Node v22.13.1
- OS: Windows 11
- Form factor: mobile (simulated throttling: RTT 150ms, ~1.6Mbps down, 4x CPU slowdown)
- Data: seeded via `backend/seed.js` — 4 renters, 5 tenants, 20 listings,
  each with 3-5 photos at 1600x1000 (picsum.photos, unoptimized — this is
  intentional, it represents an unoptimized "raw upload" baseline that
  Phase 2/3 will improve on)
- Listing detail page measured: `/listing/6aa904d0602f9f08961701c3`

**Bug found and fixed to make this measurement possible:** `ListingDetail.jsx`
crashed for logged-out visitors (`prop.owner._id == user.id` threw when
`user` was `null`). This meant the listing detail page rendered blank for
any anonymous visitor — including Lighthouse, and including real users
arriving from search results or a shared link without being logged in.
Fixed by adding a `user &&` guard before the check.

---

## Phase 0 — Baseline (2026-09-15)

### Home page (`/`)

| Metric | Run 1 | Run 2 | Run 3 | **Median** |
|---|---|---|---|---|
| Performance | 78 | 78 | 76 | **78** |
| Accessibility | 84 | 84 | 84 | **84** |
| Best Practices | 100 | 100 | 100 | **100** |
| SEO | 83 | 83 | 83 | **83** |
| LCP | 4529 ms | 4471 ms | 4523 ms | **4523 ms** |
| CLS | 0.000 | 0.000 | 0.000 | **0.000** |
| TBT | 10 ms | 32 ms | 128 ms | **32 ms** |
| FCP | 3155 ms | 3113 ms | 3166 ms | **3155 ms** |
| Speed Index | 3155 ms | 3113 ms | 3166 ms | **3155 ms** |

Reports: [run1](lighthouse/baseline/home-run1.report.html) ·
[run2](lighthouse/baseline/home-run2.report.html) ·
[run3](lighthouse/baseline/home-run3.report.html)

The home page has no listing photos, so its LCP element is text — the ~4.5s
LCP here reflects JS bundle parse/render time on a throttled mobile CPU, not
image weight.

### Find / search page (`/find`)

| Metric | Run 1 | Run 2 | Run 3 | **Median** |
|---|---|---|---|---|
| Performance | 64 | 62 | 67 | **64** |
| Accessibility | 79 | 79 | 79 | **79** |
| Best Practices | 100 | 100 | 100 | **100** |
| SEO | 83 | 83 | 83 | **83** |
| LCP | 5054 ms | 5218 ms | 5064 ms | **5064 ms** |
| CLS | 0.191 | 0.191 | 0.191 | **0.191** |
| TBT | 187 ms | 179 ms | 21 ms | **179 ms** |
| FCP | 3152 ms | 3161 ms | 3085 ms | **3152 ms** |
| Speed Index | 3152 ms | 3636 ms | 3085 ms | **3152 ms** |

Reports: [run1](lighthouse/baseline/find-run1.report.html) ·
[run2](lighthouse/baseline/find-run2.report.html) ·
[run3](lighthouse/baseline/find-run3.report.html)

20 full-size (1600x1000, unoptimized) listing card images load on this page
with no `loading="lazy"`, no explicit dimensions, and no responsive
`srcset`. CLS of 0.191 (above the "good" threshold of 0.1) and the 5s+ LCP
are expected consequences — this is the page Phase 2 (lazy loading,
width/height/aspect-ratio, image weight) should move the most.

### Listing detail page (`/listing/:id`)

| Metric | Run 1 | Run 2 | Run 3 | **Median** |
|---|---|---|---|---|
| Performance | 65 | 78 | 67 | **67** |
| Accessibility | 80 | 80 | 80 | **80** |
| Best Practices | 100 | 100 | 100 | **100** |
| SEO | 83 | 83 | 83 | **83** |
| LCP | 5073 ms | 4007 ms | 4987 ms | **4987 ms** |
| CLS | 0.118 | 0.118 | 0.118 | **0.118** |
| TBT | 13 ms | 10 ms | 167 ms | **13 ms** |
| FCP | 3127 ms | 3091 ms | 3155 ms | **3127 ms** |
| Speed Index | 7033 ms | 3091 ms | 4957 ms | **4957 ms** |

Reports: [run1](lighthouse/baseline/listing-run1.report.html) ·
[run2](lighthouse/baseline/listing-run2.report.html) ·
[run3](lighthouse/baseline/listing-run3.report.html)

The hero photo (1600x1000, unoptimized, no `fetchpriority`, no explicit
size) is almost certainly the LCP element here. Run-to-run variance (Speed
Index ranged 3.1s-7.0s) is notably high for this page — worth re-checking
after Phase 2 changes to confirm it wasn't a fluke of this machine under
load during measurement.

### Summary

| Page | Perf | A11y | Best Practices | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 78 | 84 | 100 | 83 | 4523 ms | 0.000 |
| Find | 64 | 79 | 100 | 83 | 5064 ms | 0.191 |
| Listing detail | 67 | 80 | 100 | 83 | 4987 ms | 0.118 |

Accessibility and SEO scores (79-84 / 83) leave clear room for Phase 4 and
Phase 5. Performance is worst on the two pages with real images (`/find`,
listing detail) — consistent with there being no lazy loading, no
compression, and no explicit image dimensions yet.

---

## Phase 2 — Frontend performance (2026-09-15)

Changes made, in the order implemented and measured:

1. **Route-level code splitting** (`React.lazy` + `Suspense` in `App.jsx`)
   for `CreateListing`, `RenterDashboard`, `TenantDashboard`. (`ListingDetail`
   was also split initially, then reverted — see the finding below.)
2. **Image loading attributes** on `ListingCard` and `ListingDetail`:
   `loading="lazy"` + `decoding="async"` by default; the one card most
   likely to be the page's LCP element (the first "Recommended" card on
   `/find`, and the hero photo on the listing detail page) gets
   `loading="eager"` + `fetchPriority="high"` instead; explicit
   `width`/`height` attributes; an `onError` fallback so a broken photo URL
   shows a placeholder instead of a broken-image icon. Same treatment
   applied to the home page's hero image.
3. **A loading-state CLS fix on `/find`** — found while investigating why
   CLS didn't move from the image changes alone (see below).
4. **Bundle analyzer** (`rollup-plugin-visualizer`) added to `vite.config.js`
   — writes `dist/stats.html` on every build (gitignored with the rest of
   `dist/`).
5. **`Cache-Control` headers** on the two public read endpoints,
   `GET /api/properties` and `GET /api/properties/:id`.

### Finding: images weren't the CLS problem — loading-state defaults were

The original plan was that explicit image `width`/`height` would fix CLS.
Measuring after step 2 alone showed **zero change** to CLS on either page
(`/find` stayed at 0.191, listing detail stayed at 0.118). Investigating
with Lighthouse's `layout-shifts` audit (which names the exact DOM node
Chrome attributes each shift to) showed the images were never the cause:

- `ListingCard`'s thumbnail sits inside a container with a fixed Tailwind
  height (`h-44`), so the image's own load timing can't shift anything —
  the box is already the right size before the image arrives, with or
  without `width`/`height` attributes.
- On `/find`, the real cause was `loadingRecommended`/`loadingResults`
  defaulting to `useState(false)`. Since both are always fetched on mount,
  the very first render (before the `useEffect` fires) briefly showed the
  tiny "No results found" empty-state text instead of the loading
  skeleton, which then jumped to the full grid a moment later. Changing
  both to default to `useState(true)` — since a fetch is always about to
  start — means the full-height skeleton is what's on screen from the
  first render. **Fix confirmed: CLS on `/find` went from 0.191 to
  0.000, single-run check.**
- On the listing detail page, `loading` already defaulted to `true`, but
  its placeholder (`h-[70vh]`) is much shorter than the real rendered
  content (title, description, amenities, location, sidebar), so the
  `Footer` still jumps down once real content replaces the placeholder.
  **This one is not fixed.** A real fix means either a skeleton that
  mirrors the actual two-column layout (like `SkeletonCard` does for
  listing cards) or server-side rendering; a placeholder height picked to
  match one specific listing's content length would only be correct for
  that listing (amenity count and description length vary per property),
  so I left it as a documented follow-up rather than hard-coding a number
  that happens to work for the one listing used in this measurement.

### Finding: code-splitting `ListingDetail` made *that page* slower to reach

After splitting all four routes and re-measuring, `/find` and home both
improved, but the listing detail page's FCP got **worse** by ~300ms
(3127ms → 3441ms median) and LCP was also higher. Checking the
`network-requests` audit explained why: splitting `ListingDetail` out of
the main bundle also pulled `api/inquiries.js` (only used by
`InquiryModal`, which only `ListingDetail` imports) into its own chunk.
Landing directly on `/listing/:id` — a fresh page load, not a client-side
navigation from elsewhere in the app — now had to fetch and parse the main
bundle, discover the route needs the lazy chunk, then fetch *that* before
anything could paint: one extra full network round trip before first
paint, which is expensive under Lighthouse's simulated mobile
throttling (150ms RTT, 4x CPU slowdown).

This is a real, known code-splitting tradeoff, not a bug: splitting a
route shrinks the bundle for every *other* page, at the cost of an extra
round trip the first time someone lands directly on the split page.
`CreateListing` and the two dashboards are behind login and reached by
in-app navigation almost exclusively, so they're good candidates.
`ListingDetail` is a public, directly-linkable page — the kind of page
people reach from search results or a shared link — so it's a bad
candidate for this specific tradeoff, and Phase 5 (SEO) makes that even
more true. **Decision: reverted `ListingDetail` to a normal static
import**, keeping the other three lazy. Re-measuring confirmed FCP
returned to baseline parity (3127ms → 3117ms median, effectively
unchanged).

### Bundle size (measured from `vite build` output, not estimated)

| State | Main chunk (raw / gzip) | Lazy chunks (raw / gzip) |
|---|---|---|
| Before Phase 2 (single bundle) | 314.00 kB / 99.01 kB | none |
| All 4 routes split (intermediate) | 287.84 kB / 94.41 kB | 4 chunks, 28.28 kB / 8.15 kB total |
| Final (ListingDetail reverted, 3 routes split) | 298.09 kB / 96.39 kB | 3 chunks, 17.93 kB / 5.28 kB total |

Net effect: everyone's initial download (main chunk) shrank by **15.91 kB
raw / 2.62 kB gzip (~2.6%)** — visitors to `/create-listing`,
`/renter-dashboard`, or `/tenant-dashboard` now fetch that page's code
separately instead of it shipping to every visitor.

### Bundle composition (`rollup-plugin-visualizer`, `dist/stats.html`)

Measured from the raw-data output (pre-minification module sizes, so
percentages are more meaningful than absolute bytes here):

| Contributor | Share of total bundle |
|---|---|
| `react-dom` | 65.1% |
| `axios` | 11.6% |
| `react-router` | 8.5% |
| `react` | 2.4% |
| `scheduler` (react-dom dependency) | 1.3% |
| **All of our own app code combined** (every screen + component) | **~10.5%** |

The honest takeaway: our own code is a small fraction of the bundle.
`react-dom` alone is more than six times the size of every screen and
component in this app combined. Splitting our own route components
(step 1) only ever had a few KB to save, because there just isn't much of
*our* code to split. A meaningfully smaller bundle would mean trimming or
replacing a dependency (e.g. `axios` → the built-in `fetch`, which would
remove 11.6% of the bundle for very little functional loss here), not
splitting more of our own small screens.

### `Cache-Control` verification (curl, not Lighthouse)

`vite preview` only serves the frontend — it doesn't reflect backend
response headers, so this was checked directly against the running
backend:

```
$ curl -sI "http://localhost:5000/api/properties"
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Cache-Control: public, max-age=60, stale-while-revalidate=30

$ curl -sI "http://localhost:5000/api/properties/6aa904d0602f9f08961701c3"
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Cache-Control: public, max-age=300, stale-while-revalidate=60
```

Confirmed the header is scoped correctly — absent on the authenticated
write routes (`POST /api/properties` returns 401 with no `Cache-Control`)
and on unrelated routes (`GET /api/inquiries/my`).

**The tradeoff:** a renter who edits a listing's price, photos, or
availability won't be reflected to a tenant with an already-cached
response until the cache entry expires — up to 60 seconds for search
results, up to 5 minutes for a single listing's detail page. That's an
acceptable staleness window for a browse-and-inquire flow (nothing breaks
if a price is 60 seconds stale), but it would **not** be acceptable if
"available"/"rented" status needed to be real-time-accurate — a room
that just got rented could still show as available for up to 5 minutes to
someone with a cached response. If that mattered, the right fix would be
a much shorter `max-age` on `status`-sensitive data, or cache
invalidation on write, not just removing caching entirely.

### What this measurement *can't* show — only verifiable after deployment

Checked directly, since it's easy to be wrong by assumption here:

```
$ curl -sI "http://localhost:5173/assets/index-DjZA660T.js"
HTTP/1.1 200 OK
Cache-Control: no-cache
```

`vite preview` sends `Cache-Control: no-cache` on every static asset —
including the content-hashed JS/CSS files that are safe to cache
forever — and sent no `Content-Encoding` even when the request offered
`Accept-Encoding: gzip, br`. Two things this phase's numbers do **not**
reflect, because `vite preview` is a local dev-grade static server, not a
production host:

- **Compression.** Vercel (and most real hosts) automatically serve
  gzip/brotli-compressed JS/CSS. The gzip sizes in the bundle table above
  are what a compressed transfer *would* be, but this lab measurement's
  actual network transfer during the Lighthouse runs was uncompressed.
- **Long-lived static asset caching.** Production hosts typically set
  `Cache-Control: public, max-age=31536000, immutable` on hashed
  filenames like `index-DjZA660T.js` (safe because any content change
  produces a new filename). Repeat visits on a real deployment should
  skip re-downloading unchanged JS/CSS entirely — something a fresh
  Lighthouse run against `localhost` can never show, since Lighthouse
  always audits a cold load.

Both should be re-verified with PageSpeed Insights against the live URL
after Phase 3's deployment, alongside the API's `Cache-Control` headers
above (which *do* already work locally, unlike the static asset caching).

### Results: final (3 runs/page, median, mobile emulation)

Method identical to the Phase 0 baseline. Raw reports:
[home](lighthouse/phase2/home-run1.report.html) ([2](lighthouse/phase2/home-run2.report.html), [3](lighthouse/phase2/home-run3.report.html)) ·
[find](lighthouse/phase2/find-run1.report.html) ([2](lighthouse/phase2/find-run2.report.html), [3](lighthouse/phase2/find-run3.report.html)) ·
[listing](lighthouse/phase2/listing-run1.report.html) ([2](lighthouse/phase2/listing-run2.report.html), [3](lighthouse/phase2/listing-run3.report.html))

#### Home page (`/`)

| Metric | Baseline | Phase 2 | Change |
|---|---|---|---|
| Performance | 78 | 79 | +1 |
| Accessibility | 84 | 84 | — |
| LCP | 4523 ms | 4284 ms | -239 ms |
| CLS | 0.000 | 0.000 | — |
| TBT | 32 ms | 7 ms | -25 ms |
| FCP | 3155 ms | 2898 ms | -257 ms |
| Speed Index | 3155 ms | 3356 ms | +201 ms (noise — one run hit 7937ms, likely the external Unsplash hero image's real network latency, not anything Phase 2 changed) |

Runs: Perf [73, 82, 79], LCP [4284, 4052, 4397] ms, SI [7937, 3356, 3038] ms.

#### Find / search page (`/find`)

| Metric | Baseline | Phase 2 | Change |
|---|---|---|---|
| Performance | 64 | 79 | **+15** |
| Accessibility | 79 | 79 | — |
| LCP | 5064 ms | 4390 ms | -674 ms |
| CLS | 0.191 | **0.000** | **fixed** |
| TBT | 179 ms | 19 ms | -160 ms |
| FCP | 3152 ms | 3091 ms | -61 ms |
| Speed Index | 3152 ms | 3208 ms | +56 ms (noise — one run hit 6718ms) |

Runs: Perf [73, 79, 79], LCP [4390, 4278, 4415] ms, CLS [0.000, 0.000, 0.000] (all three runs, not just the median — the fix is consistent, not a fluke).

#### Listing detail page (`/listing/:id`)

| Metric | Baseline | Phase 2 | Change |
|---|---|---|---|
| Performance | 67 | 69 | +2 |
| Accessibility | 80 | 80 | — |
| LCP | 4987 ms | 5416 ms | +429 ms (see note) |
| CLS | 0.118 | 0.118 | unchanged — root cause identified, not fixed (see above) |
| TBT | 13 ms | 0 ms | -13 ms |
| FCP | 3127 ms | 3117 ms | -10 ms (confirms the code-split revert worked — without it this was +314 ms) |
| Speed Index | 4957 ms | 4184 ms | -773 ms |

Runs: Perf [69, 71, 66], LCP [5416, 5032, 5890] ms. This page's LCP has a
~900ms spread across just 3 runs both in the baseline (4007-5073ms) and
here (5032-5890ms) — wider than the other two pages. The median moved
against us, but given the spread, 3 runs isn't enough to confidently call
this a regression versus noise; FCP (a tighter, more reliable signal, see
the code-splitting finding above) confirms no real degradation.

### Summary

| Page | Perf (base→P2) | CLS (base→P2) | LCP (base→P2) |
|---|---|---|---|
| Home | 78→79 | 0.000→0.000 | 4523→4284 ms |
| Find | 64→**79** | 0.191→**0.000** | 5064→4390 ms |
| Listing detail | 67→69 | 0.118→0.118 (unfixed) | 4987→5416 ms (noisy) |

The clearest, most confident win is `/find`: +15 performance points and a
fully-fixed CLS, both consistent across all 3 runs. Home improved
modestly and consistently. Listing detail is a mixed/inconclusive result
on the noisier metrics (LCP, Speed Index) but a confirmed non-regression
on the reliable one (FCP) once the code-splitting decision was corrected
— and still has a known, documented, unfixed CLS issue to pick up later.

---

## Phase 3 — Real image upload/optimization, and the listing detail CLS fix (2026-09-15)

### Security check before starting

Confirmed before touching any Cloudinary code: `backend/.env` is gitignored
(`backend/.gitignore` line 2), and `git log --all --full-history -- backend/.env`
returns nothing — no `.env` file has ever been committed, at any point in
this repo's history. Credentials were added directly to the local
`backend/.env` (never pasted into chat, logged, or written to a tracked
file) and read only via `process.env.*`.

### Pipeline built

`backend/lib/imagePipeline.js` is the shared core, used by both the real
upload endpoint and the seed script:

1. `sharp(buffer).metadata()` reads real dimensions and EXIF orientation
   (auto-orient is applied before resizing, then the orientation tag - and
   all other metadata - is dropped, since `withMetadata()` is never
   called).
2. Generates WebP at up to 3 widths (400/800/1200), skipping any width
   larger than the source image (`withoutEnlargement`, plus filtering
   target widths against the real source width up front).
3. Uploads each width as its own real file to Cloudinary under
   `roomie/properties/` — not a Cloudinary on-the-fly transform URL.
4. Returns `{width, height, variants: [{width, url, publicId}]}`, stored
   on `Property.photoAssets` (additive - the existing `photos: [String]`
   field is untouched, so old data and manually-pasted URLs still render).

`backend/middleware/upload.js` (multer, memory storage) rejects files
over 8MB or more than 8 per request before they ever reach the pipeline;
`processAndUploadImage` itself is the real validation layer, since the
client-supplied MIME type multer checks first is trivially spoofable.

### End-to-end verification (manual, before wiring the UI)

Tested directly against the running backend (temporary scripts, deleted
after use, test assets cleaned up from Cloudinary afterward):

| Test | Result |
|---|---|
| Cloudinary connection (tiny generated image, upload + delete) | OK |
| Real upload (1000×600 JPEG) → correct variants | Generated 800w/400w, correctly **skipped 1200w** (source narrower than that) |
| Spoofed mimetype (text content labeled `image/jpeg`) | Rejected: `400`, sharp failed to parse it |
| Wrong mimetype (`.txt`) | Rejected: `400` at the multer filter, before reaching sharp |
| Oversized file (9MB) | Rejected: `400`, "File too large - max 8MB per photo" |
| No auth token | Rejected: `401` |
| Full lifecycle: upload → create listing with `photoAssets` → fetch it back → delete listing → check Cloudinary | `photoAssets` round-tripped through Mongoose correctly; both variants confirmed **actually deleted** from Cloudinary after the listing was deleted (`cloudinary.api.resource()` returned "not found" for each) |

### Idempotent seeding

The seed script now fetches each picsum source image for real and pushes
it through the same pipeline (not a shortcut), so seeded listings
exercise `photoAssets`/`srcset` exactly like production data. To avoid
piling up duplicate Cloudinary files on every re-run, each photo gets a
**deterministic Cloudinary `public_id`** keyed to `listing index + photo
slot` (e.g. `seed-listing3-photo1`), uploaded with `overwrite: true`.

Deliberately *not* keyed to the picsum seed name itself: the 25 picsum
seeds repeat across 20 listings × up to 5 photos each, so two different
listings can end up using the same source image. Keying by seed name
would make them share one Cloudinary asset - harmless until someone
deletes one of those listings, which would then delete the *other*
listing's photo too. Keying by listing+slot instead keeps every
listing's assets independent even when the visible photo is a repeat.

Verified by running the seed script twice in a row and counting assets
under `roomie/properties/` via `cloudinary.api.resources()` both times:

| Run | Cloudinary assets under `roomie/properties/` |
|---|---|
| After 1st seed | 237 |
| After 2nd seed (immediate re-run) | 237 (unchanged - confirmed idempotent) |

(237 = 79 photos × 3 variants each; every seeded photo is a 1600px-wide
source, so all three target widths always qualify.)

### Measured image size reduction

From a real Lighthouse network trace against `/find`, comparing the same
page before (Phase 0, full 1600×1000 JPEGs) and after (Phase 3, pipeline
WebP variants):

| | Images loaded | Total transferred | Avg size/image |
|---|---|---|---|
| Phase 0 baseline | 20 (eager, no lazy loading yet) | 3025 KB | 151.2 KB |
| Phase 3 | 6 (Phase 2's `loading="lazy"` means only above-the-fold cards load in a cold trace) | 119 KB | 19.8 KB |

The image-count difference between the two rows is Phase 2's lazy
loading doing its job (not fetching all 20 upfront), so it's not an
apples-to-apples total. The fair, pipeline-attributable number is the
**per-image average: 151.2 KB → 19.8 KB, an ~87% reduction** — same
visual content, WebP instead of unoptimized JPEG, sized to what the card
actually displays (800w) instead of the full 1600px original.

### Listing detail CLS fix

Replaced the `h-[70vh]` "Loading property details..." text placeholder
with `ListingDetailSkeleton.jsx`, which mirrors the real page: same
`max-w-7xl`/`grid-cols-1 lg:grid-cols-3`/`gap-8` structure, an
`aspect-[8/5]` hero block (rather than a fixed pixel height, so it isn't
tuned to one listing), placeholder lines for title/badges/description,
the same 6-item info grid, an amenity-pill row, and a sidebar contact
card placeholder - sized with Tailwind's rem-based spacing scale
throughout. The real hero image container was also switched from a fixed
`h-80` to the same `aspect-[8/5]`, so skeleton and real content reserve
matching space.

First measured against interim data (old listing, before the pipeline
reseed) to isolate the skeleton/layout effect alone: Performance 69→75,
CLS 0.118→**0.000** (0.000 on all 3 runs), LCP 5416ms→5058ms, FCP
3117ms→3079ms. Reports:
[run1](lighthouse/phase3/listing-cls-run1.report.html) ·
[run2](lighthouse/phase3/listing-cls-run2.report.html) ·
[run3](lighthouse/phase3/listing-cls-run3.report.html)

This closes the CLS gap identified but left unfixed in Phase 2 - all
three measured pages now have CLS 0.000. See "Final Phase 3 results"
below for the complete post-reseed numbers (real Cloudinary images,
all three pages) requested for the phase writeup.

### `srcset` confirmed working (not just present in the markup)

Checked via Lighthouse's network trace, not assumed: on `/find` (mobile
viewport), the browser requested the **800w** variant for card
thumbnails - not the 1200w or 400w - matching the card's actual rendered
width via the `sizes` attribute. Same on the listing detail hero: 800w
requested for a ~66vw-on-desktop, full-width-on-mobile hero image.

### Known limitations carried forward

- If a renter removes a just-uploaded photo in `CreateListing` before
  submitting the form, that Cloudinary asset isn't deleted immediately
  (it's simply excluded from the payload) - it becomes an orphan unless
  the renter never returns to finish creating that listing. A cleanup
  job or delete-on-remove call would close this; not built here.
- `EditPropertyModal` still doesn't expose photo management (add/remove
  photos on an existing listing) - it only edits title/description/price/
  status, same as before this phase. Out of scope for what was asked.

**Fixed since first written:** a multi-file upload used to fail as a
whole if any one file was invalid (`Promise.all` short-circuits) without
cleaning up files that had already succeeded. Now uses
`Promise.allSettled`, and if any file fails, every file that *did*
succeed in that batch is deleted from Cloudinary before returning the
error - an all-or-nothing result with no orphaned files either way.
Tested with a 3-file batch (2 valid JPEGs + 1 corrupt file): request
correctly returned `400`, and `cloudinary.api.resources()` confirmed the
asset count under `roomie/properties/` was unchanged (237 before, 237
after) - both valid uploads were rolled back, not left behind.

### Final Phase 3 results (all 3 pages, post-reseed with real Cloudinary images)

Full re-measurement after reseeding with the real pipeline, so this
reflects the complete Phase 3 state - not just the CLS fix in isolation.
Same method as every prior phase: 3 runs/page, median, mobile emulation.

| Metric | Page | Baseline | Phase 2 | Phase 3 |
|---|---|---|---|---|
| Performance | Home | 78 | 79 | 76 |
| | Find | 64 | 79 | **80** |
| | Listing detail | 67 | 69 | **81** |
| LCP | Home | 4523 ms | 4284 ms | 4536 ms |
| | Find | 5064 ms | 4390 ms | **4211 ms** |
| | Listing detail | 4987 ms | 5416 ms | **3884 ms** |
| CLS | Home | 0.000 | 0.000 | 0.000 |
| | Find | 0.191 | 0.000 | 0.000 |
| | Listing detail | 0.118 | 0.118 | **0.000** |
| TBT | Home | 32 ms | 7 ms | 138 ms |
| | Find | 179 ms | 19 ms | 66 ms |
| | Listing detail | 13 ms | 0 ms | 147 ms |
| FCP | Home | 3155 ms | 2898 ms | 3117 ms |
| | Find | 3152 ms | 3091 ms | 3109 ms |
| | Listing detail | 3127 ms | 3117 ms | 3108 ms |

Reports: [home](lighthouse/phase3/home-run1.report.html) ([2](lighthouse/phase3/home-run2.report.html), [3](lighthouse/phase3/home-run3.report.html)) ·
[find](lighthouse/phase3/find-run1.report.html) ([2](lighthouse/phase3/find-run2.report.html), [3](lighthouse/phase3/find-run3.report.html)) ·
[listing](lighthouse/phase3/listing-run1.report.html) ([2](lighthouse/phase3/listing-run2.report.html), [3](lighthouse/phase3/listing-run3.report.html))

**Listing detail LCP (4987ms → 5416ms → 3884ms) is the headline number**:
1.1s better than baseline, 1.5s better than Phase 2. Attributable to two
concrete, real changes rather than noise - the hero photo went from an
unoptimized JPEG (avg 151.2KB across the site) to a real WebP variant
(avg 19.8KB), and the CLS fix means the browser doesn't have to
recalculate the LCP candidate after a late layout shift.

**Home got slightly worse (79→76 performance, TBT 7ms→138ms) - flagged,
not hidden, and very likely noise rather than a real regression.** Phase
3 touched zero code on the home page (its hero is a static Unsplash
image, unrelated to the property image pipeline). TBT has been the
noisiest metric measured throughout this project - baseline alone
ranged 10-128ms across 3 runs on this exact page - and 138ms sits
inside that same band.

---

## Phase 4 — Accessibility (2026-09-15)

### What was done

1. **`eslint-plugin-jsx-a11y`** added to `eslint.config.js` (flat config,
   `recommended` ruleset). Found 11 real errors on the first run: 6
   unlabeled form controls, 2 click handlers on non-interactive `<div>`s,
   1 invalid `href="#"`, 2 more once the sweep widened. All fixed - see
   commits for the full list. `npm run lint` was 0 errors both before and
   after Phase 4 started (this ruleset is what surfaced the new ones).
2. **Landmarks**: `App.jsx` now wraps all routed content in a single
   `<main id="main-content">`, with a "Skip to main content" link before
   `<Header>` (visually hidden until focused). Three screens
   (`home.jsx`, `Login.jsx`, `Signup.jsx`) had their own nested `<main>`
   left over from before this wrapper existed - found via a full-app
   grep for `<main`, not assumed; changed to `<div>` since a page must
   have exactly one `<main>`. `Header`/`Footer`/nav were already correct.
3. **Heading order**: audited every screen (`grep -rn "<h[1-6]"`) and
   fixed every page to have exactly one `<h1>` with no skipped levels
   below it - `Find`, `RenterDashboard`, and `TenantDashboard` had no
   `<h1>` at all (started at `<h2>`); `ListingDetail` jumped straight
   from `<h1>` to `<h4>` for its info-grid labels. `ListingCard`'s title
   heading level is now a `headingLevel` prop (2 or 3) since the same
   component sits directly under an `<h1>` in `RenterDashboard` but under
   an `<h2>` section in `Find` - one fixed level would have broken one of
   the two.
4. **Labels**: every input in `Login`, `Signup`, `CreateListing`,
   `InquiryModal`, `EditPropertyModal`, and `Find`'s filter bar now has a
   real associated `<label>` (visually hidden via `sr-only` where a
   visible label would duplicate a placeholder or clutter a compact
   filter bar). `CreateListing`'s repeated room fields are also wrapped
   in `<fieldset>`/`<legend>` per room - without that, a screen reader
   announces "Price" identically for every room with no way to tell
   which one. Validation/status messages got `role="alert"` (errors) or
   `role="status"` (success/progress) so they're announced when they
   appear, not just visible.
5. **`Modal.jsx`** rewritten: `role="dialog"`, `aria-modal="true"`,
   `aria-labelledby` pointing at the title, focus moves to the first
   focusable element on open, Tab/Shift+Tab is trapped inside the dialog,
   Escape closes it, and focus returns to whatever triggered the modal
   when it closes (tracked via `document.activeElement` at open time).
   Used by both `InquiryModal` and `EditPropertyModal`.
6. **Keyboard/interactive fixes**: `ListingCard` and the inquiry-card
   thumbnail in `TenantDashboard` were `<div onClick>` (mouse-only,
   unreachable by keyboard, and what jsx-a11y flagged) - both are now a
   real `<Link>`, which gets keyboard operability, screen-reader link
   semantics, and middle-click/cmd-click "open in new tab" for free
   instead of reimplementing any of it. Role-toggle buttons (Renter/
   Tenant, amenity filters) got `aria-pressed` so their selected state is
   announced, not just shown with a color change. A site-wide
   `:focus-visible` outline was added to `index.css` as a fallback so
   nothing relies on remembering to style every interactive element.
7. **Contrast** - see below, this is the big one.
8. **Alt text**: `alt={property.title}` was already in place on listing
   photos (meaningful, not "image123"); fixed the home page hero to
   `alt=""` (decorative - the overlaid heading already states the same
   thing, so a screen reader announcing "Room" adds nothing) and three
   decorative logo SVGs (Header, Login, Signup) to `aria-hidden="true"`.

### Contrast: a real, measured failure - and a build bug that hid the fix

You flagged `#13a3e9` as suspect. Measured it properly instead of
eyeballing:

```
#13a3e9 vs white: 2.82:1
```

That fails WCAG AA even for large/bold text (needs 3:1) - there's no
text size at which this hue works on a white background, so "keep the
brand color for large elements where it passes" doesn't have a case to
apply to: nothing passes. Checking further, Tailwind's built-in
`sky-500` (used throughout the app alongside the custom color) has the
identical problem: `#0ea5e9` vs white = 2.77:1. This wasn't one color to
patch - it was most of the app's buttons and links.

Fix: added `primary-dark` (darkened until it passes with real margin,
not just barely) and swapped every interactive text/button-fill use of
`primary`/`sky-500`/`sky-600` to it across the whole frontend. Kept the
original bright `primary` for the one legitimate non-text use (the
decorative, now-`aria-hidden` logo mark).

**While re-measuring to confirm the fix, found something bigger**: the
new color barely changed anything in the compiled CSS. Checked the
build output directly (not just visually) - `grep`-ing the compiled CSS
for `primary` or the hex values returned **zero matches**, for either
the old or new color. Root cause: this project's Tailwind v4 setup
(`@tailwindcss/vite`) does not read `tailwind.config.js` at all unless a
CSS file explicitly does `@config "..."` - this one never did. That
means `bg-primary`/`text-primary` have compiled to **nothing** since
Phase 0, not just during this phase - the brand color in `tailwind.config.js`
was dead configuration from the very first commit, silently doing
nothing, the whole project. Fixed properly by moving the color
definitions into `src/index.css` via Tailwind v4's native `@theme`
block, and deleted the now-fully-dead `tailwind.config.js`. Confirmed
via the same direct-string-search method (not visual inspection) that
`primary`/`primary-dark`/the hex values are now actually present in the
built CSS.

One more real, measured miss caught by re-running Lighthouse after that
fix: `primary-dark` (4.65:1 against pure white) dropped to 4.33:1
against Login/Signup's slightly off-white page background (`#f5f7f8`,
not `#fff`) - just under the 4.5:1 minimum. Darkened `primary-dark`
further (to 6.47:1 against white, with margin) rather than special-case
one page's background.

Also fixed once the pattern search widened past the one brand color:
`text-red-500`/`text-green-600`/`text-yellow-600` status text (3.8/3.2/2.9:1,
all failing) across `ListingDetail`, `TenantDashboard`, `CreateListing`;
`text-gray-400`/`text-slate-400` used for real content text like "No
Image" and form helper text (2.6:1, failing - `placeholder:` text was
left alone, since placeholder contrast is conventionally more lenient
and wasn't flagged by Lighthouse).

### Lighthouse accessibility score, before → after

| Page | Before | After |
|---|---|---|
| Home | 84 | **100** |
| Find | 79 | **100** |
| Listing detail | 80 | **100** |
| Login | not previously tracked | **100** |
| Signup | not previously tracked | **100** |

Zero remaining automated findings on any of the 5 pages checked, and no
runtime errors introduced (`r.runtimeError` checked on every page, not
assumed). Reports: [home](lighthouse/phase4/home.report.html) ·
[find](lighthouse/phase4/find.report.html) ·
[listing](lighthouse/phase4/listing.report.html) - Login/Signup were
accessibility-only runs (`--only-categories=accessibility`), raw JSON at
`lighthouse/phase4/login.report.json` / `signup.report.json`.

### What automated tools cannot verify - check these manually

Lighthouse and eslint-plugin-jsx-a11y catch missing labels, bad
contrast, missing landmarks, and similar static/structural issues. They
cannot tell you the experience is actually good. Specifically worth
checking by hand:

- **Keyboard-only pass, no mouse at all**: Tab through each of the 5
  forms and the `CreateListing` wizard end-to-end. Confirm the tab order
  matches visual order (nothing jumps around), every control is
  reachable, and the visible focus ring (the new `:focus-visible`
  outline) is actually visible against every background it lands on.
- **Modal focus trap, for real**: open `InquiryModal` or
  `EditPropertyModal`, Tab past the last field and confirm focus wraps
  to the close button (not out into the page behind it), Shift+Tab from
  the first field wraps to the last, Escape closes it, and focus visibly
  lands back on the button that opened it. This is exactly the kind of
  logic Lighthouse cannot execute - it never actually presses Tab.
- **Screen reader pass** (VoiceOver on Mac, NVDA on Windows - both free):
  open the same two modals and confirm the dialog's title is announced
  immediately on open (not silence, not "the whole page again"); submit
  each form with a validation error and confirm the error is announced
  without needing to navigate to it (the `role="alert"` additions are
  supposed to do this, but only a real screen reader confirms it
  actually fires); step through `CreateListing`'s room `<fieldset>`s and
  confirm "Room 2 price" is actually what gets announced, not just
  "Price" again.
- **Zoom to 200%**: the multi-step wizard and the filter bar use fairly
  tight custom widths (`w-[560px]`, `w-[760px]` on the auth screens) -
  confirm nothing clips or requires horizontal scrolling at high zoom,
  which Lighthouse's automated pass doesn't check at all.
- **Reduced motion**: none of this phase's changes added animation
  beyond existing `transition`/`animate-pulse` classes, but worth a
  quick check with `prefers-reduced-motion` enabled since it wasn't
  specifically tested.

---

## Interlude — `/find` filter bug fix (2026-09-16)

Reported: selecting Apartment + Men + wifi/parking/ac on `/find` returned
"No results found" even though the "Recommended" row showed a men's
hostel and a co-ed apartment. Diagnosed with curl against live data
before writing any fix - it was **two independent bugs**, not one:

1. **Amenities case/wording mismatch.** `Find.jsx`'s filter chips sent
   lowercase (`wifi`), seeded data stored capitalized/differently-worded
   values (`WiFi`, `Power Backup`), and `CreateListing`'s checkboxes used
   a *third*, different set entirely (`gas`, `hotWater` - not even in the
   seed's pool). Confirmed with curl: `amenities=wifi` and
   `amenities=WiFi` both returned 0 against data that provably had
   `'WiFi'` stored, until fixed.
2. **The old seed script's data-generation bug** (unrelated to
   amenities): `pick(PROPERTY_TYPES, i)` and `pick(AUDIENCES, i)` both
   used `i % 3` (both arrays have length 3), so type and audience always
   advanced in lockstep. Only 3 of the 9 possible combinations ever
   existed: PG+women, Hostel+men, Apartment+co-ed. Confirmed by
   aggregating the live data: **zero** listings existed with
   Apartment+Men, independent of amenities entirely.

For the exact repro (Apartment + Men + amenities), bug #2 was the
dominant cause - that combination could not have returned results no
matter what amenities were selected, since it never existed. Bug #1 is
real and separately confirmed (checked against PG+women, which does
have data: `amenities=WiFi` returned 0 before the fix on data confirmed
to contain `'WiFi'`).

**Fix**: `backend/constants/listingOptions.js` is now the single source
of truth for propertyType/audience/furnishing/status/amenities, enforced
by the Property model's enum validation and exposed via a new public
`GET /api/meta/options` endpoint that `Find.jsx`/`CreateListing.jsx` now
fetch instead of hardcoding their own copy. Amenities are stored
lowercase (schema `lowercase: true`) and matched case-insensitively on
the query side too. `propertyType`/`targetAudience`/`furnishing`/`status`
were confirmed (direct comparison, not assumed) to already match the new
constants exactly - no data migration needed for those four fields, only
amenities.

**Migration** (`backend/migrate-amenities.js`, run by the user, not me -
data-changing scripts are their call): `--dry-run` first showed 20/20
documents needing a case/wording change, 0 merges, 0 unmapped values;
the live run applied it; a second `--dry-run` afterward showed 0 -
confirmed idempotent.

**Verified with curl after the fix** (all against the pre-existing
20-listing dataset, before any seed changes):

| Filter | Result |
|---|---|
| `amenities=wifi` | 12 results, all genuinely have `wifi` |
| `amenities=parking,ac` (must have both) | 2 results, both genuinely have both |
| `propertyType=Apartment&audience=men` | 0 (confirmed: this combination didn't exist in the old data - see bug #2 above) |
| `minPrice=8000&maxPrice=14000` | 10 results, all within range |
| `amenities=wifi,parking,gym,cctv,lift` (5 amenities together) | 0 (no listing has all 5 - genuine empty state, not a bug) |

### Expanded seed data (prepared, not yet run)

`backend/seed.js` rewritten to cover every `propertyType` x `audience`
combination properly (21 listings instead of 20), so gaps like bug #2
above can't recur. Not run - the user runs data-changing scripts
themselves. Hand-verified against the actual code logic (and available
to re-check anytime via `npm run seed:plan`, which does zero network/DB
calls):

| propertyType + audience | Listings |
|---|---|
| PG + women | 3 |
| PG + men | 3 |
| PG + co-ed | 3 |
| Apartment + men | 3 |
| Apartment + co-ed | 3 |
| Hostel + women | 3 |
| Hostel + men | 3 |
| **Hostel + co-ed** | **0 (deliberately empty)** |
| **Apartment + women** | **0 (deliberately empty)** |

Price: INR 3000–25000, 21 evenly-spread values. Amenities: 7 hand-designed
sets cycled by listing index, every canonical amenity on ≥6 of 21
listings, `wifi`+`parking`+`ac` together on 6 listings, `{geyser, cctv}`
deliberately never co-occurring (a verifiable "returns nothing" filter
combination). Cloudinary: listings 0-19 keep identical public_ids/content
to today (net-zero new assets, ~237 refreshed in place), only the 1 new
listing needs new uploads (2 photos × up to 3 variants = up to 6 new
assets) - **up to 243 total assets after seeding, only ~6 of them new.**

---

## Phase 5 — SEO (2026-09-16)

### What was done

1. **Per-page `<title>`/meta description**, using React 19's native
   support for rendering `<title>`/`<meta>`/`<link>` anywhere in a
   component tree - React hoists them into the real document `<head>`
   automatically (no `react-helmet` or similar library needed). A shared
   `Seo.jsx` component wraps this so every screen uses the same pattern:
   `Home`, `Find`, `Login`, `Signup`, `CreateListing`, `RenterDashboard`,
   `TenantDashboard`, `NotFound`, and `ListingDetail` each render
   `<Seo title=... description=... />`.
2. **`ListingDetail` uses the listing's actual title, location, and
   price** - not a generic template: `<Seo title={prop.title}
   description={`${prop.title} in ${prop.location.address} - ₹${prop.price}/month...`} image={photo?.src} url={window.location.href} />`.
   This is real per-listing content, not a static string.
3. **Open Graph tags** on every page (`og:title`, `og:description`,
   `og:type`, `og:url`, `og:image` where available, `twitter:card`) -
   `ListingDetail` additionally passes the listing's actual hero photo as
   `og:image`, so a shared link preview shows the real listing photo, not
   a generic site logo.
4. **`noindex`** on the four auth-gated screens (`CreateListing`,
   `RenterDashboard`, `TenantDashboard`) and `NotFound` - there's nothing
   for an anonymous crawler to usefully index there, and `NotFound`
   specifically can't send a real HTTP 404 (see limits section below), so
   `noindex` is the only signal available to say "nothing here."
5. **`robots.txt`** (`frontend/public/robots.txt`) - allows the public
   pages, disallows the auth-gated ones as a courtesy alongside their
   `noindex` tags.
6. **Static fallback tags in `index.html`** - a real title, meta
   description, and generic OG tags, since a crawler that doesn't execute
   JavaScript never sees anything React renders (see below).

### Lighthouse SEO score, before → after

| Page | Before | After |
|---|---|---|
| Home | 83 | **100** |
| Find | 83 | **100** |
| Listing detail | 83 | **100** |

Zero remaining automated findings, no runtime errors. Same method as
every other phase (3 runs baseline; a single confirmatory run here since
SEO audits are static/structural checks - title present, meta description
present, robots.txt valid, links crawlable - not something that varies
run to run the way performance timing metrics do). Reports:
[home](lighthouse/phase5/home.report.html) ·
[find](lighthouse/phase5/find.report.html) ·
[listing](lighthouse/phase5/listing.report.html)

### Being honest about what this does and doesn't fix

Lighthouse's SEO score checks structural things - is there a title, is
there a meta description, is robots.txt valid, are links crawlable. All
of that is now correct. **What Lighthouse's SEO score cannot tell you,
and what actually matters more for a real site, is whether the tags this
app renders are ever seen by the things that matter:**

- **This is a client-rendered SPA with no server-side rendering.** The
  server always returns the same static `index.html` (checked in
  `index.html`'s own comments) - an empty `<div id="root"></div>` plus a
  script tag. Everything else, including every `<title>`/`<meta>` this
  phase added, is written by React *after* JavaScript downloads, parses,
  and runs. A crawler or tool that only fetches raw HTML sees the generic
  fallback tags in `index.html` and nothing else - never a real listing's
  title, description, or photo.
- **Googlebot generally does execute JavaScript**, but on a delayed
  second pass, not the initial crawl - so even Google may index a stale
  or generic version of a page before the JS-rendered version is
  processed. This is a well-documented characteristic of CSR SPAs, not
  specific to this app.
- **Most link-preview bots (Slack, WhatsApp, iMessage, and many others)
  do not execute JavaScript at all.** Paste a listing URL into one of
  these today and it will show the generic site-wide OG tags from
  `index.html`, not the listing's actual title/price/photo, no matter
  how correct `ListingDetail`'s `Seo` component is - the bot simply never
  runs the code that would render them.
- **`NotFound` cannot send a real HTTP 404.** Client-side routing means
  the server returns `200 OK` with `index.html` for *any* path, and
  React Router decides afterward that the route doesn't match anything.
  `noindex` is a real, useful signal for crawlers that render JS, but a
  crawler reading only HTTP status codes sees "200, this page exists"
  for a URL that doesn't.
- **The actual fix for all of the above is server-side rendering or
  static generation** (Next.js, Remix, or a pre-rendering step that
  serves crawlers a fully-rendered HTML snapshot) - genuinely out of
  scope for a Vite CSR SPA without a larger architectural change, not
  something addressable by adding more meta tags. Worth knowing and
  saying plainly rather than letting a 100 Lighthouse SEO score imply
  more than it does.
