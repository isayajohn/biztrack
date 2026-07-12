import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { CreditCard, FileText, Pencil, Plus, Search, Trash2, UserRound, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  recordCustomerPayment,
  updateCustomer,
} from "../services/customerApi";
import type { Customer } from "../services/customerApi";
import { formatCurrency } from "../utils/format";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: string;
};

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  creditLimit: "0",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function CustomersPage() {
  const { user } = useAuth();
  const currency = user?.currency ?? "TZS";
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [payment, setPayment] = useState({ amount: "", paymentMethod: "CASH", paymentDate: today(), reference: "" });
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getCustomers();
      setCustomers(result.customers);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [customers, search]);

  const totalCredit = customers.reduce((sum, customer) => sum + customer.creditBalance, 0);
  const creditCustomers = customers.filter((customer) => customer.creditBalance > 0).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      creditLimit: String(customer.creditLimit),
    });
    setShowForm(true);
  };

  const saveCustomer = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        creditLimit: Number(form.creditLimit || 0),
      };
      if (editing) await updateCustomer(editing.id, data);
      else await createCustomer(data);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const removeCustomer = async (customer: Customer) => {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    setError("");
    try {
      await deleteCustomer(customer.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const savePayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paymentCustomer) return;
    setIsSaving(true);
    setError("");
    try {
      await recordCustomerPayment(paymentCustomer.id, {
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod as "CASH" | "MOBILE_MONEY" | "BANK",
        paymentDate: payment.paymentDate,
        reference: payment.reference.trim() || undefined,
      });
      setPaymentCustomer(null);
      setPayment({ amount: "", paymentMethod: "CASH", paymentDate: today(), reference: "" });
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Customers</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">Manage customer details, credit limits, balances, and repayments.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white">
          <Plus size={16} /> Add customer
        </button>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <Summary label="Total customers" value={String(customers.length)} />
        <Summary label="Customers owing" value={String(creditCustomers)} />
        <Summary label="Outstanding credit" value={formatCurrency(totalCredit, currency)} alert={totalCredit > 0} />
      </section>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <section className="mt-4 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 p-4">
          <label className="flex max-w-md items-center gap-2 rounded-xl border border-ink/15 px-3 py-2">
            <Search size={16} className="text-ink/35" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, or email" className="w-full bg-transparent text-sm outline-none" />
          </label>
        </div>
        {isLoading ? (
          <p className="p-8 text-center text-sm font-semibold text-ink/45">Loading customers...</p>
        ) : visibleCustomers.length === 0 ? (
          <div className="p-10 text-center"><UserRound className="mx-auto text-ink/20" /><p className="mt-3 text-sm font-semibold text-ink/45">No customers found.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#f7faf9] text-xs uppercase tracking-wide text-ink/45"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Sales</th><th className="px-4 py-3">Credit limit</th><th className="px-4 py-3">Owing</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-ink/8">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[#f7faf9]">
                    <td className="px-4 py-3"><p className="font-bold text-ink">{customer.name}</p><p className="text-xs text-ink/40">{customer.isActive ? "Active" : "Inactive"}</p></td>
                    <td className="px-4 py-3 text-ink/65"><p>{customer.phone || "—"}</p><p className="text-xs">{customer.email || "—"}</p></td>
                    <td className="px-4 py-3 font-semibold">{customer.salesCount}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(customer.creditLimit, currency)}</td>
                    <td className={`px-4 py-3 font-extrabold ${customer.creditBalance > 0 ? "text-red-600" : "text-leaf"}`}>{formatCurrency(customer.creditBalance, currency)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1.5">
                      <Link to={`/customers/${customer.id}/statement`} className="rounded-lg border border-ink/10 p-2 text-ink/60" title="Statement"><FileText size={15} /></Link>
                      {customer.creditBalance > 0 && <button type="button" onClick={() => { setPaymentCustomer(customer); setPayment((current) => ({ ...current, amount: String(customer.creditBalance) })); }} className="rounded-lg border border-leaf/20 bg-mint p-2 text-leaf" title="Record payment"><CreditCard size={15} /></button>}
                      <button type="button" onClick={() => openEdit(customer)} className="rounded-lg border border-ink/10 p-2 text-ink/60" title="Edit"><Pencil size={15} /></button>
                      <button type="button" onClick={() => void removeCustomer(customer)} className="rounded-lg border border-red-100 p-2 text-red-500" title="Delete"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && <Modal title={editing ? "Edit customer" : "Add customer"} onClose={() => setShowForm(false)}>
        <form onSubmit={saveCustomer} className="space-y-3">
          <Field label="Name" required value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /></div>
          <Field label="Address" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
          <Field label={`Credit limit (${currency})`} type="number" min="0" value={form.creditLimit} onChange={(value) => setForm({ ...form, creditLimit: value })} />
          <button disabled={isSaving} className="w-full rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isSaving ? "Saving..." : "Save customer"}</button>
        </form>
      </Modal>}

      {paymentCustomer && <Modal title={`Payment from ${paymentCustomer.name}`} onClose={() => setPaymentCustomer(null)}>
        <form onSubmit={savePayment} className="space-y-3">
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Outstanding: {formatCurrency(paymentCustomer.creditBalance, currency)}</div>
          <Field label={`Amount (${currency})`} required type="number" min="0.01" value={payment.amount} onChange={(value) => setPayment({ ...payment, amount: value })} />
          <label className="block text-xs font-bold text-ink/55">Payment method<select value={payment.paymentMethod} onChange={(event) => setPayment({ ...payment, paymentMethod: event.target.value })} className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm"><option value="CASH">Cash</option><option value="MOBILE_MONEY">Mobile money</option><option value="BANK">Bank</option></select></label>
          <Field label="Payment date" required type="date" value={payment.paymentDate} onChange={(value) => setPayment({ ...payment, paymentDate: value })} />
          <Field label="Reference (optional)" value={payment.reference} onChange={(value) => setPayment({ ...payment, reference: value })} />
          <button disabled={isSaving} className="w-full rounded-xl bg-leaf px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isSaving ? "Recording..." : "Record payment"}</button>
        </form>
      </Modal>}
    </div>
  );
}

function Summary({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase text-ink/40">{label}</p><p className={`mt-2 text-xl font-extrabold ${alert ? "text-red-600" : "text-ink"}`}>{value}</p></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold text-ink">{title}</h2><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-ink/45 hover:bg-ink/5"><X size={18} /></button></div>{children}</div></div>;
}

function Field({ label, value, onChange, type = "text", required = false, min }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; min?: string }) {
  return <label className="block text-xs font-bold text-ink/55">{label}<input type={type} required={required} min={min} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15" /></label>;
}
