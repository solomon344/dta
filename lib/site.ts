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

export const CONTACT_EMAIL = "info@dta.gm";

/** Shared Open Graph fields. Next replaces (not merges) `openGraph` per page, so pages spread this in. */
export const OPEN_GRAPH_BASE = { type: "website", siteName: SITE_NAME, locale: "en_GB" } as const;

/**
 * Invite link to the DTA WhatsApp community, from the WHATSAPP_COMMUNITY_URL env var
 * (read at request time, so it can change without a rebuild). Null hides the buttons.
 */
export function whatsappCommunityUrl(): string | null {
  const url = process.env.WHATSAPP_COMMUNITY_URL?.trim();
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    const ok = protocol === "https:" && ["chat.whatsapp.com", "whatsapp.com", "www.whatsapp.com", "wa.me"].includes(hostname);
    return ok ? url : null;
  } catch {
    return null;
  }
}
