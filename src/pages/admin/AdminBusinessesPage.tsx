import { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { AlertCircle, Building2, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getAdminBusinessesPage } from "../../services/adminApi";
import type { AdminBusiness } from "../../services/adminApi";
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

function CountryBadge({ country }: { country: string }) {
  return (
    <span className="inline-flex rounded-full border border-ink/10 bg-[#f4f0e8] px-2 py-1 text-[11px] font-extrabold text-ink/60">
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
        <TableRow key={index}>
          {Array.from({ length: 12 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <div className="h-3 w-full max-w-28 animate-pulse rounded-full bg-ink/8" />
            </TableCell>
          ))}
        </TableRow>
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

function ViewLink({ id }: { id: string }) {
  return (
    <Link
      to={`/admin/businesses/${id}`}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-ink/15 px-2.5 py-1.5 text-xs font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8]"
    >
      <Eye size={13} aria-hidden="true" />
      View
    </Link>
  );
}

function BusinessMobileCard({ business }: { business: AdminBusiness }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-extrabold text-ink">{business.name}</h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-ink/45">
            {business.user.name} · {business.user.email}
          </p>
        </div>
        <CountryBadge country={business.country} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Products</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{business._count.products}</dd>
        </div>
        <div className="rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Sales</dt>
          <dd className="mt-0.5 font-extrabold text-leaf">{business._count.sales}</dd>
        </div>
        <div className="rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Expenses</dt>
          <dd className="mt-0.5 font-extrabold text-clay">{business._count.expenses}</dd>
        </div>
        <div className="col-span-3 rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Total sales</dt>
          <dd className="mt-0.5 font-extrabold text-leaf">
            {formatCurrency(business.totalSalesAmount, business.currency)}
          </dd>
        </div>
        <div className="col-span-3 rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Total expenses</dt>
          <dd className="mt-0.5 font-extrabold text-clay">
            {formatCurrency(business.totalExpensesAmount, business.currency)}
          </dd>
        </div>
        <div className="col-span-2 rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Created</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{formatDate(business.createdAt)}</dd>
        </div>
        <div className="rounded-lg bg-[#fbfaf6] p-2">
          <dt className="font-bold text-ink/35">Currency</dt>
          <dd className="mt-0.5 font-extrabold text-ink">{business.currency}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <ViewLink id={business.id} />
      </div>
    </article>
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
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
        <h1 className="mt-1 font-display text-xl font-bold text-ink">Businesses management</h1>
        <p className="mt-1 text-sm font-semibold text-ink/45">
          View system-wide businesses, owners, activity counts, and money totals.
        </p>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-ink/10 bg-white p-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business name..."
            className="w-full rounded-lg border border-ink/15 bg-[#fbfaf6] py-2.5 pl-10 pr-4 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          />
        </div>
        <input
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          placeholder="Filter by country"
          className="w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2.5 text-sm font-medium text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        />
      </div>

      {error && <ErrorBanner message={error} />}

      <section className="mt-4 overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="hidden xl:block">
          <TableContainer>
            <Table aria-label="Admin businesses table">
              <TableHead>
                <TableRow className="bg-[#fbfaf6]">
                  <TableCell>Business name</TableCell>
                  <TableCell>Owner name</TableCell>
                  <TableCell>Owner email</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Products count</TableCell>
                  <TableCell>Sales count</TableCell>
                  <TableCell>Expenses count</TableCell>
                  <TableCell>Total sales</TableCell>
                  <TableCell>Total expenses</TableCell>
                  <TableCell>Created date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <LoadingRows />
                ) : hasBusinesses ? (
                  businesses.map((business) => (
                    <TableRow key={business.id} hover>
                      <TableCell className="font-bold text-ink">{business.name}</TableCell>
                      <TableCell>{business.user.name}</TableCell>
                      <TableCell>{business.user.email}</TableCell>
                      <TableCell><CountryBadge country={business.country} /></TableCell>
                      <TableCell>{business.currency}</TableCell>
                      <TableCell>{business._count.products}</TableCell>
                      <TableCell>{business._count.sales}</TableCell>
                      <TableCell>{business._count.expenses}</TableCell>
                      <TableCell className="font-bold text-leaf">
                        {formatCurrency(business.totalSalesAmount, business.currency)}
                      </TableCell>
                      <TableCell className="font-bold text-clay">
                        {formatCurrency(business.totalExpensesAmount, business.currency)}
                      </TableCell>
                      <TableCell>{formatDate(business.createdAt)}</TableCell>
                      <TableCell><ViewLink id={business.id} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12}>
                      <EmptyState message="No businesses match the current filters." />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="xl:hidden">
          {isLoading ? (
            <MobileLoadingCards />
          ) : hasBusinesses ? (
            <div className="space-y-3 p-3">
              {businesses.map((business) => (
                <BusinessMobileCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <EmptyState message="No businesses match the current filters." />
          )}
        </div>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_event, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </section>

      {!isLoading && !error && (
        <p className="mt-3 text-xs font-semibold text-ink/40">
          Admin business pages are read-only. Sales and expenses cannot be edited here yet.
        </p>
      )}
    </div>
  );
}
