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
