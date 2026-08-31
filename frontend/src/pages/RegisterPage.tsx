import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Eye, EyeOff, FileText, Loader2, Mail, MessageSquareText, ShieldCheck, TicketCheck, UserRound, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth, type RegisterData } from "../auth/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import { useNoIndex } from "../hooks/useSeo";
import { getApiErrorMessage } from "../services/apiClient";
import { getLegalDocuments, type LegalDocument, type LegalDocuments } from "../services/legalApi";

type RegistrationMode = "CREATE" | "JOIN";
type VerificationMethod = "EMAIL" | "PHONE";
type Fields = { name: string; email: string; phone: string; password: string };
type Errors = Partial<Record<keyof Fields | "terms" | "general", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inputClass(hasError?: boolean) {
  return `h-12 w-full rounded-xl border bg-white/[0.075] px-4 text-sm font-semibold text-white outline-none transition-all placeholder:text-white/30 focus:ring-4 ${hasError ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/10" : "border-white/15 focus:border-[#12e4d7]/60 focus:ring-[#12e4d7]/10"}`;
}

function validate(fields: Fields, method: VerificationMethod, accepted: boolean): Errors {
  const errors: Errors = {};
  if (fields.name.trim().length < 2) errors.name = "Enter your full name.";
  if (method === "EMAIL") {
    if (!fields.email.trim()) errors.email = "Email address is required.";
    else if (!EMAIL_RE.test(fields.email)) errors.email = "Enter a valid email address.";
  } else if (!/^\+?[0-9\s().-]{8,20}$/.test(fields.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (fields.password.length < 8) errors.password = "Use at least 8 characters.";
  if (!accepted) errors.terms = "Accept the Terms and Privacy Policy to continue.";
  return errors;
}

export default function RegisterPage() {
  useNoIndex();
  const { register, isAuthenticated, isLoading: checkingAuth, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<RegistrationMode>("CREATE");
  const [method, setMethod] = useState<VerificationMethod>("EMAIL");
  const [fields, setFields] = useState<Fields>({ name: "", email: "", phone: "", password: "" });
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocuments | null>(null);
  const [legalLoading, setLegalLoading] = useState(true);
  const [legalError, setLegalError] = useState("");
  const [openDocument, setOpenDocument] = useState<LegalDocument | null>(null);

  useEffect(() => {
    let active = true;
    getLegalDocuments()
      .then((documents) => { if (active) setLegalDocuments(documents); })
      .catch((reason) => { if (active) setLegalError(getApiErrorMessage(reason)); })
      .finally(() => { if (active) setLegalLoading(false); });
    return () => { active = false; };
  }, []);

  const set = (key: keyof Fields) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFields((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined, general: undefined }));
  };

  const submit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(fields, method, accepted);
    if (!legalDocuments) nextErrors.general = "Terms and Privacy Policy are unavailable. Refresh the page and try again.";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    setErrors({});
    setLoading(true);
    try {
      const payload: RegisterData = {
        name: fields.name.trim(),
        password: fields.password,
        verificationMethod: method,
        onboardingIntent: mode,
        termsAccepted: true,
        termsVersion: legalDocuments!.terms.version,
        privacyVersion: legalDocuments!.privacy.version,
        ...(method === "EMAIL" ? { email: fields.email.trim().toLowerCase() } : { phone: fields.phone.trim() }),
      };
      const result = await register(payload);
      const verificationState = {
        verificationId: result.verificationId,
        method: result.verificationMethod,
        target: result.verificationMethod === "EMAIL" ? result.emailAddressMasked : result.phoneNumberMasked,
        onboardingIntent: result.onboardingIntent,
        sent: result.verificationMethod === "EMAIL" ? result.verificationEmailSent : result.verificationOtpSent,
      };
      sessionStorage.setItem("biztrack_registration_verification", JSON.stringify(verificationState));
      navigate(result.verificationMethod === "PHONE" ? "/verify-phone" : "/verify-account", { replace: true, state: verificationState });
    } catch (error) {
      setErrors({ general: getApiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [accepted, fields, method, mode, navigate, register]);

  if (checkingAuth) return <AuthLoadingScreen />;
  if (isAuthenticated) return <Navigate to={user?.businessId ? "/dashboard" : "/onboarding"} replace />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07102b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[url('/auth-bg.jpg')] bg-cover bg-center" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(3,8,26,.97),rgba(5,14,42,.80),rgba(3,8,26,.96))]" />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" aria-label="BizTrack home"><img src="/biztrack-wordmark-cyan.png" alt="BizTrack" className="w-36 sm:w-40" /></Link>
        <p className="hidden text-sm text-white/50 sm:block">Already have an account? <Link to="/login" className="font-bold text-[#12e4d7] hover:text-white">Sign in</Link></p>
      </header>

      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-28">
        <div className="w-full max-w-xl rounded-[28px] border border-white/[0.13] bg-[#071032]/82 p-6 shadow-[0_35px_100px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-9">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
          <span className="mt-7 inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-amber-100">Start for free</span>
          <h1 className="mt-4 font-display text-3xl font-black tracking-[-.035em] sm:text-4xl">Create your account.</h1>
          <p className="mt-2 text-sm leading-6 text-white/50">Create your account to get started. Your workspace comes after verification.</p>

          <div className="mt-7">
            <p className="mb-3 text-sm font-bold text-white/80">What would you like to do?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard active={mode === "CREATE"} icon={BriefcaseBusiness} title="Create a business" text="Set up your business after signing in." onClick={() => setMode("CREATE")} />
              <ModeCard active={mode === "JOIN"} icon={TicketCheck} title="Join with invitation code" text="Join an existing workspace after verification." onClick={() => setMode("JOIN")} />
            </div>
          </div>

          {errors.general && <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">{errors.general}</div>}

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <Field label="Full name" error={errors.name}>
              <div className="relative"><UserRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" /><input value={fields.name} onChange={set("name")} autoComplete="name" placeholder="Enter your full name" className={`${inputClass(Boolean(errors.name))} pl-11`} /></div>
            </Field>

            <div>
              <p className="mb-3 text-sm font-bold text-white/80">Register using</p>
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
                <button type="button" onClick={() => { setMethod("EMAIL"); setErrors((current) => ({ ...current, phone: undefined })); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold ${method === "EMAIL" ? "bg-[#12e4d7] text-[#051210]" : "text-white/50"}`}><Mail size={15} /> Email address</button>
                <button type="button" onClick={() => { setMethod("PHONE"); setErrors((current) => ({ ...current, email: undefined })); }} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold ${method === "PHONE" ? "bg-[#12e4d7] text-[#051210]" : "text-white/50"}`}><MessageSquareText size={15} /> Phone number</button>
              </div>
            </div>

            {method === "EMAIL" ? (
              <Field label="Email address" error={errors.email} helper="We will send you an account verification link.">
                <input type="email" value={fields.email} onChange={set("email")} autoComplete="email" placeholder="Enter your email address" className={inputClass(Boolean(errors.email))} />
              </Field>
            ) : (
              <Field label="Phone number" error={errors.phone} helper="We will send you a 6-digit verification code.">
                <input type="tel" inputMode="tel" value={fields.phone} onChange={set("phone")} autoComplete="tel" placeholder="07XXXXXXXX" className={inputClass(Boolean(errors.phone))} />
              </Field>
            )}

            <Field label="Password" error={errors.password} helper="Use at least 8 characters.">
              <div className="relative"><input type={showPassword ? "text" : "password"} value={fields.password} onChange={set("password")} autoComplete="new-password" placeholder="Create a password" className={`${inputClass(Boolean(errors.password))} pr-12`} /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            </Field>

            <div>
              <div className="flex items-start gap-3 text-sm leading-6 text-white/55">
                <input id="legal-consent" type="checkbox" checked={accepted} disabled={!legalDocuments || legalLoading} onChange={(event) => { setAccepted(event.target.checked); setErrors((current) => ({ ...current, terms: undefined })); }} className="mt-1 h-4 w-4 accent-[#12e4d7] disabled:opacity-40" />
                <p>I agree to the <button type="button" onClick={() => legalDocuments && setOpenDocument(legalDocuments.terms)} className="font-bold text-[#12e4d7] hover:underline disabled:opacity-50" disabled={!legalDocuments}>Terms and Conditions</button> and <button type="button" onClick={() => legalDocuments && setOpenDocument(legalDocuments.privacy)} className="font-bold text-[#12e4d7] hover:underline disabled:opacity-50" disabled={!legalDocuments}>Privacy Policy</button>.</p>
              </div>
              {legalLoading && <p className="mt-2 text-xs font-semibold text-white/35">Loading Terms and Privacy Policy...</p>}
              {legalError && <p className="mt-2 text-xs font-semibold text-red-300">Unable to load legal documents: {legalError}</p>}
              {errors.terms && <p className="mt-1.5 text-xs font-semibold text-red-300">{errors.terms}</p>}
            </div>

            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#12e4d7] text-sm font-black text-[#051210] shadow-[0_14px_38px_-12px_rgba(18,228,215,.7)] hover:bg-white disabled:opacity-60">{loading ? <><Loader2 size={17} className="animate-spin" /> Creating account...</> : <>Create account <ArrowRight size={17} /></>}</button>
          </form>

          <p className="mt-7 text-center text-sm text-white/50">Already have an account? <Link to="/login" className="font-bold text-[#12e4d7] hover:underline">Sign in</Link></p>
          <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/35 hover:text-white"><ArrowLeft size={14} /> Back to home</Link>
        </div>
      </section>
      {openDocument && <LegalDocumentDialog document={openDocument} onClose={() => setOpenDocument(null)} />}
    </main>
  );
}

function ModeCard({ active, icon: Icon, title, text, onClick }: { active: boolean; icon: typeof BriefcaseBusiness; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex gap-3 rounded-xl border p-4 text-left transition ${active ? "border-[#12e4d7]/55 bg-[#12e4d7]/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-[#12e4d7] text-[#051210]" : "bg-white/5 text-white/45"}`}><Icon size={18} /></span><span><span className="block text-sm font-bold text-white">{title}</span><span className="mt-1 block text-xs leading-5 text-white/40">{text}</span></span></button>;
}

function Field({ label, error, helper, children }: { label: string; error?: string; helper?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-white/80">{label}<div className="mt-2">{children}</div>{helper && !error && <span className="mt-1.5 block text-xs font-medium text-white/35">{helper}</span>}{error && <span className="mt-1.5 block text-xs font-semibold text-red-300">{error}</span>}</label>;
}

function LegalDocumentDialog({ document: legalDocument, onClose }: { document: LegalDocument; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body?.style.overflow;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyboard);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const Icon = legalDocument.type === "TERMS" ? FileText : ShieldCheck;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="legal-dialog-title" aria-describedby="legal-dialog-summary" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-white/15 bg-[#09122f] text-white shadow-[0_40px_120px_rgba(0,0,0,.65)]">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-8">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#12e4d7]/25 bg-[#12e4d7]/10 text-[#55e7c3]"><Icon size={21} /></span>
            <div><h2 id="legal-dialog-title" className="font-display text-2xl font-black">{legalDocument.title}</h2><p className="mt-1 text-xs font-semibold text-white/40">Version {legalDocument.version} · Effective {legalDocument.effectiveDate}</p></div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close dialog" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </header>
        <div className="overflow-y-auto px-6 py-6 sm:px-8">
          <p id="legal-dialog-summary" className="rounded-xl border border-[#12e4d7]/15 bg-[#12e4d7]/[0.06] p-4 text-sm font-semibold leading-6 text-white/65">{legalDocument.summary}</p>
          <div className="mt-6 space-y-6">
            {legalDocument.sections.map((section) => <article key={section.heading}><h3 className="text-base font-black text-white">{section.heading}</h3><p className="mt-2 text-sm leading-7 text-white/55">{section.body}</p></article>)}
          </div>
        </div>
        <footer className="border-t border-white/10 px-6 py-4 sm:px-8"><button type="button" onClick={onClose} className="flex h-11 w-full items-center justify-center rounded-xl bg-[#12e4d7] text-sm font-black text-[#051210] hover:bg-white">I have read this document</button></footer>
      </section>
    </div>
  );
}
