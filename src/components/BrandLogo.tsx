import { useEffect, useState } from "react";
import { getPublicBranding } from "../services/landingApi";

const FALLBACK_LOGO = "/biztrack-logo.png";
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api").replace(/\/api\/?$/, "");

let cachedLogo: string | null | undefined;
let logoRequest: Promise<string | null> | null = null;

function loadBrandLogo() {
  if (cachedLogo !== undefined) return Promise.resolve(cachedLogo);
  if (logoRequest) return logoRequest;

  logoRequest = getPublicBranding()
    .then((branding) => {
      cachedLogo = branding.logoUrl ? `${API_ORIGIN}${branding.logoUrl}` : null;
      return cachedLogo;
    })
    .catch(() => {
      cachedLogo = null;
      return cachedLogo;
    })
    .finally(() => {
      logoRequest = null;
    });

  return logoRequest;
}

export function clearBrandLogoCache() {
  cachedLogo = undefined;
  logoRequest = null;
  window.dispatchEvent(new Event("biztrack:branding-updated"));
}

type Props = {
  className?: string;
  variant?: "light" | "dark" | "transparent";
};

export default function BrandLogo({ className = "h-auto w-44", variant = "light" }: Props) {
  const [logo, setLogo] = useState<string | null | undefined>(cachedLogo);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const load = () => {
      loadBrandLogo().then((nextLogo) => {
        if (alive) {
          setLogo(nextLogo);
          setFailedSrc(null);
        }
      });
    };

    const handleUpdated = () => {
      cachedLogo = undefined;
      load();
    };

    load();
    window.addEventListener("biztrack:branding-updated", handleUpdated);

    return () => {
      alive = false;
      window.removeEventListener("biztrack:branding-updated", handleUpdated);
    };
  }, []);

  const src = logo || FALLBACK_LOGO;

  return (
    <img
      src={failedSrc === src ? FALLBACK_LOGO : src}
      alt="BizTrack"
      className={className}
      onError={() => {
        setFailedSrc(src);
        if (src !== FALLBACK_LOGO) setLogo(null);
      }}
      style={{
        objectFit: "contain",
        filter:
          variant === "dark"
            ? "brightness(1.08) contrast(1.05) drop-shadow(0 8px 18px rgba(0,0,0,0.28))"
            : variant === "transparent"
              ? "none"
              : "drop-shadow(0 1px 0 rgba(255,255,255,0.7))",
      }}
    />
  );
}
