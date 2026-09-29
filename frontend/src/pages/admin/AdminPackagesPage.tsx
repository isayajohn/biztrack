import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Package,
  PackagePlus,
  Pencil,
  Power,
  PowerOff,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  deleteAdminPackage,
  getAdminPackages,
  updateAdminPackageStatus,
  updateAdminPackageVisibility,
} from "../../services/adminApi";
import type { AdminPackage, PackageStatus } from "../../services/adminApi";
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

type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  tone: "danger" | "warning";
  onConfirm: () => Promise<void>;
};

const featureLabels: Array<{ key: keyof Pick<
  AdminPackage,
  "allowReports" | "allowPdfExport" | "allowCsvExport" | "allowInventoryAlerts" | "allowAiInsights"
>; label: string }> = [
  { key: "allowReports", label: "Reports" },
  { key: "allowPdfExport", label: "PDF" },
  { key: "allowCsvExport", label: "CSV" },
  { key: "allowInventoryAlerts", label: "Alerts" },
  { key: "allowAiInsights", label: "AI" },
];

function enabledFeatures(plan: AdminPackage) {
  return featureLabels.filter((feature) => plan[feature.key]);
}

function StatusBadge({ status }: { status: PackageStatus }) {
  const classes =
    status === "ACTIVE"
      ? "border-leaf/20 bg-mint text-leaf"
      : "border-ink/10 bg-[#eef8f4] text-ink/55";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${classes}`}>
      {status}
    </span>
  );
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${
        isVisible
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : "border-ink/10 bg-[#eef8f4] text-ink/55"
      }`}
    >
      {isVisible ? "VISIBLE" : "HIDDEN"}
    </span>
  );
}

function PageMessage({ type, text }: { type: "success" | "error"; text: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const classes = type === "success" ? "border-leaf/20 bg-mint text-leaf" : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-lg bg-[#f7faf9] p-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink/35">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold text-ink">{value ?? "None"}</dd>
    </div>
  );
}

export default function AdminPackagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [viewPackage, setViewPackage] = useState<AdminPackage | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...packages]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((plan) => !query || plan.name.toLowerCase().includes(query) || plan.slug.toLowerCase().includes(query))
      .filter((plan) => !statusFilter || plan.status === statusFilter)
      .filter((plan) => !visibilityFilter || String(plan.isVisible) === visibilityFilter);
  }, [packages, search, statusFilter, visibilityFilter]);

  const visiblePackages = useMemo(
    () => filteredPackages.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredPackages, page, rowsPerPage],
  );

  async function loadPackages({ clearMessage = true } = {}) {
    setIsLoading(true);
    if (clearMessage) setMessage(null);
    try {
      setPackages(await getAdminPackages());
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const state = location.state as { message?: string } | null;
    if (state?.message) {
      setMessage({ type: "success", text: state.message });
      navigate(location.pathname, { replace: true });
    }
    loadPackages({ clearMessage: !state?.message });
  }, []);

  useEffect(() => setPage(0), [search, statusFilter, visibilityFilter, rowsPerPage]);

  async function runAction(action: () => Promise<void>, success: string) {
    setIsMutating(true);
    setMessage(null);
    try {
      await action();
      await loadPackages();
      setMessage({ type: "success", text: success });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsMutating(false);
      setConfirmAction(null);
    }
  }

  function activatePackage(plan: AdminPackage) {
    runAction(() => updateAdminPackageStatus(plan.id, "ACTIVE").then(() => undefined), `${plan.name} activated.`);
  }

  function confirmDeactivate(plan: AdminPackage) {
    setConfirmAction({
      title: "Deactivate package?",
      body: `${plan.name} will no longer be available for new active assignments.`,
      confirmLabel: "Deactivate",
      tone: "warning",
      onConfirm: () =>
        runAction(() => updateAdminPackageStatus(plan.id, "INACTIVE").then(() => undefined), `${plan.name} deactivated.`),
    });
  }

  function showPackage(plan: AdminPackage) {
    runAction(
      () => updateAdminPackageVisibility(plan.id, true).then(() => undefined),
      `${plan.name} is now visible to users.`,
    );
  }

  function confirmHide(plan: AdminPackage) {
    setConfirmAction({
      title: "Hide package from users?",
      body: `${plan.name} will be removed from pricing, registration, and subscription choices. Existing subscriptions will not be changed.`,
      confirmLabel: "Hide package",
      tone: "warning",
      onConfirm: () =>
        runAction(
          () => updateAdminPackageVisibility(plan.id, false).then(() => undefined),
          `${plan.name} is now hidden from users.`,
        ),
    });
  }

  function confirmDelete(plan: AdminPackage) {
    setConfirmAction({
      title: "Delete package?",
      body:
        (plan.subscriptionCount ?? 0) > 0
          ? `${plan.name} has ${plan.subscriptionCount} subscription(s). The backend will block deletion while businesses are using it.`
          : `${plan.name} will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: () => runAction(() => deleteAdminPackage(plan.id), `${plan.name} deleted.`),
    });
  }

  return (
    <AdminPageFrame>
      <AdminPageHeader
        icon={Package}
        title="Package Management"
        description="Create plans, set limits, and control package availability."
        action={
          <Link to="/admin/packages/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#e60023] px-5 text-sm font-bold text-white transition-colors hover:bg-[#cc001f]">
            <PackagePlus size={17} aria-hidden="true" />
            Add New Package
          </Link>
        }
      />

      <div className="mt-7 space-y-5">
        {message && <PageMessage type={message.type} text={message.text} />}

        <AdminFilterPanel>
          <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr]">
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#62625b]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search package name or slug..." className="h-14 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-14 rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)} className="h-14 rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]">
              <option value="">All visibility</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </AdminFilterPanel>

        <section className="portal-table-card">
          {isLoading ? <LoadingList /> : filteredPackages.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
              <PackagePlus size={28} className="text-ink/25" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink/45">No packages match the current filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="portal-data-table min-w-full text-left text-sm">
                  <thead><tr>
                    <th>Package</th><th>Pricing</th><th>Trial</th><th>Usage limits</th><th>Features</th><th>Status</th><th>User view</th><th className="text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {visiblePackages.map((plan) => (
                      <tr key={plan.id}>
                        <td><div className="flex min-w-0 items-center gap-4"><EntityAvatar value={plan.name} /><div><p className="font-extrabold text-ink">{plan.name}</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{plan.slug}</p></div></div></td>
                        <td><p className="font-extrabold text-ink">{formatCurrency(plan.priceMonthly, plan.currency)} / month</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{plan.priceYearly == null ? "No yearly price" : `${formatCurrency(plan.priceYearly, plan.currency)} / year`}</p></td>
                        <td><p className="font-extrabold text-ink">{plan.trialDays > 0 ? `${plan.trialDays} days` : "No trial"}</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{plan.currency}</p></td>
                        <td><p className="font-extrabold text-ink">{plan.maxProducts} products</p><p className="mt-1 text-sm font-semibold text-[#62625b]">{plan.maxSalesPerMonth} sales · {plan.maxExpensesPerMonth} expenses</p></td>
                        <td className="max-w-52"><FeatureBadges plan={plan} /></td>
                        <td><StatusBadge status={plan.status} /></td>
                        <td><VisibilityBadge isVisible={plan.isVisible} /></td>
                        <td className="text-right"><PackageActions plan={plan} isMutating={isMutating} onView={() => setViewPackage(plan)} onActivate={() => activatePackage(plan)} onDeactivate={() => confirmDeactivate(plan)} onShow={() => showPackage(plan)} onHide={() => confirmHide(plan)} onDelete={() => confirmDelete(plan)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#e5e5e0] xl:hidden">
                {visiblePackages.map((plan) => (
                  <article key={plan.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3"><EntityAvatar value={plan.name} /><div className="min-w-0"><h3 className="truncate font-display text-base font-bold text-ink">{plan.name}</h3><p className="mt-1 truncate text-xs font-bold text-[#62625b]">{plan.slug}</p></div></div>
                      <PackageActions plan={plan} isMutating={isMutating} onView={() => setViewPackage(plan)} onActivate={() => activatePackage(plan)} onDeactivate={() => confirmDeactivate(plan)} onShow={() => showPackage(plan)} onHide={() => confirmHide(plan)} onDelete={() => confirmDelete(plan)} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2"><StatusBadge status={plan.status} /><VisibilityBadge isVisible={plan.isVisible} /></div>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs"><Detail label="Monthly" value={formatCurrency(plan.priceMonthly, plan.currency)} /><Detail label="Yearly" value={plan.priceYearly == null ? "None" : formatCurrency(plan.priceYearly, plan.currency)} /><Detail label="Trial" value={plan.trialDays > 0 ? `${plan.trialDays} days` : "None"} /><Detail label="Products" value={plan.maxProducts} /></dl>
                    <div className="mt-4"><FeatureBadges plan={plan} /></div>
                  </article>
                ))}
              </div>
              <AdminTablePagination total={filteredPackages.length} page={page} rowsPerPage={rowsPerPage} onPageChange={setPage} onRowsPerPageChange={(value) => { setRowsPerPage(value); setPage(0); }} />
            </>
          )}
        </section>
      </div>

      {viewPackage && <ViewPackageModal plan={viewPackage} onClose={() => setViewPackage(null)} />}
      {confirmAction && <ConfirmModal action={confirmAction} isWorking={isMutating} onCancel={() => setConfirmAction(null)} />}
    </AdminPageFrame>
  );
}

function LoadingList() {
  return (
    <div className="divide-y divide-ink/10">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="h-4 w-40 rounded-full bg-ink/10" />
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <div className="h-10 rounded-lg bg-ink/8" />
            <div className="h-10 rounded-lg bg-ink/8" />
            <div className="h-10 rounded-lg bg-ink/8" />
            <div className="h-10 rounded-lg bg-ink/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureBadges({ plan }: { plan: AdminPackage }) {
  const features = enabledFeatures(plan);

  if (features.length === 0) {
    return <span className="text-xs font-bold text-ink/35">No enabled features</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {features.map((feature) => (
        <span key={feature.key} className="rounded-full border border-leaf/15 bg-mint px-2 py-1 text-[11px] font-extrabold text-leaf">
          {feature.label}
        </span>
      ))}
    </div>
  );
}

function PackageActions({
  plan,
  isMutating,
  onView,
  onActivate,
  onDeactivate,
  onShow,
  onHide,
  onDelete,
}: {
  plan: AdminPackage;
  isMutating: boolean;
  onView: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onShow: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  return (
    <AdminActionMenu
      label={`Actions for ${plan.name}`}
      items={[
        { label: "View details", icon: Eye, onClick: onView },
        { label: "Edit package", icon: Pencil, to: `/admin/packages/${plan.id}/edit` },
        plan.isVisible
          ? { label: "Hide from users", icon: EyeOff, onClick: onHide, disabled: isMutating, tone: "warning" }
          : { label: "Show to users", icon: Eye, onClick: onShow, disabled: isMutating || plan.status !== "ACTIVE", tone: "success" },
        plan.status === "ACTIVE"
          ? { label: "Deactivate", icon: PowerOff, onClick: onDeactivate, disabled: isMutating, tone: "warning" }
          : { label: "Activate", icon: Power, onClick: onActivate, disabled: isMutating, tone: "success" },
        { label: "Delete package", icon: Trash2, onClick: onDelete, disabled: isMutating, tone: "danger" },
      ]}
    />
  );
}

function ViewPackageModal({ plan, onClose }: { plan: AdminPackage; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-lg bg-white shadow-soft sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{plan.name}</h2>
              <StatusBadge status={plan.status} />
              <VisibilityBadge isVisible={plan.isVisible} />
            </div>
            <p className="mt-1 text-sm font-semibold text-ink/45">{plan.description || "No description"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink/10 px-3 py-2 text-xs font-extrabold text-ink/60 hover:bg-[#eef8f4]"
          >
            Close
          </button>
        </div>
        <dl className="grid gap-2 p-4 sm:grid-cols-3">
          <Detail label="Slug" value={plan.slug} />
          <Detail label="Monthly" value={formatCurrency(plan.priceMonthly, plan.currency)} />
          <Detail label="Yearly" value={plan.priceYearly == null ? "None" : formatCurrency(plan.priceYearly, plan.currency)} />
          <Detail label="Trial" value={plan.trialDays > 0 ? `${plan.trialDays} days` : "None"} />
          <Detail label="Currency" value={plan.currency} />
          <Detail label="Businesses" value={plan.maxBusinesses} />
          <Detail label="Users" value={plan.maxUsers} />
          <Detail label="Products" value={plan.maxProducts} />
          <Detail label="Sales / month" value={plan.maxSalesPerMonth} />
          <Detail label="Expenses / month" value={plan.maxExpensesPerMonth} />
          <Detail label="Sort order" value={plan.sortOrder} />
          <Detail label="Visible to users" value={plan.isVisible ? "Yes" : "No"} />
          <Detail label="Subscriptions" value={plan.subscriptionCount ?? 0} />
        </dl>
        <div className="border-t border-ink/10 p-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">Features</p>
          <FeatureBadges plan={plan} />
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({
  action,
  isWorking,
  onCancel,
}: {
  action: ConfirmAction;
  isWorking: boolean;
  onCancel: () => void;
}) {
  const confirmClasses =
    action.tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-amber-500 text-white hover:bg-amber-600";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 sm:items-center sm:justify-center">
      <div className="w-full rounded-lg bg-white p-4 shadow-soft sm:max-w-md">
        <h2 className="font-display text-lg font-bold text-ink">{action.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">{action.body}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#eef8f4] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={action.onConfirm}
            disabled={isWorking}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {isWorking && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
