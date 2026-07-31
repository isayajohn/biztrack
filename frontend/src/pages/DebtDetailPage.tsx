import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  FileText,
  History,
  Loader2,
  Paperclip,
  Receipt,
  Upload,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  DEBT_STATUS_LABELS,
  cancelDebt,
  debtAttachmentUrl,
  disputeDebt,
  getDebt,
  getDebtActivity,
  recordDebtPayment,
  reverseDebtPayment,
  scheduleDebtReminder,
  sendDebtReminderNow,
  uploadDebtAttachment,
  writeOffDebt,
} from "../services/debtApi";
import type { DebtActivity, DebtDetail, DebtPaymentMethod, ReminderChannel } from "../services/debtApi";
import { formatCurrency } from "../utils/format";

const PAYMENT_METHODS: DebtPaymentMethod[] = ["CASH", "MOBILE_MONEY", "BANK", "OTHER"];
const REMINDER_CHANNELS: ReminderChannel[] = ["SMS", "WHATSAPP", "EMAIL", "IN_APP"];

function Summary({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <p className="text-xs font-bold uppercase text-ink/40">{label}</p>
      <p className={`mt-2 text-xl font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function ReasonAction({ label, tone, onConfirm }: { label: string; tone: string; onConfirm: (reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${tone}`}>
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-[#f7faf9] p-2">
      <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason…" className="w-40 rounded-lg border border-ink/15 px-2 py-1.5 text-xs" />
      <button
        disabled={busy || !reason.trim()}
        onClick={async () => {
          setBusy(true);
          await onConfirm(reason.trim());
          setBusy(false);
          setOpen(false);
        }}
        className="rounded-lg bg-ink px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        Confirm
      </button>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-ink/15 px-2 py-1.5 text-xs font-bold text-ink/50">Cancel</button>
    </div>
  );
}

export default function DebtDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const permissions = user?.permissions ?? [];
  const can = (p: string) => permissions.includes("*") || permissions.includes(p);

  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [activity, setActivity] = useState<DebtActivity[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMethod, setPayMethod] = useState<DebtPaymentMethod>("CASH");
  const [payReference, setPayReference] = useState("");
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");

  const [reminderBusy, setReminderBusy] = useState<ReminderChannel | null>(null);
  const [actionError, setActionError] = useState("");

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [d, a] = await Promise.all([getDebt(id), getDebtActivity(id)]);
      setDebt(d);
      setActivity(a);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) return <div className="mx-auto max-w-5xl px-4 py-10 text-center text-sm font-semibold text-ink/45">Loading debt…</div>;
  if (error) return <div className="mx-auto max-w-5xl px-4 py-6"><div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div></div>;
  if (!debt) return null;

  const party = debt.type === "CUSTOMER" ? debt.customer : debt.supplier;
  const isClosed = ["PAID", "CANCELLED", "WRITTEN_OFF"].includes(debt.status);

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayError("Enter a valid payment amount.");
      return;
    }
    setPayBusy(true);
    setPayError("");
    try {
      await recordDebtPayment(debt.id, {
        amount,
        paymentDate: payDate,
        paymentMethod: payMethod,
        transactionReference: payReference.trim() || undefined,
        attachment: payFile ?? undefined,
      });
      setPayAmount("");
      setPayReference("");
      setPayFile(null);
      await load();
    } catch (err) {
      setPayError(getApiErrorMessage(err));
    } finally {
      setPayBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      <Link to={debt.type === "CUSTOMER" ? "/debts/customers" : "/debts/suppliers"} className="inline-flex items-center gap-2 text-sm font-bold text-ink/50">
        <ArrowLeft size={15} /> {debt.type === "CUSTOMER" ? "Customer" : "Supplier"} Debts
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <p className="text-xs font-bold uppercase text-leaf">{debt.type === "CUSTOMER" ? "Customer debt" : "Supplier debt"}</p>
          <h1 className="mt-1 text-2xl font-black text-ink">{debt.debtNumber}</h1>
          <p className="mt-1 text-sm text-ink/50">{party?.name ?? "No party"} {party?.phone ? `· ${party.phone}` : ""}</p>
        </div>
        <span className="rounded-full bg-[#eef8f4] px-3 py-1 text-sm font-bold text-ink/60">{DEBT_STATUS_LABELS[debt.status]}</span>
      </header>

      {actionError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{actionError}</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Original amount" value={formatCurrency(debt.originalAmount, currency)} />
        <Summary label="Total paid" value={formatCurrency(debt.totalPaid, currency)} tone="text-leaf" />
        <Summary label="Outstanding balance" value={formatCurrency(debt.outstandingBalance, currency)} tone={debt.outstandingBalance > 0 ? "text-red-600" : "text-ink"} />
      </div>

      <div className="mt-3 flex flex-wrap gap-4 rounded-xl border border-ink/10 bg-white p-4 text-sm">
        <span><span className="font-bold text-ink/50">Debt date:</span> {debt.debtDate}</span>
        <span><span className="font-bold text-ink/50">Due date:</span> {debt.dueDate ?? "—"}</span>
        {debt.sale && <Link to={`/sales/${debt.sale.id}/receipt`} className="font-bold text-leaf hover:underline">View related sale ({debt.sale.receiptNumber})</Link>}
        {debt.purchaseOrder && <span className="font-bold text-ink/70">Related purchase: {debt.purchaseOrder.orderNumber}</span>}
      </div>

      {(debt.description || debt.notes) && (
        <div className="mt-3 rounded-xl border border-ink/10 bg-white p-4 text-sm">
          {debt.description && <p><span className="font-bold text-ink/50">Description:</span> {debt.description}</p>}
          {debt.notes && <p className="mt-1 whitespace-pre-line text-ink/70"><span className="font-bold text-ink/50">Notes:</span> {debt.notes}</p>}
        </div>
      )}

      {/* Status actions */}
      {!isClosed && (can("debts.edit") || can("debts.write_off")) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {can("debts.edit") && debt.status !== "DISPUTED" && (
            <ReasonAction label="Dispute" tone="border-purple-200 text-purple-700 hover:bg-purple-50" onConfirm={async (reason) => {
              try { await disputeDebt(debt.id, reason); await load(); } catch (err) { setActionError(getApiErrorMessage(err)); }
            }} />
          )}
          {can("debts.edit") && (
            <ReasonAction label="Cancel debt" tone="border-ink/15 text-ink/60 hover:bg-[#eef8f4]" onConfirm={async (reason) => {
              try { await cancelDebt(debt.id, reason); await load(); } catch (err) { setActionError(getApiErrorMessage(err)); }
            }} />
          )}
          {can("debts.write_off") && (
            <ReasonAction label="Write off" tone="border-red-200 text-red-600 hover:bg-red-50" onConfirm={async (reason) => {
              try { await writeOffDebt(debt.id, reason); await load(); } catch (err) { setActionError(getApiErrorMessage(err)); }
            }} />
          )}
        </div>
      )}

      {/* Record payment */}
      {can("debts.record_payment") && !isClosed && (
        <section className="mt-5 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-ink"><Receipt size={15} /> Record a payment</h2>
          <form onSubmit={submitPayment} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input type="number" min="0" step="0.01" placeholder="Amount" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" />
            <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" />
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as DebtPaymentMethod)} className="rounded-xl border border-ink/15 px-3 py-2 text-sm">
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.split("_").join(" ")}</option>)}
            </select>
            <input type="text" placeholder="Reference (optional)" value={payReference} onChange={(e) => setPayReference(e.target.value)} className="rounded-xl border border-ink/15 px-3 py-2 text-sm" />
            <label className="flex items-center gap-2 rounded-xl border border-dashed border-ink/20 px-3 py-2 text-xs font-semibold text-ink/50 sm:col-span-2">
              <Upload size={14} /> {payFile ? payFile.name : "Attach proof (optional)"}
              <input type="file" className="hidden" onChange={(e) => setPayFile(e.target.files?.[0] ?? null)} />
            </label>
            <button type="submit" disabled={payBusy} className="flex items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-2 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2 lg:col-span-1">
              {payBusy && <Loader2 size={14} className="animate-spin" />} Record payment
            </button>
          </form>
          {payError && <p className="mt-2 text-xs font-semibold text-red-600">{payError}</p>}
        </section>
      )}

      {/* Payment history */}
      <section className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-white">
        <h2 className="border-b border-ink/10 px-4 py-3 text-sm font-bold">Payment history</h2>
        {debt.payments.length === 0 ? (
          <p className="p-7 text-center text-sm font-semibold text-ink/45">No payments recorded.</p>
        ) : (
          <div className="divide-y divide-ink/8">
            {debt.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{p.paymentDate} · {p.paymentMethod.split("_").join(" ")}{p.isReversed && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">REVERSED</span>}</p>
                  <p className="text-xs text-ink/45">{p.transactionReference || "No reference"}{p.isReversed && p.reversalReason ? ` · ${p.reversalReason}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`font-extrabold ${p.isReversed ? "text-ink/30 line-through" : "text-leaf"}`}>{formatCurrency(p.amount, currency)}</p>
                  {!p.isReversed && can("debts.reverse_payment") && (
                    <ReasonAction label="Reverse" tone="border-ink/15 text-ink/50 hover:bg-[#eef8f4]" onConfirm={async (reason) => {
                      try { await reverseDebtPayment(p.id, reason); await load(); } catch (err) { setActionError(getApiErrorMessage(err)); }
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reminders */}
      <section className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Bell size={15} /> Reminders</h2>
          {can("debts.send_reminders") && !isClosed && (
            <div className="flex gap-1.5">
              {REMINDER_CHANNELS.map((channel) => (
                <button
                  key={channel}
                  disabled={reminderBusy === channel}
                  onClick={async () => {
                    setReminderBusy(channel);
                    try {
                      const created = await scheduleDebtReminder(debt.id, { channel });
                      await sendDebtReminderNow(debt.id, created.id);
                      await load();
                    } catch (err) {
                      setActionError(getApiErrorMessage(err));
                    } finally {
                      setReminderBusy(null);
                    }
                  }}
                  className="rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-bold text-ink/60 transition-colors hover:bg-[#eef8f4] disabled:opacity-40"
                >
                  {channel}
                </button>
              ))}
            </div>
          )}
        </div>
        {debt.reminders.length === 0 ? (
          <p className="p-7 text-center text-sm font-semibold text-ink/45">No reminders scheduled or sent yet.</p>
        ) : (
          <div className="divide-y divide-ink/8">
            {debt.reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-bold">{r.channel} · {r.triggerType.split("_").join(" ")}</p>
                  <p className="text-xs text-ink/45">{r.failureReason ?? (r.sentAt ? `Sent ${r.sentAt}` : `Scheduled for ${r.scheduledFor}`)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${r.status === "SENT" ? "bg-mint text-leaf" : r.status === "FAILED" ? "bg-red-50 text-red-600" : r.status === "CANCELLED" ? "bg-ink/10 text-ink/40" : "bg-amber-50 text-amber-700"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Attachments */}
      <section className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-bold"><Paperclip size={15} /> Attachments</h2>
          {can("debts.edit") && (
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-ink/15 px-2.5 py-1 text-xs font-bold text-ink/60 hover:bg-[#eef8f4]">
              <Upload size={12} /> Upload
              <input type="file" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try { await uploadDebtAttachment(debt.id, file); await load(); } catch (err) { setActionError(getApiErrorMessage(err)); }
              }} />
            </label>
          )}
        </div>
        {debt.attachments.length === 0 ? (
          <p className="p-7 text-center text-sm font-semibold text-ink/45">No attachments uploaded.</p>
        ) : (
          <div className="divide-y divide-ink/8">
            {debt.attachments.map((a) => (
              <a key={a.id} href={debtAttachmentUrl(debt.id, a.id)} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink/70 hover:bg-[#f7faf9]">
                <FileText size={14} className="text-ink/40" /> {a.fileName}
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Activity timeline */}
      <section className="mt-5 overflow-hidden rounded-xl border border-ink/10 bg-white">
        <h2 className="flex items-center gap-2 border-b border-ink/10 px-4 py-3 text-sm font-bold"><History size={15} /> Activity timeline</h2>
        {activity.length === 0 ? (
          <p className="p-7 text-center text-sm font-semibold text-ink/45">No activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-ink/8">
            {activity.map((a) => (
              <div key={a.id} className="px-4 py-2.5 text-sm">
                <span className="font-bold text-ink">{a.action.split("_").join(" ")}</span>
                <span className="text-ink/45"> · {a.actor ?? "System"} · {new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
