import { useEffect } from "react";
import type { ReactNode } from "react";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { useSnackbar } from "notistack";
import { X } from "lucide-react";

function SnackbarEvents() {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const onUnauthorized = () => {
      enqueueSnackbar("Your session expired. Please sign in again.", { variant: "warning" });
    };

    const onRateLimited = (event: Event) => {
      const seconds =
        event instanceof CustomEvent && typeof event.detail?.seconds === "number"
          ? event.detail.seconds
          : 60;
      enqueueSnackbar(`Too many requests. Please wait ${seconds} seconds, then try again.`, {
        variant: "error",
      });
    };

    window.addEventListener("biztrack:unauthorized", onUnauthorized);
    window.addEventListener("biztrack:rate-limited", onRateLimited);

    return () => {
      window.removeEventListener("biztrack:unauthorized", onUnauthorized);
      window.removeEventListener("biztrack:rate-limited", onRateLimited);
    };
  }, [enqueueSnackbar]);

  return null;
}

export default function AppSnackbarProvider({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider
      maxSnack={4}
      autoHideDuration={4200}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      preventDuplicate
      action={(snackbarId) => (
        <button
          type="button"
          onClick={() => closeSnackbar(snackbarId)}
          className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Dismiss notification"
        >
          <X size={15} aria-hidden="true" />
        </button>
      )}
    >
      <SnackbarEvents />
      {children}
    </SnackbarProvider>
  );
}
