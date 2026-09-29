import { useEffect, useState } from "react";
import { AlertCircle, Building2, CreditCard, Eye, Search } from "lucide-react";
import { getAdminBusinessesPage } from "../../services/adminApi";
import type { AdminBusiness } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";
import {
  AdminActionMenu,
  AdminFilterPanel,
  AdminPageFrame,
  AdminPageHeader,
  AdminTablePagination,
  EntityAvatar,
} from "../../components/admin/AdminTableUi";

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

function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex rounded-full border border-ink/10 bg-[#eef8f4] px-2 py-1 text-[11px] font-extrabold text-ink/60">
      {country}
    </span>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <Building2 size={24} className="text-ink/25" aria-hidden="true" />
      <p className="text-sm font-semibold text-ink/45">{message}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex}>
              <div className="h-3 w-full max-w-28 animate-pulse rounded-full bg-ink/8" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function MobileLoadingCards() {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-lg border border-ink/10 bg-white p-3">
          <div className="h-3 w-40 rounded-full bg-ink/8" />
          <div className="mt-2 h-2.5 w-52 rounded-full bg-ink/8" />
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="h-12 rounded-lg bg-ink/8" />
            <div className="h-12 rounded-lg bg-ink/8" />
            <div className="h-12 rounded-lg bg-ink/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BusinessMobileCard({ business }: { business: AdminBusiness }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><EntityAvatar value={business.name} /><div className="min-w-0"><h2 className="truncate text-sm font-extrabold text-ink">{business.name}</h2><p className="mt-1 truncate text-xs font-semibold text-[#62625b]">{business.user.name} · {business.user.email}</p></div></div>
        <BusinessActions business={business} />
      </div>

      <div className="mt-3"><CountryBadge country={business.country} /></div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Products</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{business._count.products}</dd>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Sales</dt>
          <dd className="mt-0.5 font-extrabold text-leaf">{business._count.sales}</dd>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Expenses</dt>
          <dd className="mt-0.5 font-extrabold text-clay">{business._count.expenses}</dd>
        </div>
        <div className="col-span-3 rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Total sales</dt>
          <dd className="mt-0.5 font-extrabold text-leaf">
            {formatCurrency(business.totalSalesAmount, business.currency)}
          </dd>
        </div>
        <div className="col-span-3 rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Total expenses</dt>
          <dd className="mt-0.5 font-extrabold text-clay">
            {formatCurrency(business.totalExpensesAmount, business.currency)}
          </dd>
        </div>
        <div className="col-span-2 rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Created</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{formatDate(business.createdAt)}</dd>
        </div>
        <div className="rounded-lg bg-[#f7faf9] p-2">
          <dt className="font-bold text-ink/35">Currency</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{business.currency}</dd>
        </div>
      </dl>

    </article>
  );
}

function BusinessActions({ business }: { business: AdminBusiness }) {
  return (
    <AdminActionMenu
      label={`Actions for ${business.name}`}
      items={[
        { label: "View business", icon: Eye, to: `/admin/businesses/${business.id}` },
        { label: "Manage billing", icon: CreditCard, to: `/admin/businesses/${business.id}/subscription` },
      ]}
    />
  );
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    let alive = true;

    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      getAdminBusinessesPage({
        search,
        country,
        page: page + 1,
        limit: rowsPerPage,
      })
        .then((result) => {
          if (!alive) return;
          setBusinesses(result.items);
          setTotal(result.pagination.total);
          setError("");
        })
        .catch((err) => {
          if (alive) setError(getApiErrorMessage(err));
        })
        .finally(() => {
          if (alive) setIsLoading(false);
        });
    }, 250);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [country, page, rowsPerPage, search]);

  useEffect(() => setPage(0), [country, rowsPerPage, search]);

  const hasBusinesses = businesses.length > 0;

  return (
    <AdminPageFrame>
      <AdminPageHeader icon={Building2} title="Businesses Management" description="View system-wide businesses, owners, activity counts, and money totals." />

      <div className="mt-7 space-y-5">
        <AdminFilterPanel>
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#62625b]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business name, owner or email..." className="h-14 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]" />
            </div>
            <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Filter by country" className="h-14 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-semibold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]" />
          </div>
        </AdminFilterPanel>

        {error && <ErrorBanner message={error} />}

        <section className="portal-table-card">
          <div className="hidden xl:block">
            <table className="portal-data-table" aria-label="Admin businesses table">
              <thead><tr><th>Business</th><th>Owner</th><th>Location</th><th>Activity</th><th>Financials</th><th>Created</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {isLoading ? <LoadingRows /> : hasBusinesses ? businesses.map((business) => (
                  <tr key={business.id}>
                    <td><div className="flex min-w-0 items-center gap-4"><EntityAvatar value={business.name} /><div><p className="font-extrabold text-ink">{business.name}</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{business.currency}</p></div></div></td>
                    <td><p className="font-extrabold text-ink">{business.user.name}</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{business.user.email}</p></td>
                    <td><CountryBadge country={business.country} /></td>
                    <td><p className="font-extrabold text-ink">{business._count.products} products</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{business._count.sales} sales · {business._count.expenses} expenses</p></td>
                    <td><p className="font-extrabold text-[#0f7a4b]">{formatCurrency(business.totalSalesAmount, business.currency)} sales</p><p className="mt-1 text-sm font-semibold text-[#e60023]">{formatCurrency(business.totalExpensesAmount, business.currency)} expenses</p></td>
                    <td className="font-semibold text-[#33332e]">{formatDate(business.createdAt)}</td>
                    <td className="text-right"><BusinessActions business={business} /></td>
                  </tr>
                )) : <tr><td colSpan={7}><EmptyState message="No businesses match the current filters." /></td></tr>}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-[#e5e5e0] xl:hidden">
            {isLoading ? <MobileLoadingCards /> : hasBusinesses ? businesses.map((business) => <BusinessMobileCard key={business.id} business={business} />) : <EmptyState message="No businesses match the current filters." />}
          </div>

          <AdminTablePagination total={total} page={page} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }} />
        </section>

        {!isLoading && !error && <p className="text-xs font-semibold text-[#62625b]">Admin business pages are read-only. Sales and expenses cannot be edited here yet.</p>}
      </div>
    </AdminPageFrame>
  );
}
