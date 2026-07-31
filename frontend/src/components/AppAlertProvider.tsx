import { useEffect } from "react";
import type { ReactNode } from "react";
import { notifyError, notifyWarning } from "../lib/notifications";

export default function AppAlertProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const onUnauthorized = () => {
      notifyWarning("Your session expired. Please sign in again.");
    };

    const onRateLimited = (event: Event) => {
      const seconds =
        event instanceof CustomEvent && typeof event.detail?.seconds === "number"
          ? event.detail.seconds
          : 60;
      notifyError(`Too many requests. Please wait ${seconds} seconds, then try again.`);
    };

    window.addEventListener("biztrack:unauthorized", onUnauthorized);
    window.addEventListener("biztrack:rate-limited", onRateLimited);

    return () => {
      window.removeEventListener("biztrack:unauthorized", onUnauthorized);
      window.removeEventListener("biztrack:rate-limited", onRateLimited);
    };
  }, []);

  return children;
}
