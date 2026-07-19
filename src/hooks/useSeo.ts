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
    upsertMeta("name", "robots", index ? "index, follow" : "noindex, nofollow");
    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);
    upsertMeta("property", "og:site_name", SITE_NAME);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);
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
    const previous = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.getAttribute("content");
    upsertMeta("name", "robots", `noindex, ${follow ? "follow" : "nofollow"}`);

    return () => {
      if (previous) upsertMeta("name", "robots", previous);
    };
  }, [follow]);
}
