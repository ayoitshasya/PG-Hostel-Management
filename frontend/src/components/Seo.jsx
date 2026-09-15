import React from "react";

// React 19 hoists any <title>/<meta>/<link> rendered anywhere in the tree
// into the real document <head> automatically (no react-helmet or similar
// needed) - it also handles cleanup/replacement on unmount and re-render,
// so this "just works" as a normal component even though it renders
// document-head elements from deep inside the page.
//
// This only affects the DOM after React has hydrated and run - see
// index.html for why that matters for SEO.
export default function Seo({ title, description, image, url, type = "website", noindex = false }) {
  const fullTitle = title ? `${title} | Roomie` : "Roomie - PG, Hostel & Apartment Rentals";

  return (
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
