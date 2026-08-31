import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck, RotateCw, Sparkles } from "lucide-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useNoIndex } from "../hooks/useSeo";
import { resendVerificationEmail } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

type VerificationState = {
  verificationId?: string;
  method?: "EMAIL" | "PHONE";
  target?: string | null;
  onboardingIntent?: "CREATE" | "JOIN";
  sent?: boolean;
};

export default function VerifyAccountPage() {
  useNoIndex();
  const location = useLocation();
  let stored: VerificationState = {};
  try { stored = JSON.parse(sessionStorage.getItem("biztrack_registration_verification") ?? "{}"); } catch { stored = {}; }
  const routed = (location.state ?? {}) as VerificationState;
  const state = routed.verificationId ? routed : stored;
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(state.sent === false ? "Your account was created, but the verification email could not be sent. Try again." : "Open the verification link we sent to complete your account.");
  const [error, setError] = useState("");

  if (!state.verificationId || state.method !== "EMAIL") return <Navigate to="/register" replace />;

  const resend = async () => {
    setLoading(true);
    setError("");
    try { setNotice(await resendVerificationEmail(state.verificationId!)); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setLoading(false); }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#07102b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/auth-bg.jpg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[#07102b]/60" />
      <header className="relative z-10 px-5 pt-7 sm:px-8"><Link to="/"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="w-40" /></Link></header>
      <section className="relative z-10 flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md rounded-[28px] border border-white/[0.13] bg-[#071032]/82 p-7 text-center shadow-[0_35px_100px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-9">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#12e4d7]/30 bg-[#12e4d7]/10 text-[#55e7c3]"><MailCheck size={26} /></span>
          <p className="mt-5 text-xs font-black uppercase tracking-[.16em] text-amber-200">Verify your account</p>
          <h1 className="mt-3 font-display text-3xl font-black">Check your email.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">{notice}</p>
          {state.target && <p className="mt-2 break-all text-sm font-bold text-[#55e7c3]">{state.target}</p>}
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-xs leading-5 text-white/45">After verification, sign in and we&apos;ll take you to {state.onboardingIntent === "JOIN" ? "the invitation screen" : "business workspace setup"}.</div>
          {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs font-semibold text-red-200">{error}</p>}
          <button type="button" onClick={() => void resend()} disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#12e4d7] text-sm font-black text-[#051210] hover:bg-white disabled:opacity-60">{loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCw size={16} />} Resend verification email</button>
          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-white/40 hover:text-white"><ArrowLeft size={14} /> Back to sign in</Link>
        </div>
      </section>
      <footer className="relative z-10 pb-6 text-center text-xs text-white/40"><span className="inline-flex items-center gap-2"><Sparkles size={13} /> Secure business management for growing teams</span></footer>
    </main>
  );
}
