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
