import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  Store,
  UserRound,
  WalletCards,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { getAdminBusiness } from "../../services/adminApi";
import type { AdminBusinessDetails } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function SectionHeader({
  title,
  icon: Icon,
}: {
  title: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-ink/40" aria-hidden="true" />
      <h2 className="text-sm font-bold text-ink">{title}</h2>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-3.5 shadow-sm">
      <span className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${tone}`} aria-hidden="true">
        <Icon size={17} />
      </span>
      <p className="text-xs font-semibold text-ink/50">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink/45">{helper}</p>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="animate-pulse">
        <div className="h-8 w-32 rounded-full bg-ink/8" />
        <div className="mt-5 h-28 rounded-xl bg-ink/8" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-ink/8" />
          ))}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="h-72 rounded-xl bg-ink/8" />
          <div className="h-72 rounded-xl bg-ink/8" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: LucideIcon }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 bg-[#fbfaf6] px-4 py-8 text-center">
      <Icon size={24} className="text-ink/25" aria-hidden="true" />
      <p className="max-w-xs text-sm font-semibold leading-6 text-ink/45">{message}</p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-[#fbfaf6] p-3">
      <p className="text-xs font-bold uppercase text-ink/40">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
    </div>
  );
}

export default function AdminBusinessDetailPage() {
  const { id } = useParams();
  const [business, setBusiness] = useState<AdminBusinessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    if (!id) {
      setError("Business id is missing.");
      setIsLoading(false);
      return () => {
        alive = false;
      };
    }

    setIsLoading(true);
    setError("");
    getAdminBusiness(id)
      .then((nextBusiness) => {
        if (alive) setBusiness(nextBusiness);
      })
      .catch((err) => {
        if (alive) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  if (isLoading) return <DetailSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <Link
          to="/admin/businesses"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Businesses
        </Link>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <EmptyState message="Business details are not available." icon={Building2} />
      </div>
    );
  }

  const netAmount = business.totalSalesAmount - business.totalExpensesAmount;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/admin/businesses"
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8]"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Businesses
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-leaf">
            Read-only business details
          </p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">{business.name}</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            SUPER_ADMIN system view. Sales and expenses are not editable from this page.
          </p>
        </div>
        <Link
          to={`/admin/businesses/${business.id}/subscription`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <CreditCard size={17} aria-hidden="true" />
          Manage subscription
        </Link>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Business profile" icon={Store} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ProfileItem label="Business name" value={business.name} />
            <ProfileItem label="Country" value={business.country} />
            <ProfileItem label="Currency" value={business.currency} />
            <ProfileItem label="Created date" value={formatDate(business.createdAt)} />
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Owner information" icon={UserRound} />
          <div className="mt-4 grid gap-3">
            <ProfileItem label="Owner name" value={business.user.name} />
            <ProfileItem label="Owner email" value={business.user.email} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileItem label="Role" value={business.user.role} />
              <ProfileItem label="Status" value={business.user.status} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Product count"
          value={String(business._count.products)}
          helper="Products currently tracked"
          icon={Building2}
          tone="bg-sky-50 text-sky-700"
        />
        <MetricCard
          label="Sales summary"
          value={formatCurrency(business.totalSalesAmount, business.currency)}
          helper={`${business._count.sales} sales recorded`}
          icon={CircleDollarSign}
          tone="bg-mint text-leaf"
        />
        <MetricCard
          label="Expense summary"
          value={formatCurrency(business.totalExpensesAmount, business.currency)}
          helper={`${business._count.expenses} expenses recorded`}
          icon={WalletCards}
          tone="bg-orange-50 text-clay"
        />
        <MetricCard
          label="Net after expenses"
          value={formatCurrency(netAmount, business.currency)}
          helper="Sales minus expenses"
          icon={netAmount >= 0 ? CheckCircle2 : AlertCircle}
          tone={netAmount >= 0 ? "bg-amber-50 text-amber-700" : "bg-orange-50 text-clay"}
        />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Recent sales" icon={CircleDollarSign} />
          {business.recentSales.length ? (
            <div className="mt-3 divide-y divide-ink/8">
              {business.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {sale.productName ?? "Unassigned product"}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-ink/45">
                      {formatDate(sale.saleDate)} · Qty {sale.quantity} · {sale.paymentMethod}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold text-leaf">
                    {formatCurrency(sale.totalAmount, business.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState message="No recent sales found for this business." icon={CircleDollarSign} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Recent expenses" icon={ReceiptText} />
          {business.recentExpenses.length ? (
            <div className="mt-3 divide-y divide-ink/8">
              {business.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">
                      {expense.description}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-ink/45">
                      {formatDate(expense.expenseDate)} · {expense.category} · {expense.paymentMethod}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-extrabold text-clay">
                    {formatCurrency(expense.amount, business.currency)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState message="No recent expenses found for this business." icon={ReceiptText} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
