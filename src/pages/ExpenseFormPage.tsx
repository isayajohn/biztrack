import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createExpense,
  getExpenseById,
  updateExpense,
} from "../services/expenseService";
import { getApiErrorMessage } from "../services/apiClient";
import type { ExpenseFormData, ExpensePaymentMethod } from "../types/expense";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_METHODS,
} from "../types/expense";
import { formatCurrency } from "../utils/format";

// ─── Validation ───────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof ExpenseFormData, string>>;

function validate(f: ExpenseFormData): FormErrors {
  const e: FormErrors = {};

  if (!f.description.trim()) {
    e.description = "Description is required.";
  } else if (f.description.trim().length < 2) {
    e.description = "Description must be at least 2 characters.";
  }

  const amount = parseFloat(f.amount);
  if (f.amount === "" || isNaN(amount)) {
    e.amount = "Valid amount is required.";
  } else if (amount <= 0) {
    e.amount = "Amount must be greater than 0.";
  }

  if (!f.expenseDate) {
    e.expenseDate = "Expense date is required.";
  }

  return e;
}

// ─── Input class helper ───────────────────────────────────────────────────────

function inputCls(hasError?: boolean) {
  return [
    "w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-ink outline-none",
    "transition-all focus:ring-2",
    hasError
      ? "border-red-400 bg-red-50/40 focus:border-red-400 focus:ring-red-200/50"
      : "border-ink/15 bg-[#fbfaf6] focus:border-leaf focus:ring-leaf/15",
  ].join(" ");
}

// ─── Default form state ───────────────────────────────────────────────────────

const todayIso = new Date().toISOString().split("T")[0];

const EMPTY_FORM: ExpenseFormData = {
  category: "Other",
  description: "",
  amount: "",
  paymentMethod: "Cash",
  expenseDate: todayIso,
  notes: "",
};

// ─── ExpenseFormPage ──────────────────────────────────────────────────────────

export default function ExpenseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [fields, setFields] = useState<ExpenseFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [submitError, setSubmitError] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Load existing expense for edit
  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    setIsLoading(true);
    getExpenseById(id)
      .then((expense) => {
        if (!alive) return;
        if (!expense) {
          setNotFound(true);
          return;
        }
        setFields({
          category: expense.category,
          description: expense.description,
          amount: String(expense.amount),
          paymentMethod: expense.paymentMethod,
          expenseDate: expense.expenseDate,
          notes: expense.notes ?? "",
        });
      })
      .catch(() => {
        if (alive) setNotFound(true);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  // Redirect if expense not found
  useEffect(() => {
    if (notFound) navigate("/expenses", { replace: true });
  }, [notFound, navigate]);

  // Generic field updater
  const setField =
    (key: keyof ExpenseFormData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const setPaymentMethod = (method: ExpensePaymentMethod) => {
    setFields((prev) => ({ ...prev, paymentMethod: method }));
  };

  // Amount preview
  const amountNum = parseFloat(fields.amount);
  const hasValidAmount = !isNaN(amountNum) && amountNum > 0;

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
      const data = {
        category: fields.category,
        description: fields.description.trim(),
        amount: parseFloat(fields.amount),
        paymentMethod: fields.paymentMethod,
        expenseDate: fields.expenseDate,
        notes: fields.notes.trim() || undefined,
      };

      if (isEdit) {
        await updateExpense(id, data);
      } else {
        await createExpense(data);
      }

      navigate("/expenses");
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="rounded-xl border border-ink/10 bg-white p-6 text-center text-sm font-semibold text-ink/45">
          Loading expense...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
      {/* Back link */}
      <Link
        to="/expenses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink/45 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to Expenses
      </Link>

      {/* Title */}
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">
        {isEdit ? "Edit Expense" : "Add Expense"}
      </h1>
      <p className="mt-1 text-sm text-ink/50">
        {isEdit
          ? "Update the expense details below."
          : "Fill in the details to record a new expense."}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {submitError}
          </div>
        )}
        {/* ── Expense details card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Expense details</h2>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Category <span className="text-clay">*</span>
            </label>
            <select
              id="category"
              value={fields.category}
              onChange={setField("category")}
              className={inputCls()}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Description <span className="text-clay">*</span>
            </label>
            <input
              id="description"
              type="text"
              placeholder="e.g. Monthly shop rent"
              value={fields.description}
              onChange={setField("description")}
              className={inputCls(!!errors.description)}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "desc-err" : undefined}
            />
            {errors.description && (
              <p
                id="desc-err"
                className="mt-1 text-xs font-medium text-red-500"
              >
                {errors.description}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="mt-4">
            <label
              htmlFor="amount"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Amount <span className="text-clay">*</span>
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={fields.amount}
              onChange={setField("amount")}
              className={inputCls(!!errors.amount)}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? "amount-err" : undefined}
            />
            {errors.amount && (
              <p
                id="amount-err"
                className="mt-1 text-xs font-medium text-red-500"
              >
                {errors.amount}
              </p>
            )}
          </div>

          {/* Amount preview */}
          {hasValidAmount && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
              <p className="text-xs font-semibold text-ink/55">
                Expense amount
              </p>
              <p className="text-base font-black text-clay">
                {formatCurrency(amountNum)}
              </p>
            </div>
          )}
        </section>

        {/* ── Payment & date card ── */}
        <section className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-ink">Payment & date</h2>

          {/* Payment method */}
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">
              Payment method <span className="text-clay">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={[
                    "rounded-xl px-3.5 py-2 text-sm font-bold transition-colors",
                    fields.paymentMethod === method
                      ? "bg-ink text-white"
                      : "border border-ink/15 text-ink/60 hover:bg-[#f4f0e8]",
                  ].join(" ")}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Expense date */}
          <div className="mt-4">
            <label
              htmlFor="expenseDate"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Expense date <span className="text-clay">*</span>
            </label>
            <input
              id="expenseDate"
              type="date"
              value={fields.expenseDate}
              onChange={setField("expenseDate")}
              max={todayIso}
              className={inputCls(!!errors.expenseDate)}
              aria-invalid={!!errors.expenseDate}
              aria-describedby={errors.expenseDate ? "date-err" : undefined}
            />
            {errors.expenseDate && (
              <p
                id="date-err"
                className="mt-1 text-xs font-medium text-red-500"
              >
                {errors.expenseDate}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Notes{" "}
              <span className="font-normal text-ink/40">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Paid in advance for 3 months…"
              value={fields.notes}
              onChange={setField("notes")}
              className="w-full resize-none rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-2.5 text-sm font-medium text-ink outline-none transition-all focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </div>
        </section>

        {/* ── Action buttons ── */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/expenses"
            className="flex items-center justify-center rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#f4f0e8]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-clay px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-clay/90 disabled:opacity-60"
          >
            {isSaving && (
              <Loader2 size={15} className="animate-spin" aria-hidden="true" />
            )}
            {isSaving
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
