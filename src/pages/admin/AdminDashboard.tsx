import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Package,
  RefreshCcw,
  Settings,
  ShieldAlert,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { AnimatedIcon } from "../../components/animate-ui/MotionPrimitives";
import { getAdminStats } from "../../services/adminApi";
import type { AdminRole, AdminStatus, PlatformStats } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type SummaryMetric = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: "emerald" | "orange" | "violet";
  progress?: number;
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

function getStatusBadgeClass(status: AdminStatus) {
  return status === "ACTIVE"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-orange-200 bg-orange-50 text-orange-700";
}

function getRoleBadgeClass(role: AdminRole) {
  return role === "SUPER_ADMIN"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-ink/10 bg-[#f7faf9] text-ink/60";
}

function isStatsEmpty(stats: PlatformStats) {
  return (
    stats.totalUsers === 0 &&
    stats.totalBusinesses === 0 &&
    stats.recentUsers.length === 0 &&
    stats.recentBusinesses.length === 0
  );
}

function Sparkline({ tone }: { tone: "blue" | "emerald" | "orange" | "violet" }) {
  const color = {
    blue: "#2563eb",
    emerald: "#059669",
    orange: "#ea580c",
    violet: "#7c3aed",
  }[tone];

  return (
    <svg className="h-8 w-28" viewBox="0 0 112 32" aria-hidden="true">
      <polyline
        points={tone === "orange" ? "0,24 18,24 36,24 54,24 72,24 90,24 112,24" : "0,26 16,19 32,21 48,13 64,17 80,8 96,14 112,4"}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AdminKpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
  trend,
  sparkTone,
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  trend: string;
  sparkTone: "blue" | "emerald" | "orange" | "violet";
  loading?: boolean;
}) {
  return (
    <section className="min-h-[9rem] rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-11 w-11 rounded-lg bg-ink/8" />
          <div className="h-4 w-28 rounded-full bg-ink/8" />
          <div className="h-7 w-10 rounded-full bg-ink/8" />
        </div>
      ) : (
        <>
          <div className="flex items-start gap-4">
            <span className={`grid h-11 w-11 place-items-center rounded-lg ${iconClass}`}>
              <AnimatedIcon icon={Icon} size={19} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink/70">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
            </div>
          </div>
          <div className="mt-7 flex items-end justify-between gap-3">
            <p className="text-xs font-semibold text-ink/50">
              <span className="font-bold text-emerald-700">↑ {trend}</span> vs last month
            </p>
            <Sparkline tone={sparkTone} />
          </div>
        </>
      )}
    </section>
  );
}

function EmptyTableState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-44 place-items-center px-5 py-8 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/45">
          <Icon size={22} />
        </span>
        <p className="mt-4 text-sm font-bold text-ink">{title}</p>
        <p className="mt-2 text-sm font-semibold text-ink/45">{subtitle}</p>
      </div>
    </div>
  );
}

function PanelHeader({ title, icon: Icon, to }: { title: string; icon: LucideIcon; to: string }) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-ink/55" />
        <h2 className="font-display text-sm font-bold text-ink">{title}</h2>
      </div>
      <Link to={to} className="text-xs font-bold text-ink/55 hover:text-emerald-700">View all</Link>
    </div>
  );
}

function SummaryCard({ metric }: { metric: SummaryMetric }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    violet: "bg-violet-50 text-violet-700",
  }[metric.tone];
  const barClass = {
    emerald: "bg-emerald-500",
    orange: "bg-orange-500",
    violet: "bg-violet-500",
  }[metric.tone];

  return (
    <div className="rounded-xl border border-ink/10 bg-gradient-to-br from-white to-[#f7faf9] p-5">
      <span className={`grid h-11 w-11 place-items-center rounded-lg ${toneClass}`}>
        <metric.icon size={18} />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink/65">{metric.label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-ink">{metric.value}</p>
      {metric.progress !== undefined && (
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ink/8">
          <div className={`h-full rounded-full ${barClass}`} style={{ width: `${metric.progress}%` }} />
        </div>
      )}
      <p className="mt-4 text-sm font-semibold text-ink/50">{metric.helper}</p>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  subtitle,
  tone,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-4 rounded-xl border border-ink/10 bg-white p-4 transition-colors hover:bg-emerald-50/60">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-sm font-bold text-ink">{title}</span>
        <span className="mt-1 block truncate text-xs font-semibold text-ink/50">{subtitle}</span>
      </span>
    </Link>
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

  const activeRate = stats && stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers) * 100 : 0;
  const suspendedRate = stats && stats.totalUsers > 0 ? (stats.suspendedUsers / stats.totalUsers) * 100 : 0;
  const showEmptyPlatform = stats ? isStatsEmpty(stats) : false;

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    if (!stats) return [];

    return [
      {
        label: "Active user rate",
        value: formatPercent(activeRate),
        helper: `${stats.activeUsers} of ${stats.totalUsers} users active`,
        icon: Users,
        tone: "emerald",
        progress: activeRate,
      },
      {
        label: "Suspension rate",
        value: formatPercent(suspendedRate),
        helper: `${stats.suspendedUsers} suspended accounts`,
        icon: ShieldAlert,
        tone: "orange",
        progress: suspendedRate,
      },
      {
        label: "Businesses on platform",
        value: String(stats.totalBusinesses),
        helper: "Registered businesses managed by super admin",
        icon: Building2,
        tone: "violet",
      },
    ];
  }, [activeRate, stats, suspendedRate]);

  return (
    <div className="mx-auto max-w-[94rem] px-5 py-7 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">SUPER ADMIN</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">BizTrack Dashboard</h1>
          <p className="mt-2 text-sm font-semibold text-ink/55">Manage users, businesses, packages, website content, and system settings.</p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          disabled={isLoading}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-5 text-sm font-bold text-ink/65 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <span className={isLoading ? "animate-spin" : ""}>
            <AnimatedIcon icon={RefreshCcw} size={15} />
          </span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AnimatedIcon icon={AlertCircle} size={17} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={loadStats} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-extrabold text-red-600">
            <AnimatedIcon icon={RefreshCcw} size={13} />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && showEmptyPlatform && (
        <div className="mt-5 rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink/50 shadow-sm">
          No platform activity has been recorded yet.
        </div>
      )}

      <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard label="Total users" value={String(stats?.totalUsers ?? 0)} icon={Users} iconClass="bg-blue-50 text-blue-700" trend="100%" sparkTone="blue" loading={isLoading} />
        <AdminKpiCard label="Active users" value={String(stats?.activeUsers ?? 0)} icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-700" trend="100%" sparkTone="emerald" loading={isLoading} />
        <AdminKpiCard label="Suspended users" value={String(stats?.suspendedUsers ?? 0)} icon={ShieldAlert} iconClass="bg-orange-50 text-orange-700" trend="0%" sparkTone="orange" loading={isLoading} />
        <AdminKpiCard label="Total businesses" value={String(stats?.totalBusinesses ?? 0)} icon={Building2} iconClass="bg-violet-50 text-violet-700" trend="100%" sparkTone="violet" loading={isLoading} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          <PanelHeader title="Recent users" icon={Users} to="/admin/users" />
          <div className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr] border-b border-ink/10 bg-white px-5 py-3 text-xs font-semibold text-ink/55">
            <span>User</span>
            <span>Email</span>
            <span>Status</span>
            <span>Joined</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse px-5 py-8">
              <div className="h-4 w-2/3 rounded-full bg-ink/8" />
            </div>
          ) : stats?.recentUsers.length ? (
            <div className="divide-y divide-ink/8">
              {stats.recentUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-[1.1fr_1.2fr_0.8fr_0.8fr] items-center gap-3 px-5 py-3 text-sm">
                  <Link to={`/admin/users/${user.id}`} className="truncate font-bold text-ink hover:text-emerald-700">{user.name}</Link>
                  <span className="truncate text-ink/55">{user.email}</span>
                  <span className="flex flex-wrap gap-1">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-extrabold ${getStatusBadgeClass(user.status)}`}>{user.status}</span>
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-extrabold ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
                  </span>
                  <span className="text-xs font-semibold text-ink/50">{formatDate(user.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTableState icon={Users} title="No recent users found." subtitle="Newly registered users will appear here." />
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
          <PanelHeader title="Recent businesses" icon={Store} to="/admin/businesses" />
          <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr] border-b border-ink/10 bg-white px-5 py-3 text-xs font-semibold text-ink/55">
            <span>Business</span>
            <span>Owner</span>
            <span>Status</span>
            <span>Registered</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse px-5 py-8">
              <div className="h-4 w-2/3 rounded-full bg-ink/8" />
            </div>
          ) : stats?.recentBusinesses.length ? (
            <div className="divide-y divide-ink/8">
              {stats.recentBusinesses.map((business) => (
                <div key={business.id} className="grid grid-cols-[1.1fr_1fr_0.8fr_0.8fr] items-center gap-3 px-5 py-3 text-sm">
                  <Link to={`/admin/businesses/${business.id}`} className="truncate font-bold text-ink hover:text-emerald-700">{business.name}</Link>
                  <span className="truncate text-ink/55">{business.user.name}</span>
                  <span className="inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700">ACTIVE</span>
                  <span className="text-xs font-semibold text-ink/50">{formatDate(business.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTableState icon={Store} title="No recent businesses found." subtitle="Newly registered businesses will appear here." />
          )}
        </section>
      </div>

      <section className="mt-5 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-ink/55" />
          <h2 className="font-display text-sm font-bold text-ink">Admin activity summary</h2>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-xl bg-ink/8" />)
          ) : (
            summaryMetrics.map((metric) => <SummaryCard key={metric.label} metric={metric} />)
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold text-ink">Quick actions</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <QuickAction to="/admin/users" icon={UserPlus} title="Add New User" subtitle="Create a new platform user" tone="bg-emerald-50 text-emerald-700" />
          <QuickAction to="/admin/businesses" icon={Building2} title="Add New Business" subtitle="Register a new business" tone="bg-blue-50 text-blue-700" />
          <QuickAction to="/admin/packages/new" icon={Package} title="Create Package" subtitle="Add a new subscription package" tone="bg-orange-50 text-orange-700" />
          <QuickAction to="/admin/settings" icon={Settings} title="System Settings" subtitle="Manage platform settings" tone="bg-violet-50 text-violet-700" />
        </div>
      </section>
    </div>
  );
}
