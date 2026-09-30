import { useEffect } from "react";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "../constants/seo";

type SeoOptions = {
  title: string;
  description: string;
  /** Path (e.g. "/") or absolute URL. Defaults to the current location. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  /** Set to false on authenticated/utility pages so they never get indexed. */
  index?: boolean;
  /** Structured data object(s) to emit as JSON-LD <script> tags. */
  structuredData?: object | object[];
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Manages <title>, meta description/robots, canonical link, Open Graph,
 * Twitter Card, and JSON-LD structured data for the current route. Every
 * tag it touches is upserted so pages can override the index.html defaults
 * and cleanly hand back control on unmount.
 */
export function useSeo({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  index = true,
  structuredData,
}: SeoOptions) {
  useEffect(() => {
    const canonicalUrl = path
      ? path.startsWith("http")
        ? path
        : `${SITE_URL}${path}`
      : `${SITE_URL}${window.location.pathname}`;

    document.title = title;

    upsertMeta("name", "description", description);
    const robots = index
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, nofollow";
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    upsertMeta("name", "bingbot", robots);
    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:locale", "en_TZ");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:image:secure_url", image);
    upsertMeta("property", "og:image:type", "image/png");
    upsertMeta("property", "og:image:width", "2880");
    upsertMeta("property", "og:image:height", "1800");
    upsertMeta("property", "og:image:alt", "BizTrack business dashboard");
    upsertMeta("property", "og:site_name", SITE_NAME);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
    upsertMeta("name", "twitter:image:alt", "BizTrack business dashboard");
    if (TWITTER_HANDLE) upsertMeta("name", "twitter:site", TWITTER_HANDLE);

    const scripts: HTMLScriptElement[] = [];
    if (structuredData) {
      const items = Array.isArray(structuredData) ? structuredData : [structuredData];
      for (const item of items) {
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.text = JSON.stringify(item);
        document.head.appendChild(script);
        scripts.push(script);
      }
    }

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [title, description, path, image, type, index, structuredData]);
}

/**
 * Lightweight guard for routes that must never be indexed (authenticated
 * app screens, admin screens, auth utility forms). Only touches the robots
 * meta tag so it never clobbers a page's own title/description.
 */
export function useNoIndex(follow = true) {
  useEffect(() => {
    const directive = `noindex, ${follow ? "follow" : "nofollow"}`;
    const previousRobots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.getAttribute("content");
    const previousGooglebot = document.head.querySelector<HTMLMetaElement>('meta[name="googlebot"]')?.getAttribute("content");
    const previousBingbot = document.head.querySelector<HTMLMetaElement>('meta[name="bingbot"]')?.getAttribute("content");
    const titles: Record<string, string> = {
      "/login": "Sign in | BizTrack",
      "/auth": "Sign in | BizTrack",
      "/register": "Create an account | BizTrack",
      "/forgot-password": "Reset your password | BizTrack",
      "/verify-account": "Verify your account | BizTrack",
      "/verify-email": "Verify your email | BizTrack",
      "/verify-phone": "Verify your phone | BizTrack",
    };
    document.title = titles[window.location.pathname] ?? "BizTrack Business Management";
    upsertMeta("name", "robots", directive);
    upsertMeta("name", "googlebot", directive);
    upsertMeta("name", "bingbot", directive);
    upsertLink("canonical", `${SITE_URL}${window.location.pathname}`);

    return () => {
      if (previousRobots) upsertMeta("name", "robots", previousRobots);
      if (previousGooglebot) upsertMeta("name", "googlebot", previousGooglebot);
      if (previousBingbot) upsertMeta("name", "bingbot", previousBingbot);
    };
  }, [follow]);
}
