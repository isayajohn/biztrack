// Central place for site-wide SEO defaults. Update SITE_URL once the
// production domain is finalized — every canonical/OG/sitemap URL derives
// from it.
export const SITE_URL = "https://biztrack.app";
export const SITE_NAME = "BizTrack";
export const DEFAULT_TITLE = "BizTrack | Sales, expenses, stock, and profit tracking";
export const DEFAULT_DESCRIPTION =
  "BizTrack helps small business owners track sales, expenses, stock, and profit from one simple dashboard.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/wordmark-horizontal.png`;
export const TWITTER_HANDLE = "@biztrack";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
