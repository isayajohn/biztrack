import { useEffect, useState } from "react";
import { Loader2, Pause, Play, Plus, Trash2, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  FREQUENCY_LABELS,
  deleteRecurringInvoice,
  getRecurringInvoices,
  runRecurringInvoiceNow,
  setRecurringInvoiceStatus,
} from "../services/recurringInvoiceApi";
import type { RecurringInvoice } from "../services/recurringInvoiceApi";
import { formatCurrency } from "../utils/format";

export default function RecurringInvoicesPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";

  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");

  const load = () => {
    setIsLoading(true);
    setError("");
    getRecurringInvoices()
      .then(setInvoices)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (invoice: RecurringInvoice) => {
    setBusyId(invoice.id);
    try {
      const next = invoice.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
      const updated = await setRecurringInvoiceStatus(invoice.id, next);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const runNow = async (invoice: RecurringInvoice) => {
    setBusyId(invoice.id);
    setError("");
    try {
      const result = await runRecurringInvoiceNow(invoice.id);
      setInvoices((prev) => prev.map((i) => (i.id === result.recurringInvoice.id ? result.recurringInvoice : i)));
      setNotice(`Generated receipt ${result.receiptNumber}`);
      setTimeout(() => setNotice(""), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  const remove = async (invoice: RecurringInvoice) => {
    if (!confirm(`Delete the recurring invoice for ${invoice.customerName ?? "this customer"}? This cannot be undone.`)) return;
    setBusyId(invoice.id);
    try {
      await deleteRecurringInvoice(invoice.id);
      setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl font-bold text-ink">Recurring Invoices</h1>
          <span className="rounded-full bg-[#eef8f4] px-2.5 py-0.5 text-xs font-bold text-ink/60">{invoices.length}</span>
        </div>
        <Link to="/sales/recurring/new" className="inline-flex items-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90">
          <Plus size={16} aria-hidden="true" /> New Recurring Invoice
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink/50">Invoices that generate themselves on a schedule — weekly, monthly, or quarterly — without manual re-entry.</p>

      {notice && <div className="mt-4 rounded-xl border border-leaf/30 bg-mint px-4 py-3 text-sm font-semibold text-leaf">{notice}</div>}
      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-8 text-center text-sm font-semibold text-ink/45">Loading recurring invoices…</div>
      ) : invoices.length === 0 ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-10 text-center text-sm font-semibold text-ink/45">
          No recurring invoices yet. Create one for a customer you bill on a regular schedule.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-[#f7faf9] text-xs uppercase text-ink/45">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Repeats</th>
                  <th className="px-4 py-3">Next run</th>
                  <th className="px-4 py-3 text-right">Total / cycle</th>
                  <th className="px-4 py-3 text-center">Generated</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {invoices.map((invoice) => {
                  const busy = busyId === invoice.id;
                  const taxable = invoice.subtotal - invoice.discount;
                  const total = taxable + taxable * (invoice.taxRate ?? 0) / 100;
                  return (
                    <tr key={invoice.id} className="transition-colors hover:bg-[#f7faf9]">
                      <td className="px-4 py-3">
                        <Link to={`/sales/recurring/${invoice.id}/edit`} className="font-bold text-leaf hover:underline">
                          {invoice.customerName ?? "—"}
                        </Link>
                        {invoice.paymentMethod === "CREDIT" && <span className="ml-1.5 text-xs font-semibold text-ink/40">(credit)</span>}
                      </td>
                      <td className="px-4 py-3 text-ink/60">{invoice.items.length} item{invoice.items.length === 1 ? "" : "s"}</td>
                      <td className="px-4 py-3">{FREQUENCY_LABELS[invoice.frequency]}</td>
                      <td className="px-4 py-3">{invoice.nextRunDate}</td>
                      <td className="px-4 py-3 text-right font-bold text-ink">{formatCurrency(total, currency)}</td>
                      <td className="px-4 py-3 text-center text-ink/60">{invoice.generatedCount}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${invoice.status === "ACTIVE" ? "bg-mint text-leaf" : "bg-amber-50 text-clay"}`}>
                          {invoice.status === "ACTIVE" ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => runNow(invoice)}
                            disabled={busy}
                            title="Run now"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleStatus(invoice)}
                            disabled={busy}
                            title={invoice.status === "ACTIVE" ? "Pause" : "Resume"}
                            className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-white disabled:opacity-40"
                          >
                            {invoice.status === "ACTIVE" ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(invoice)}
                            disabled={busy}
                            title="Delete"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-ink/15 text-ink/60 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
