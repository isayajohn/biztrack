import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, MessageSquareText, RotateCw } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNoIndex } from "../hooks/useSeo";
import { resendPhoneVerification, verifyPhone } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

type LocationState = { verificationId?: string; method?: "EMAIL" | "PHONE"; target?: string; onboardingIntent?: "CREATE" | "JOIN"; sent?: boolean };

export default function VerifyPhonePage() {
  useNoIndex();
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const locationState = (location.state ?? {}) as LocationState;
  let persistedState: LocationState = {};
  try {
    persistedState = JSON.parse(sessionStorage.getItem("biztrack_registration_verification") ?? "{}") as LocationState;
  } catch {
    persistedState = {};
  }
  const state = locationState.verificationId ? locationState : persistedState;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(state.sent === false ? "Your account was created, but the code could not be sent. Use resend to try again." : "Enter the 6-digit code sent to your phone.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!state.verificationId || state.method !== "PHONE") return <Navigate to="/register" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit verification code.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const user = await verifyPhone(state.verificationId!, otp);
      await refreshUser();
      sessionStorage.removeItem("biztrack_registration_verification");
      setVerified(true);
      setNotice("Phone verified. Opening your BizTrack workspace...");
      window.setTimeout(() => navigate(user.role === "SUPER_ADMIN" ? "/admin" : user.businessId ? "/dashboard" : "/onboarding", { replace: true }), 900);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    setIsResending(true);
    setError("");
    try {
      const result = await resendPhoneVerification(state.verificationId!);
      setNotice(result.message);
      if (!result.sent) setError(result.message);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07102b] px-5 py-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/auth-bg.jpg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[#07102b]/70" />
      <Link to="/" className="absolute left-5 top-6 z-10 sm:left-8"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="w-36" /></Link>

      <section className="relative z-10 w-full max-w-md rounded-[28px] border border-white/[0.13] bg-[#071032]/80 p-7 shadow-[0_35px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-9">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl border ${verified ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-[#12e4d7]/25 bg-[#12e4d7]/10 text-[#55e7c3]"}`}>
          {verified ? <CheckCircle2 size={23} /> : <MessageSquareText size={23} />}
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-[-0.035em]">{verified ? "Phone verified." : "Verify your phone."}</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">{notice}</p>
        {state.target && <p className="mt-2 text-sm font-bold text-[#55e7c3]">{state.target}</p>}

        {!verified && (
          <form onSubmit={submit} className="mt-7">
            <label htmlFor="otp" className="text-sm font-bold text-white/75">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => { setOtp(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000"
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.075] px-4 py-4 text-center font-mono text-2xl font-bold tracking-[0.45em] text-white outline-none placeholder:text-white/15 focus:border-[#12e4d7]/60 focus:ring-4 focus:ring-[#12e4d7]/10"
            />
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-semibold text-red-200">{error}</p>}
            <button disabled={isSubmitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#12e4d7] py-4 text-sm font-black text-[#051210] hover:bg-white disabled:opacity-60">
              {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : "Verify phone number"}
            </button>
          </form>
        )}

        {!verified && <button type="button" onClick={() => void resend()} disabled={isResending} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-bold text-white/45 hover:text-white disabled:opacity-50">
          <RotateCw size={14} className={isResending ? "animate-spin" : ""} /> Resend code
        </button>}
        <Link to="/login" className="mt-7 flex items-center justify-center gap-2 text-xs font-bold text-white/35 hover:text-white"><ArrowLeft size={14} /> Back to login</Link>
      </section>
    </main>
  );
}
