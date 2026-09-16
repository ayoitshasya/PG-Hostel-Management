import React from "react";

// React 19 hoists any <title>/<meta>/<link> rendered anywhere in the tree
// into the real document <head> automatically (no react-helmet or similar
// needed) - it also handles cleanup/replacement on unmount and re-render,
// so this "just works" as a normal component even though it renders
// document-head elements from deep inside the page.
//
// This only affects the DOM after React has hydrated and run - see
// index.html for why that matters for SEO.
//
// Usage: each screen renders <Seo title="..." description="..." /> once,
// near the top of its JSX - see e.g. ListingDetail.jsx or home.jsx.
export default function Seo({ title, description, image, url, type = "website", noindex = false }) {
  // Every page gets " | Roomie" appended, except when no page-specific
  // title was given, in which case we fall back to a default full title.
  const fullTitle = title ? `${title} | Roomie` : "Roomie - PG, Hostel & Apartment Rentals";

  return (
    // <>...</> is a React Fragment: a wrapper with no real DOM element of
    // its own, needed here because a component can only return one root
    // node, but we want to render several sibling <meta>/<title> tags.
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {/* Auth-gated pages (dashboards, create-listing): signal crawlers
          shouldn't index them - there's nothing for an anonymous visitor
          or search engine to usefully see there anyway. */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
    </>
  );
}
