import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  PackagePlus,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  deleteAdminPackage,
  getAdminPackages,
  updateAdminPackageStatus,
} from "../../services/adminApi";
import type { AdminPackage, PackageStatus } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";

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

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [packages],
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
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Package management</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Create plans, set limits, and control package availability.
          </p>
        </div>
        <Link
          to="/admin/packages/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <PackagePlus size={17} aria-hidden="true" />
          New package
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {message && <PageMessage type={message.type} text={message.text} />}

        <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/10 px-4 py-3">
            <h2 className="font-display text-base font-bold text-ink">Packages</h2>
          </div>

          {isLoading ? (
            <LoadingList />
          ) : sortedPackages.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
              <PackagePlus size={28} className="text-ink/25" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink/45">No packages have been created.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
                  <thead className="bg-[#f7faf9] text-xs font-extrabold uppercase tracking-[0.05em] text-ink/45">
                    <tr>
                      <th className="px-4 py-3">Package name</th>
                      <th className="px-4 py-3">Monthly price</th>
                      <th className="px-4 py-3">Yearly price</th>
                      <th className="px-4 py-3">Trial</th>
                      <th className="px-4 py-3">Currency</th>
                      <th className="px-4 py-3">Max products</th>
                      <th className="px-4 py-3">Max sales / month</th>
                      <th className="px-4 py-3">Max expenses / month</th>
                      <th className="px-4 py-3">Features</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {sortedPackages.map((plan) => (
                      <tr key={plan.id} className="align-top">
                        <td className="px-4 py-4">
                          <p className="font-extrabold text-ink">{plan.name}</p>
                          <p className="mt-1 text-xs font-semibold text-ink/40">{plan.slug}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-ink">{formatCurrency(plan.priceMonthly, plan.currency)}</td>
                        <td className="px-4 py-4 font-bold text-ink">
                          {plan.priceYearly == null ? "None" : formatCurrency(plan.priceYearly, plan.currency)}
                        </td>
                        <td className="px-4 py-4 font-bold text-ink/60">
                          {plan.trialDays > 0 ? `${plan.trialDays} days` : "None"}
                        </td>
                        <td className="px-4 py-4 font-bold text-ink/60">{plan.currency}</td>
                        <td className="px-4 py-4 font-bold text-ink">{plan.maxProducts}</td>
                        <td className="px-4 py-4 font-bold text-ink">{plan.maxSalesPerMonth}</td>
                        <td className="px-4 py-4 font-bold text-ink">{plan.maxExpensesPerMonth}</td>
                        <td className="max-w-48 px-4 py-4">
                          <FeatureBadges plan={plan} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={plan.status} />
                        </td>
                        <td className="px-4 py-4">
                          <PackageActions
                            plan={plan}
                            isMutating={isMutating}
                            onView={() => setViewPackage(plan)}
                            onActivate={() => activatePackage(plan)}
                            onDeactivate={() => confirmDeactivate(plan)}
                            onDelete={() => confirmDelete(plan)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-ink/10 lg:hidden">
                {sortedPackages.map((plan) => (
                  <article key={plan.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-bold text-ink">{plan.name}</h3>
                        <p className="mt-1 truncate text-xs font-bold text-ink/40">{plan.slug}</p>
                      </div>
                      <StatusBadge status={plan.status} />
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <Detail label="Monthly" value={formatCurrency(plan.priceMonthly, plan.currency)} />
                      <Detail
                        label="Yearly"
                        value={plan.priceYearly == null ? "None" : formatCurrency(plan.priceYearly, plan.currency)}
                      />
                      <Detail label="Trial" value={plan.trialDays > 0 ? `${plan.trialDays} days` : "None"} />
                      <Detail label="Currency" value={plan.currency} />
                      <Detail label="Products" value={plan.maxProducts} />
                      <Detail label="Sales / month" value={plan.maxSalesPerMonth} />
                      <Detail label="Expenses / month" value={plan.maxExpensesPerMonth} />
                    </dl>

                    <div className="mt-4">
                      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink/35">Features</p>
                      <FeatureBadges plan={plan} />
                    </div>

                    <div className="mt-4">
                      <PackageActions
                        plan={plan}
                        isMutating={isMutating}
                        onView={() => setViewPackage(plan)}
                        onActivate={() => activatePackage(plan)}
                        onDeactivate={() => confirmDeactivate(plan)}
                        onDelete={() => confirmDelete(plan)}
                        compact
                      />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {viewPackage && <ViewPackageModal plan={viewPackage} onClose={() => setViewPackage(null)} />}
      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          isWorking={isMutating}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
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
  onDelete,
  compact = false,
}: {
  plan: AdminPackage;
  isMutating: boolean;
  onView: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-end"}`}>
      <button type="button" onClick={onView} className={`${base} border-ink/10 text-ink/60 hover:bg-[#eef8f4]`}>
        <Eye size={14} aria-hidden="true" />
        View
      </button>
      <Link to={`/admin/packages/${plan.id}/edit`} className={`${base} border-ink/10 text-ink/60 hover:bg-[#eef8f4]`}>
        <Pencil size={14} aria-hidden="true" />
        Edit
      </Link>
      {plan.status === "ACTIVE" ? (
        <button
          type="button"
          onClick={onDeactivate}
          disabled={isMutating}
          className={`${base} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}
        >
          <PowerOff size={14} aria-hidden="true" />
          Deactivate
        </button>
      ) : (
        <button
          type="button"
          onClick={onActivate}
          disabled={isMutating}
          className={`${base} border-leaf/20 bg-mint text-leaf hover:bg-leaf/10`}
        >
          <Power size={14} aria-hidden="true" />
          Activate
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={isMutating}
        className={`${base} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}
      >
        <Trash2 size={14} aria-hidden="true" />
        Delete
      </button>
    </div>
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
