// Public site identity used for metadata, the sitemap and structured data.

/**
 * Canonical public origin for SEO (canonical links, Open Graph, sitemap, robots.txt).
 * Read at build time, so it defaults to the production domain rather than whatever
 * BETTER_AUTH_URL a local build happens to use. Set SITE_URL to change the domain.
 */
export const SITE_URL = (process.env.SITE_URL || "https://dta.gm").replace(/\/$/, "");

export const SITE_NAME = "Data Technology Academy";
export const SITE_SHORT_NAME = "DTA";

export const SITE_DESCRIPTION =
  "Data Technology Academy (DTA) trains young Gambians in software development and data analytics through hands-on, three-month programs. Employers can verify DTA graduate certificates online.";

export const CONTACT_EMAIL = "admin@dta.gm";

/** Shared Open Graph fields. Next replaces (not merges) `openGraph` per page, so pages spread this in. */
export const OPEN_GRAPH_BASE = { type: "website", siteName: SITE_NAME, locale: "en_GB" } as const;
