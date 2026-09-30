import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNoIndex } from "../hooks/useSeo";
import * as authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

export default function VerifyEmailPage() {
  useNoIndex();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const hasSubmitted = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your account...");
  const [waitingForApproval, setWaitingForApproval] = useState(false);

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
      .then(async (result) => {
        if (!alive) return;
        sessionStorage.removeItem("biztrack_registration_verification");
        setStatus("success");
        if (!result.authenticated) {
          setWaitingForApproval(true);
          setMessage(result.message);
          return;
        }
        await refreshUser();
        setMessage("Your account is verified. Taking you to BizTrack...");
        window.setTimeout(() => {
          navigate(result.user.role === "SUPER_ADMIN" ? "/admin" : result.user.businessId ? "/dashboard" : "/onboarding", { replace: true });
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07102b] px-5 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/auth-bg.jpg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[#07102b]/70" />
      <Link to="/" className="absolute left-5 top-6 z-10 sm:left-8"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="w-36" /></Link>
      <section className="relative z-10 w-full max-w-md rounded-[28px] border border-white/[0.13] bg-[#071032]/82 p-8 text-center shadow-[0_35px_100px_rgba(0,0,0,.48)] backdrop-blur-2xl">
        <div
          className={[
            "mx-auto grid h-14 w-14 place-items-center rounded-2xl border",
            status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : status === "error"
                ? "border-red-400/30 bg-red-400/10 text-red-300"
                : "border-[#12e4d7]/30 bg-[#12e4d7]/10 text-[#55e7c3]",
          ].join(" ")}
        >
          <Icon
            size={23}
            className={status === "loading" ? "animate-spin" : undefined}
            aria-hidden="true"
          />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-amber-200">Verify your account</p>
        <h1 className="mt-3 font-display text-3xl font-black">
          {status === "success" ? "Account verified" : status === "error" ? "Verification failed" : "Verifying account"}
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-white/50">{message}</p>
        {status === "success" && waitingForApproval && (
          <Link to="/login" className="mt-6 block rounded-xl bg-[#12e4d7] px-4 py-3 text-sm font-black text-[#051210] transition-colors hover:bg-white">Back to login</Link>
        )}
        {status === "error" && (
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="rounded-xl bg-[#12e4d7] px-4 py-3 text-sm font-black text-[#051210] transition-colors hover:bg-white"
            >
              Back to login
            </Link>
            <Link
              to="/register"
              className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/55 transition-colors hover:border-white/30 hover:text-white"
            >
              Create a new account
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
