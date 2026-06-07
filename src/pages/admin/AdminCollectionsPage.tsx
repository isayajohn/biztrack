import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import {
  getAdminCollectionStats,
  getAdminCollections,
  type AdminCollection,
  type AdminCollectionStats,
  type PaymentStatus,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";

const statuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "CANCELLED"];

function formatDate(value?: string | null) {
  if (!value) return "None";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const classes =
    status === "PAID"
      ? "border-leaf/20 bg-mint text-leaf"
      : status === "PENDING"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "FAILED"
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-ink/10 bg-[#f4f0e8] text-ink/55";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${classes}`}>
      {status}
    </span>
  );
}

function CollectionIcon({ status }: { status: PaymentStatus }) {
  if (status === "PAID") return <CheckCircle2 size={18} className="text-leaf" aria-hidden="true" />;
  if (status === "PENDING") return <Clock3 size={18} className="text-amber-700" aria-hidden="true" />;
  return <XCircle size={18} className="text-red-600" aria-hidden="true" />;
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink/45">{helper}</p>
    </div>
  );
}

function CollectionRow({ collection }: { collection: AdminCollection }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-4">
        <div className="flex items-start gap-2">
          <CollectionIcon status={collection.status} />
          <div className="min-w-0">
            <p className="font-extrabold text-ink">{collection.business.name}</p>
            <p className="mt-1 text-xs font-semibold text-ink/45">{collection.business.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <p className="font-extrabold text-ink">{collection.package.name}</p>
        <p className="mt-1 text-xs font-semibold text-ink/45">{collection.billingCycle}</p>
      </td>
      <td className="px-4 py-4 font-black text-ink">
        {formatCurrency(collection.amount, collection.currency)}
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={collection.status} />
      </td>
      <td className="px-4 py-4">
        <p className="font-mono text-xs font-bold text-ink/65">{collection.externalId}</p>
        <p className="mt-1 font-mono text-xs text-ink/35">
          {collection.providerReference ?? "No provider ref"}
        </p>
      </td>
      <td className="px-4 py-4 text-sm font-semibold text-ink/55">
        <p>Created {formatDate(collection.createdAt)}</p>
        <p className="mt-1">
          {collection.status === "PAID"
            ? `Paid ${formatDate(collection.paidAt)}`
            : collection.status === "FAILED"
              ? `Failed ${formatDate(collection.failedAt)}`
              : "Awaiting confirmation"}
        </p>
      </td>
    </tr>
  );
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [stats, setStats] = useState<AdminCollectionStats | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const paid = stats?.byStatus.PAID ?? { count: 0, amount: 0 };
  const pending = stats?.byStatus.PENDING ?? { count: 0, amount: 0 };
  const failed = stats?.byStatus.FAILED ?? { count: 0, amount: 0 };

  const filteredParams = useMemo(
    () => ({
      search: search || undefined,
      status: status ? (status as PaymentStatus) : undefined,
      limit: 100,
    }),
    [search, status],
  );

  async function loadCollections() {
    setIsLoading(true);
    setError("");

    try {
      const [collectionResult, nextStats] = await Promise.all([
        getAdminCollections(filteredParams),
        getAdminCollectionStats(),
      ]);
      setCollections(collectionResult.items);
      setStats(nextStats);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadCollections();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filteredParams]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Collections</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Track package payment attempts, successful collections, and failed checkout requests.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCollections}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <section className="mt-5 grid gap-3 md:grid-cols-4">
        <StatTile
          label="Total requests"
          value={String(stats?.totalCount ?? 0)}
          helper={formatCurrency(stats?.totalAmount ?? 0)}
        />
        <StatTile label="Collected" value={formatCurrency(paid.amount)} helper={`${paid.count} paid`} />
        <StatTile label="Pending" value={formatCurrency(pending.amount)} helper={`${pending.count} pending`} />
        <StatTile label="Failed" value={formatCurrency(failed.amount)} helper={`${failed.count} failed`} />
      </section>

      <section className="mt-5 rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-ink/10 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search business, email, package, or reference"
              className="w-full rounded-lg border border-ink/10 bg-[#fbfaf6] py-2.5 pl-9 pr-3 text-sm font-semibold outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-ink/10 bg-[#fbfaf6] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <RefreshCw size={24} className="animate-spin text-leaf" aria-hidden="true" />
          </div>
        ) : collections.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
            <CreditCard size={30} className="text-ink/25" aria-hidden="true" />
            <p className="text-sm font-semibold text-ink/45">No collection records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
              <thead className="bg-[#fbfaf6] text-xs font-extrabold uppercase tracking-[0.05em] text-ink/45">
                <tr>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {collections.map((collection) => (
                  <CollectionRow key={collection.id} collection={collection} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
