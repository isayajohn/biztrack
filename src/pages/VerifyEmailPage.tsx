import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import BrandLogo from "../components/BrandLogo";
import * as authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const hasSubmitted = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account...");

  useEffect(() => {
    let alive = true;
    const token = searchParams.get("token")?.trim();

    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(async (user) => {
        if (!alive) return;
        await refreshUser();
        setStatus("success");
        setMessage("Your account is verified. Taking you to BizTrack...");
        window.setTimeout(() => {
          navigate(user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard", { replace: true });
        }, 900);
      })
      .catch((error) => {
        if (!alive) return;
        setStatus("error");
        setMessage(getApiErrorMessage(error));
      });

    return () => {
      alive = false;
    };
  }, [navigate, refreshUser, searchParams]);

  const Icon = status === "success" ? CheckCircle2 : status === "error" ? AlertCircle : Loader2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-4 py-10">
      <main className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-soft">
        <BrandLogo className="mx-auto h-auto w-56 max-w-full" />
        <div
          className={[
            "mx-auto mt-7 grid h-12 w-12 place-items-center rounded-full",
            status === "success"
              ? "bg-mint text-leaf"
              : status === "error"
                ? "bg-red-50 text-red-600"
                : "bg-[#edf7ef] text-leaf",
          ].join(" ")}
        >
          <Icon
            size={23}
            className={status === "loading" ? "animate-spin" : undefined}
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink">
          {status === "success" ? "Account verified" : status === "error" ? "Verification failed" : "Verifying account"}
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">{message}</p>
        {status === "error" && (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="rounded-xl bg-leaf px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
            >
              Back to login
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-ink/15 px-4 py-3 text-sm font-bold text-ink/60 transition-colors hover:bg-[#eef8f4]"
            >
              Create a new account
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
