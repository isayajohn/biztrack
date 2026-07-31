import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../services/apiClient";
import { createDebt } from "../services/debtApi";
import type { DebtType } from "../services/debtApi";
import { getCustomers } from "../services/customerApi";
import { getSuppliers } from "../services/inventoryApi";
import { formatCurrency } from "../utils/format";

type FormState = {
  type: DebtType;
  partyId: string;
  originalAmount: string;
  debtDate: string;
  dueDate: string;
  description: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const todayIso = new Date().toISOString().split("T")[0];

const EMPTY_FORM: FormState = {
  type: "CUSTOMER",
  partyId: "",
  originalAmount: "",
  debtDate: todayIso,
  dueDate: "",
  description: "",
  notes: "",
};

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#f7faf9] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.partyId) e.partyId = f.type === "CUSTOMER" ? "Select a customer." : "Select a supplier.";
  const amount = parseFloat(f.originalAmount);
  if (f.originalAmount === "" || isNaN(amount) || amount <= 0) e.originalAmount = "Enter a valid amount greater than 0.";
  if (!f.debtDate) e.debtDate = "Debt date is required.";
  if (f.dueDate && f.debtDate && f.dueDate < f.debtDate) e.dueDate = "Due date cannot be before the debt date.";
  return e;
}

export default function DebtFormPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getCustomers().then((data) => setCustomers(data.customers.map((c) => ({ id: c.id, name: c.name })))).catch(() => undefined);
    getSuppliers().then((data) => setSuppliers(data.map((s) => ({ id: s.id, name: s.name })))).catch(() => undefined);
  }, []);

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setType = (type: DebtType) => setFields((prev) => ({ ...prev, type, partyId: "" }));

  const amountNum = parseFloat(fields.originalAmount);
  const hasValidAmount = !isNaN(amountNum) && amountNum > 0;
  const parties = fields.type === "CUSTOMER" ? customers : suppliers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitError("");
    setIsSaving(true);
    try {
      const debt = await createDebt({
        type: fields.type,
        customerId: fields.type === "CUSTOMER" ? fields.partyId : undefined,
        supplierId: fields.type === "SUPPLIER" ? fields.partyId : undefined,
        originalAmount: amountNum,
        debtDate: fields.debtDate,
        dueDate: fields.dueDate || undefined,
        description: fields.description.trim() || undefined,
        notes: fields.notes.trim() || undefined,
      });
      navigate(`/debts/${debt.id}`);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      <Link to="/debts" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink">
        <ArrowLeft size={15} aria-hidden="true" /> Back to Overview
      </Link>

      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Record Debt</h1>
      <p className="mt-1 text-sm text-ink/50">Manually record a standalone customer or supplier debt.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{submitError}</div>
        )}

        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Debt type</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("CUSTOMER")} className={["flex-1 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors", fields.type === "CUSTOMER" ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]"].join(" ")}>
              Customer debt (receivable)
            </button>
            <button type="button" onClick={() => setType("SUPPLIER")} className={["flex-1 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors", fields.type === "SUPPLIER" ? "bg-ink text-white" : "border border-ink/15 text-ink/60 hover:bg-[#eef8f4]"].join(" ")}>
              Supplier debt (payable)
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor="party" className="mb-1.5 block text-sm font-semibold text-ink">
              {fields.type === "CUSTOMER" ? "Customer" : "Supplier"} <span className="text-clay">*</span>
            </label>
            <select id="party" value={fields.partyId} onChange={setField("partyId")} className={inputCls(!!errors.partyId)}>
              <option value="">Select {fields.type === "CUSTOMER" ? "a customer" : "a supplier"}…</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.partyId && <p className="mt-1 text-xs font-medium text-red-500">{errors.partyId}</p>}
          </div>

          <div className="mt-4">
            <label htmlFor="originalAmount" className="mb-1.5 block text-sm font-semibold text-ink">
              Amount owed <span className="text-clay">*</span>
            </label>
            <input id="originalAmount" type="number" min="0" step="0.01" placeholder="0.00" value={fields.originalAmount} onChange={setField("originalAmount")} className={inputCls(!!errors.originalAmount)} />
            {errors.originalAmount && <p className="mt-1 text-xs font-medium text-red-500">{errors.originalAmount}</p>}
          </div>

          {hasValidAmount && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-mint px-4 py-3">
              <p className="text-xs font-semibold text-ink/55">Debt amount</p>
              <p className="text-base font-black text-leaf">{formatCurrency(amountNum)}</p>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Dates &amp; notes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="debtDate" className="mb-1.5 block text-sm font-semibold text-ink">
                Debt date <span className="text-clay">*</span>
              </label>
              <input id="debtDate" type="date" value={fields.debtDate} onChange={setField("debtDate")} max={todayIso} className={inputCls(!!errors.debtDate)} />
              {errors.debtDate && <p className="mt-1 text-xs font-medium text-red-500">{errors.debtDate}</p>}
            </div>
            <div>
              <label htmlFor="dueDate" className="mb-1.5 block text-sm font-semibold text-ink">
                Due date <span className="font-normal text-ink/40">(optional)</span>
              </label>
              <input id="dueDate" type="date" value={fields.dueDate} onChange={setField("dueDate")} className={inputCls(!!errors.dueDate)} />
              {errors.dueDate && <p className="mt-1 text-xs font-medium text-red-500">{errors.dueDate}</p>}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-ink">
              Description <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <input id="description" type="text" placeholder="e.g. Unpaid balance for delivered goods" value={fields.description} onChange={setField("description")} className={inputCls()} />
          </div>

          <div className="mt-4">
            <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-ink">
              Notes <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <textarea id="notes" rows={3} placeholder="Internal notes about this debt…" value={fields.notes} onChange={setField("notes")} className="w-full resize-none rounded-xl border border-ink/15 bg-[#f7faf9] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15" />
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link to="/debts" className="flex items-center justify-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#eef8f4]">
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 rounded-xl bg-leaf px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:opacity-60">
            {isSaving && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {isSaving ? "Saving…" : "Record debt"}
          </button>
        </div>
      </form>
    </div>
  );
}
