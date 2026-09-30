// Central place for site-wide SEO defaults. Update SITE_URL once the
// production domain is finalized — every canonical/OG/sitemap URL derives
// from it.
export const SITE_URL = "https://biztracktanzania.online";
export const SITE_NAME = "BizTrack";
export const DEFAULT_TITLE = "BizTrack Tanzania | POS, inventory and business management";
export const DEFAULT_DESCRIPTION =
  "Manage sales, POS, inventory, expenses, customers, debts, branches and reports with BizTrack, built in Tanzania for growing African businesses.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/landing-dashboard.png`;
export const TWITTER_HANDLE = "";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
