import { useState } from "react";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, Loader2, TicketCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { acceptInvitation, createBusinessWorkspace, validateInvitation, type InvitationPreview } from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

type Mode = "CREATE" | "JOIN";

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(user?.onboardingIntent ?? "CREATE");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const createWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!businessName.trim()) return setError("Business name is required.");
    setLoading(true); setError("");
    try {
      await createBusinessWorkspace({ name: businessName.trim(), currency, country: "Tanzania" });
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setLoading(false); }
  };

  const checkCode = async () => {
    if (!code.trim()) return setError("Enter your invitation code.");
    setChecking(true); setError(""); setPreview(null);
    try { setPreview(await validateInvitation(code.trim())); }
    catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setChecking(false); }
  };

  const joinWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return setError("Enter your invitation code.");
    setLoading(true); setError("");
    try {
      await acceptInvitation(code.trim());
      await refreshUser();
      navigate("/dashboard", { replace: true });
    } catch (reason) { setError(getApiErrorMessage(reason)); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-sm">
        <div className="bg-[#07102b] px-6 py-7 text-white sm:px-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#12e4d7]/25 bg-[#12e4d7]/10 px-3 py-1 text-xs font-bold text-[#55e7c3]"><BadgeCheck size={14} /> Account verified</span>
          <h1 className="mt-4 font-display text-3xl font-black tracking-[-.03em]">{mode === "CREATE" ? "Set up your workspace." : "Join your workspace."}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">{mode === "CREATE" ? "Tell us about your business to create your BizTrack workspace." : "Enter the invitation code shared by your business administrator."}</p>
        </div>

        <div className="grid gap-7 p-6 sm:p-9 lg:grid-cols-[1fr_280px]">
          <div>
            {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

            {mode === "CREATE" ? (
              <form onSubmit={createWorkspace} className="space-y-5">
                <Field label="Business name">
                  <input value={businessName} onChange={(event) => { setBusinessName(event.target.value); setError(""); }} placeholder="Enter your business name" className="h-12 w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/10" />
                </Field>
                <Field label="Currency">
                  <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-12 w-full rounded-xl border border-ink/15 bg-[#f7faf9] px-4 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/10">
                    <option value="TZS">TZS — Tanzanian Shilling</option>
                  </select>
                </Field>
                <Field label="Package">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><span><span className="block text-sm font-black text-emerald-900">Free plan</span><span className="mt-0.5 block text-xs text-emerald-700">Assigned automatically</span></span><CheckCircle2 size={20} className="text-emerald-600" /></div>
                  <p className="mt-2 text-xs font-semibold text-ink/45">The Free plan will be assigned automatically. You can upgrade later.</p>
                </Field>
                <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf text-sm font-black text-white hover:bg-leaf/90 disabled:opacity-60">{loading ? <><Loader2 size={16} className="animate-spin" /> Creating workspace...</> : <>Create business workspace <ArrowRight size={16} /></>}</button>
              </form>
            ) : (
              <form onSubmit={joinWorkspace} className="space-y-5">
                <Field label="Invitation code">
                  <div className="flex gap-2"><input value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setPreview(null); setError(""); }} placeholder="Enter your invitation code" className="h-12 min-w-0 flex-1 rounded-xl border border-ink/15 bg-[#f7faf9] px-4 text-sm font-black uppercase tracking-[.08em] text-ink outline-none focus:border-leaf focus:ring-4 focus:ring-leaf/10" /><button type="button" onClick={() => void checkCode()} disabled={checking} className="rounded-xl border border-leaf/20 bg-mint px-4 text-xs font-black text-leaf disabled:opacity-60">{checking ? <Loader2 size={16} className="animate-spin" /> : "Check"}</button></div>
                </Field>
                {preview && <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><TicketCheck size={21} className="mt-0.5 shrink-0 text-emerald-600" /><div><p className="font-black text-emerald-900">Join {preview.businessName}</p><p className="mt-1 text-xs font-semibold text-emerald-700">Role: {preview.role}{preview.branch?.name ? ` · ${preview.branch.name}` : ""}</p></div></div>}
                <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf text-sm font-black text-white hover:bg-leaf/90 disabled:opacity-60">{loading ? <><Loader2 size={16} className="animate-spin" /> Joining workspace...</> : <>Join workspace <ArrowRight size={16} /></>}</button>
              </form>
            )}
          </div>

          <aside className="rounded-xl border border-ink/10 bg-[#f7faf9] p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-leaf">{mode === "CREATE" ? <BriefcaseBusiness size={20} /> : <TicketCheck size={20} />}</span>
            <h2 className="mt-4 font-display text-lg font-black text-ink">{mode === "CREATE" ? "Joining a team?" : "Starting your own business?"}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-ink/50">{mode === "CREATE" ? "Use an invitation code instead if a workspace administrator invited you." : "Create a new workspace and become its owner."}</p>
            <button type="button" onClick={() => { setMode(mode === "CREATE" ? "JOIN" : "CREATE"); setError(""); }} className="mt-4 text-sm font-black text-leaf hover:underline">{mode === "CREATE" ? "Join with a code" : "Create a business"}</button>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-black text-ink">{label}<div className="mt-2">{children}</div></label>;
}
