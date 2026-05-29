import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  RefreshCcw,
  ShieldAlert,
  Store,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import StatCard from "../../components/dashboard/StatCard";
import { AnimatedIcon, MotionItem, MotionList, MotionPanel } from "../../components/animate-ui/MotionPrimitives";
import { getAdminStats } from "../../services/adminApi";
import type { AdminRole, AdminStatus, AdminUser, PlatformStats } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";

type SummaryMetric = {
  label: string;
  value: string;
  helper: string;
};

type TooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getStatusBadgeClass(status: AdminStatus) {
  return status === "ACTIVE"
    ? "border-leaf/20 bg-mint text-leaf"
    : "border-clay/20 bg-orange-50 text-clay";
}

function getRoleBadgeClass(role: AdminRole) {
  return role === "SUPER_ADMIN"
    ? "border-leaf/20 bg-mint text-leaf"
    : "border-ink/10 bg-[#f4f0e8] text-ink/60";
}

function isStatsEmpty(stats: PlatformStats) {
  return (
    stats.totalUsers === 0 &&
    stats.totalBusinesses === 0 &&
    stats.totalProducts === 0 &&
    stats.totalSalesAmount === 0 &&
    stats.totalExpensesAmount === 0 &&
    stats.recentUsers.length === 0 &&
    stats.recentBusinesses.length === 0
  );
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-ink/40">
          <AnimatedIcon icon={Icon} size={16} />
        </span>
        <h2 className="truncate text-sm font-bold text-ink">{title}</h2>
      </div>
      {subtitle && <span className="shrink-0 text-xs font-semibold text-ink/40">{subtitle}</span>}
    </div>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon: LucideIcon }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-ink/15 bg-[#fbfaf6] px-4 py-8 text-center">
      <AnimatedIcon icon={Icon} size={24} className="text-ink/25" />
      <p className="max-w-xs text-sm font-semibold leading-6 text-ink/45">{message}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-3 animate-pulse divide-y divide-ink/8">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-32 rounded-full bg-ink/8" />
            <div className="h-2.5 w-44 max-w-full rounded-full bg-ink/8" />
          </div>
          <div className="h-6 w-20 rounded-full bg-ink/8" />
        </div>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="mt-4 grid animate-pulse gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-ink/10 bg-[#fbfaf6] p-3">
          <div className="h-2.5 w-24 rounded-full bg-ink/8" />
          <div className="mt-3 h-6 w-20 rounded-full bg-ink/8" />
          <div className="mt-2 h-2.5 w-36 rounded-full bg-ink/8" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="mt-5 flex h-[260px] animate-pulse items-end gap-5 px-6">
      {[72, 48].map((height, index) => (
        <div key={index} className="flex flex-1 items-end justify-center">
          <div className="w-full max-w-32 rounded-t-lg bg-ink/8" style={{ height: `${height}%` }} />
        </div>
      ))}
    </div>
  );
}

function SalesExpensesTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-ink/10 bg-white px-3.5 py-3 shadow-soft">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">
        Platform totals
      </p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-bold" style={{ color: entry.color }}>
          {entry.name}:{" "}
          <span className="font-extrabold">
            {formatCurrency(Number(entry.value ?? 0))}
          </span>
        </p>
      ))}
    </div>
  );
}

function RecentUserRow({ user }: { user: AdminUser }) {
  return (
    <MotionItem className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <Link
          to={`/admin/users/${user.id}`}
          className="block truncate text-sm font-extrabold text-ink transition-colors hover:text-leaf"
        >
          {user.name}
        </Link>
        <p className="truncate text-xs font-semibold text-ink/45">
          {user.email} · Joined {formatDate(user.createdAt)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-extrabold ${getStatusBadgeClass(
            user.status,
          )}`}
        >
          {user.status}
        </span>
        <span
          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-extrabold ${getRoleBadgeClass(
            user.role,
          )}`}
        >
          {user.role}
        </span>
      </div>
    </MotionItem>
  );
}

function SummaryMetricCard({ metric }: { metric: SummaryMetric }) {
  return (
    <MotionPanel className="rounded-lg border border-ink/10 bg-[#fbfaf6] p-3">
      <p className="text-xs font-semibold text-ink/45">{metric.label}</p>
      <p className="mt-1 text-xl font-extrabold tracking-tight text-ink">{metric.value}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-ink/45">{metric.helper}</p>
    </MotionPanel>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStats = () => {
    setIsLoading(true);
    setError("");

    getAdminStats()
      .then((nextStats) => setStats(nextStats))
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let alive = true;

    setIsLoading(true);
    setError("");
    getAdminStats()
      .then((nextStats) => {
        if (alive) setStats(nextStats);
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
  }, []);

  const activeRate =
    stats && stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const suspendedRate =
    stats && stats.totalUsers > 0 ? (stats.suspendedUsers / stats.totalUsers) * 100 : 0;
  const netAmount = (stats?.totalSalesAmount ?? 0) - (stats?.totalExpensesAmount ?? 0);
  const productsPerBusiness =
    stats && stats.totalBusinesses > 0 ? stats.totalProducts / stats.totalBusinesses : 0;

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    if (!stats) return [];

    return [
      {
        label: "Active user rate",
        value: formatPercent(activeRate),
        helper: `${stats.activeUsers} of ${stats.totalUsers} users active`,
      },
      {
        label: "Suspension rate",
        value: formatPercent(suspendedRate),
        helper: `${stats.suspendedUsers} suspended accounts`,
      },
      {
        label: "Net sales after expenses",
        value: formatCurrency(netAmount),
        helper: netAmount >= 0 ? "Sales are above expenses" : "Expenses are above sales",
      },
      {
        label: "Products per business",
        value: productsPerBusiness.toFixed(1),
        helper: `${stats.totalProducts} products across ${stats.totalBusinesses} businesses`,
      },
    ];
  }, [activeRate, netAmount, productsPerBusiness, stats, suspendedRate]);

  const chartData = useMemo(
    () => [
      {
        label: "Platform",
        sales: stats?.totalSalesAmount ?? 0,
        expenses: stats?.totalExpensesAmount ?? 0,
      },
    ],
    [stats],
  );

  const hasChartData = chartData.some((row) => row.sales > 0 || row.expenses > 0);
  const hasStats = Boolean(stats);
  const showEmptyPlatform = stats ? isStatsEmpty(stats) : false;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">
            SUPER_ADMIN
          </p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">
            BizTrack Dashboard
          </h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Platform-wide users, businesses, sales, expenses, and products.
          </p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-bold text-ink/65 shadow-sm transition-colors hover:bg-mint hover:text-leaf disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <span className={isLoading ? "animate-spin" : ""}>
            <AnimatedIcon icon={RefreshCcw} size={14} />
          </span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">
              <AnimatedIcon icon={AlertCircle} size={17} />
            </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadStats}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-600"
          >
            <AnimatedIcon icon={RefreshCcw} size={13} />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && showEmptyPlatform && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink/50 shadow-sm">
          No platform activity has been recorded yet.
        </div>
      )}

      <section className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={String(stats?.totalUsers ?? 0)}
          icon={Users}
          iconClass="bg-sky-50 text-sky-700"
          loading={isLoading}
        />
        <StatCard
          label="Active users"
          value={String(stats?.activeUsers ?? 0)}
          icon={CheckCircle2}
          iconClass="bg-mint text-leaf"
          loading={isLoading}
        />
        <StatCard
          label="Suspended users"
          value={String(stats?.suspendedUsers ?? 0)}
          icon={ShieldAlert}
          iconClass="bg-orange-50 text-clay"
          loading={isLoading}
        />
        <StatCard
          label="Total businesses"
          value={String(stats?.totalBusinesses ?? 0)}
          icon={Building2}
          iconClass="bg-amber-50 text-amber-700"
          loading={isLoading}
        />
        <StatCard
          label="Total sales amount"
          value={formatCurrency(stats?.totalSalesAmount ?? 0)}
          icon={CircleDollarSign}
          iconClass="bg-mint text-leaf"
          loading={isLoading}
          profitColor="positive"
        />
        <StatCard
          label="Total expenses amount"
          value={formatCurrency(stats?.totalExpensesAmount ?? 0)}
          icon={WalletCards}
          iconClass="bg-orange-50 text-clay"
          loading={isLoading}
        />
        <StatCard
          label="Total products"
          value={String(stats?.totalProducts ?? 0)}
          icon={Boxes}
          iconClass="bg-[#f4f0e8] text-ink/65"
          loading={isLoading}
        />
      </section>

      {!isLoading && !error && !hasStats && (
        <div className="mt-5">
          <EmptyState message="No admin stats are available." icon={AlertCircle} />
        </div>
      )}

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader
            title="Recent users"
            subtitle={stats ? `${stats.recentUsers.length} latest` : undefined}
            icon={Users}
          />
          {isLoading ? (
            <ListSkeleton />
          ) : stats?.recentUsers.length ? (
            <MotionList className="mt-3 divide-y divide-ink/8" role="list">
              {stats.recentUsers.map((user) => (
                <RecentUserRow key={user.id} user={user} />
              ))}
            </MotionList>
          ) : (
            <div className="mt-4">
              <EmptyState message="No recent users found." icon={Users} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader
            title="Recent businesses"
            subtitle={stats ? `${stats.recentBusinesses.length} latest` : undefined}
            icon={Store}
          />
          {isLoading ? (
            <ListSkeleton />
          ) : stats?.recentBusinesses.length ? (
            <MotionList className="mt-3 divide-y divide-ink/8" role="list">
              {stats.recentBusinesses.map((business) => (
                <MotionItem key={business.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-ink">{business.name}</p>
                    <p className="truncate text-xs font-semibold text-ink/45">
                      {business.user.name} · {business.country} · {business.currency}
                    </p>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-lg border border-ink/10 bg-[#fbfaf6] text-center">
                    <div className="min-w-12 px-2 py-1.5">
                      <p className="text-[10px] font-bold text-ink/35">P</p>
                      <p className="text-xs font-extrabold text-ink">{business._count.products}</p>
                    </div>
                    <div className="min-w-12 border-x border-ink/10 px-2 py-1.5">
                      <p className="text-[10px] font-bold text-ink/35">S</p>
                      <p className="text-xs font-extrabold text-leaf">{business._count.sales}</p>
                    </div>
                    <div className="min-w-12 px-2 py-1.5">
                      <p className="text-[10px] font-bold text-ink/35">E</p>
                      <p className="text-xs font-extrabold text-clay">{business._count.expenses}</p>
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <div className="mt-4">
              <EmptyState message="No recent businesses found." icon={Store} />
            </div>
          )}
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Platform activity summary" icon={Clock3} />
          {isLoading ? (
            <SummarySkeleton />
          ) : stats ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {summaryMetrics.map((metric) => (
                <SummaryMetricCard key={metric.label} metric={metric} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState message="No activity summary available." icon={Clock3} />
            </div>
          )}
        </section>

        <section className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <SectionHeader title="Sales vs expenses overview chart" icon={BarChart3} />
          {isLoading ? (
            <ChartSkeleton />
          ) : hasChartData ? (
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                  barCategoryGap="40%"
                  barGap={8}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(23,33,27,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "rgba(23,33,27,0.45)", fontFamily: "Open Sans" }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(23,33,27,0.45)", fontFamily: "Open Sans" }}
                    axisLine={false}
                    tickLine={false}
                    width={58}
                    tickFormatter={(value) => formatCompactCurrency(Number(value))}
                  />
                  <Tooltip
                    content={<SalesExpensesTooltip />}
                    cursor={{ fill: "rgba(23,33,27,0.04)", radius: 4 } as object}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize: 12,
                      fontWeight: 700,
                      paddingTop: 14,
                      fontFamily: "Open Sans",
                    }}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#1f8a5b" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#c86b3c" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState message="No sales or expenses recorded yet." icon={BarChart3} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
