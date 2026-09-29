// Central place for site-wide SEO defaults. Update SITE_URL once the
// production domain is finalized — every canonical/OG/sitemap URL derives
// from it.
export const SITE_URL = "https://biztracktanzania.online";
export const SITE_NAME = "BizTrack";
export const DEFAULT_TITLE = "BizTrack | Business management for growing African businesses";
export const DEFAULT_DESCRIPTION =
  "BizTrack brings sales, inventory, finance, customers, debts, reports, and AI insights together in one real-time platform.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/landing-hero-devices.png`;
export const TWITTER_HANDLE = "@biztrack";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
