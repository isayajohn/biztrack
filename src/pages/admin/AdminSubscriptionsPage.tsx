import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Loader2,
  PauseCircle,
  Pencil,
  PlayCircle,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  assignAdminSubscription,
  changeBusinessPackage,
  extendAdminSubscription,
  getAdminBusinesses,
  getAdminBusiness,
  getAdminPackages,
  getAdminSubscriptions,
  updateAdminSubscriptionStatus,
} from "../../services/adminApi";
import type {
  AdminBusiness,
  AdminPackage,
  AdminSubscription,
  BillingCycle,
  SubscriptionStatus,
} from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";
import { formatCurrency } from "../../utils/format";

type SubscriptionFormState = {
  businessId: string;
  packageId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startsAt: string;
  endsAt: string;
  trialEndsAt: string;
  notes: string;
};

type ModalMode = "assign" | "change";

type ConfirmAction = {
  title: string;
  body: string;
  confirmLabel: string;
  tone: "danger" | "warning";
  onConfirm: () => Promise<void>;
};

const subscriptionStatuses: SubscriptionStatus[] = ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED", "EXPIRED"];
const billingCycles: BillingCycle[] = ["MONTHLY", "YEARLY", "LIFETIME", "MANUAL"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(businessId = ""): SubscriptionFormState {
  return {
    businessId,
    packageId: "",
    status: "ACTIVE",
    billingCycle: "MONTHLY",
    startsAt: today(),
    endsAt: "",
    trialEndsAt: "",
    notes: "",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Open ended";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Open ended";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const classes =
    status === "ACTIVE"
      ? "border-leaf/20 bg-mint text-leaf"
      : status === "SUSPENDED"
        ? "border-clay/20 bg-orange-50 text-clay"
        : status === "TRIAL"
          ? "border-sky-200 bg-sky-50 text-sky-700"
          : status === "CANCELLED"
            ? "border-ink/10 bg-[#f4f0e8] text-ink/55"
            : "border-red-200 bg-red-50 text-red-600";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${classes}`}>{status}</span>;
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

export default function AdminSubscriptionsPage() {
  const { businessId: routeBusinessId } = useParams();
  const isBusinessScoped = Boolean(routeBusinessId);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [search, setSearch] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [billingFilter, setBillingFilter] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<AdminSubscription | null>(null);
  const [form, setForm] = useState<SubscriptionFormState>(emptyForm(routeBusinessId));
  const [extendDates, setExtendDates] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const activePackages = useMemo(() => packages.filter((plan) => plan.status === "ACTIVE"), [packages]);

  async function loadData({ clearMessage = false } = {}) {
    setIsLoading(true);
    if (clearMessage) setMessage(null);

    try {
      const [subscriptionResult, packageItems, businessItems] = await Promise.all([
        getAdminSubscriptions({
          search: isBusinessScoped ? undefined : search || undefined,
          businessId: routeBusinessId,
          packageId: packageFilter || undefined,
          status: statusFilter ? (statusFilter as SubscriptionStatus) : undefined,
          billingCycle: billingFilter ? (billingFilter as BillingCycle) : undefined,
          limit: 100,
        }),
        getAdminPackages(),
        isBusinessScoped ? Promise.resolve([]) : getAdminBusinesses(),
      ]);

      setSubscriptions(subscriptionResult.items);
      setPackages(packageItems);
      setBusinesses(businessItems);

      if (!form.packageId) {
        const firstActive = packageItems.find((plan) => plan.status === "ACTIVE");
        if (firstActive) setForm((current) => ({ ...current, packageId: firstActive.id }));
      }

      if (!isBusinessScoped && !form.businessId && businessItems[0]) {
        setForm((current) => ({ ...current, businessId: businessItems[0].id }));
      }
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    if (!routeBusinessId) {
      setBusinessName("");
      return;
    }

    getAdminBusiness(routeBusinessId)
      .then((business) => {
        if (alive) setBusinessName(business.name);
      })
      .catch((error) => {
        if (alive) setMessage({ type: "error", text: getApiErrorMessage(error) });
      });

    return () => {
      alive = false;
    };
  }, [routeBusinessId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [routeBusinessId, search, packageFilter, statusFilter, billingFilter]);

  function openAssignModal() {
    setEditingSubscription(null);
    setForm((current) => ({
      ...emptyForm(routeBusinessId ?? current.businessId),
      packageId: current.packageId || activePackages[0]?.id || "",
    }));
    setModalMode("assign");
  }

  function openChangeModal(subscription: AdminSubscription) {
    setEditingSubscription(subscription);
    setForm({
      businessId: subscription.businessId,
      packageId: subscription.packageId,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      startsAt: subscription.startsAt.slice(0, 10),
      endsAt: subscription.endsAt?.slice(0, 10) ?? "",
      trialEndsAt: subscription.trialEndsAt?.slice(0, 10) ?? "",
      notes: subscription.notes ?? "",
    });
    setModalMode("change");
  }

  async function submitPackageAssignment(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const payload = {
        packageId: form.packageId,
        status: form.status,
        billingCycle: form.billingCycle,
        startsAt: form.startsAt,
        endsAt: form.endsAt || null,
        trialEndsAt: form.trialEndsAt || null,
        notes: form.notes.trim() || null,
      };

      if (modalMode === "change" || isBusinessScoped) {
        await changeBusinessPackage(form.businessId, payload);
        setMessage({ type: "success", text: "Business package changed." });
      } else {
        await assignAdminSubscription({ businessId: form.businessId, ...payload });
        setMessage({ type: "success", text: "Subscription assigned." });
      }

      setModalMode(null);
      setEditingSubscription(null);
      await loadData();
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function changeStatus(subscription: AdminSubscription, nextStatus: SubscriptionStatus) {
    setIsSaving(true);
    setMessage(null);
    try {
      await updateAdminSubscriptionStatus(subscription.id, nextStatus);
      await loadData();
      setMessage({ type: "success", text: `Subscription marked ${nextStatus}.` });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
      setConfirmAction(null);
    }
  }

  function confirmStatus(subscription: AdminSubscription, nextStatus: "SUSPENDED" | "CANCELLED") {
    setConfirmAction({
      title: `${nextStatus === "SUSPENDED" ? "Suspend" : "Cancel"} subscription?`,
      body: `${subscription.business.name} will lose access to restricted package actions until a subscription is active again.`,
      confirmLabel: nextStatus === "SUSPENDED" ? "Suspend" : "Cancel subscription",
      tone: nextStatus === "SUSPENDED" ? "warning" : "danger",
      onConfirm: () => changeStatus(subscription, nextStatus),
    });
  }

  async function extend(subscription: AdminSubscription) {
    const endsAt = extendDates[subscription.id];
    if (!endsAt) {
      setMessage({ type: "error", text: "Choose an extension date first." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      await extendAdminSubscription(subscription.id, { endsAt });
      setExtendDates((current) => ({ ...current, [subscription.id]: "" }));
      await loadData();
      setMessage({ type: "success", text: "Subscription extended." });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
    }
  }

  const title = isBusinessScoped
    ? `${businessName || "Business"} subscription`
    : "Business subscriptions";

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {isBusinessScoped && (
            <Link
              to={`/admin/businesses/${routeBusinessId}`}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-white px-3 py-2 text-xs font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8]"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Business
            </Link>
          )}
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Assign packages, change plans, and control subscription state.
          </p>
        </div>
        <button
          type="button"
          onClick={openAssignModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90"
        >
          <CalendarPlus size={17} aria-hidden="true" />
          {isBusinessScoped ? "Assign or change" : "Assign package"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {message && <PageMessage type={message.type} text={message.text} />}

        <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-ink/10 p-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            {!isBusinessScoped ? (
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by business name..."
                  className="w-full rounded-lg border border-ink/15 bg-[#fbfaf6] py-2.5 pl-9 pr-3 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                />
              </div>
            ) : (
              <div className="rounded-lg bg-[#fbfaf6] px-3 py-2.5 text-sm font-bold text-ink/60">
                Showing this business only
              </div>
            )}
            <FilterSelect value={packageFilter} onChange={setPackageFilter} label="All packages">
              {packages.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All statuses">
              {subscriptionStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={billingFilter} onChange={setBillingFilter} label="All billing cycles">
              {billingCycles.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </FilterSelect>
          </div>

          {isLoading ? (
            <LoadingSubscriptions />
          ) : subscriptions.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
              <CreditCard size={28} className="text-ink/25" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink/45">No subscriptions found.</p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="min-w-full divide-y divide-ink/10 text-left text-sm">
                  <thead className="bg-[#fbfaf6] text-xs font-extrabold uppercase tracking-[0.05em] text-ink/45">
                    <tr>
                      <th className="px-4 py-3">Business name</th>
                      <th className="px-4 py-3">Owner email</th>
                      <th className="px-4 py-3">Package</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Billing cycle</th>
                      <th className="px-4 py-3">Starts at</th>
                      <th className="px-4 py-3">Ends at</th>
                      <th className="px-4 py-3">Trial ends at</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id} className="align-top">
                        <td className="px-4 py-4">
                          <Link to={`/admin/businesses/${subscription.businessId}/subscription`} className="font-extrabold text-ink hover:text-leaf">
                            {subscription.business.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 font-semibold text-ink/55">{subscription.business.user.email}</td>
                        <td className="px-4 py-4">
                          <p className="font-extrabold text-ink">{subscription.package.name}</p>
                          <p className="mt-1 text-xs font-bold text-ink/35">
                            {formatCurrency(subscription.package.priceMonthly, subscription.package.currency)}
                          </p>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={subscription.status} /></td>
                        <td className="px-4 py-4 font-bold text-ink/60">{subscription.billingCycle}</td>
                        <td className="px-4 py-4 font-bold text-ink/60">{formatDate(subscription.startsAt)}</td>
                        <td className="px-4 py-4 font-bold text-ink/60">{formatDate(subscription.endsAt)}</td>
                        <td className="px-4 py-4 font-bold text-ink/60">{formatDate(subscription.trialEndsAt)}</td>
                        <td className="px-4 py-4">
                          <SubscriptionActions
                            subscription={subscription}
                            isSaving={isSaving}
                            extendDate={extendDates[subscription.id] ?? ""}
                            onExtendDateChange={(value) => setExtendDates((current) => ({ ...current, [subscription.id]: value }))}
                            onExtend={() => extend(subscription)}
                            onChangePackage={() => openChangeModal(subscription)}
                            onActivate={() => changeStatus(subscription, "ACTIVE")}
                            onSuspend={() => confirmStatus(subscription, "SUSPENDED")}
                            onCancel={() => confirmStatus(subscription, "CANCELLED")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-ink/10 xl:hidden">
                {subscriptions.map((subscription) => (
                  <SubscriptionCard
                    key={subscription.id}
                    subscription={subscription}
                    isSaving={isSaving}
                    extendDate={extendDates[subscription.id] ?? ""}
                    onExtendDateChange={(value) => setExtendDates((current) => ({ ...current, [subscription.id]: value }))}
                    onExtend={() => extend(subscription)}
                    onChangePackage={() => openChangeModal(subscription)}
                    onActivate={() => changeStatus(subscription, "ACTIVE")}
                    onSuspend={() => confirmStatus(subscription, "SUSPENDED")}
                    onCancel={() => confirmStatus(subscription, "CANCELLED")}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {modalMode && (
        <AssignPackageModal
          mode={modalMode}
          isBusinessScoped={isBusinessScoped}
          businesses={businesses}
          packages={activePackages}
          form={form}
          isSaving={isSaving}
          editingSubscription={editingSubscription}
          onChange={(nextForm) => setForm(nextForm)}
          onClose={() => {
            setModalMode(null);
            setEditingSubscription(null);
          }}
          onSubmit={submitPackageAssignment}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          action={confirmAction}
          isWorking={isSaving}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
    >
      <option value="">{label}</option>
      {children}
    </select>
  );
}

function LoadingSubscriptions() {
  return (
    <div className="divide-y divide-ink/10">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse p-4">
          <div className="h-4 w-44 rounded-full bg-ink/10" />
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

function SubscriptionCard({
  subscription,
  isSaving,
  extendDate,
  onExtendDateChange,
  onExtend,
  onChangePackage,
  onActivate,
  onSuspend,
  onCancel,
}: SubscriptionActionProps & { subscription: AdminSubscription }) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/admin/businesses/${subscription.businessId}/subscription`} className="font-display text-base font-bold text-ink hover:text-leaf">
            {subscription.business.name}
          </Link>
          <p className="mt-1 truncate text-xs font-bold text-ink/40">{subscription.business.user.email}</p>
        </div>
        <StatusBadge status={subscription.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoItem label="Package" value={subscription.package.name} />
        <InfoItem label="Billing" value={subscription.billingCycle} />
        <InfoItem label="Starts at" value={formatDate(subscription.startsAt)} />
        <InfoItem label="Ends at" value={formatDate(subscription.endsAt)} />
        <InfoItem label="Trial ends" value={formatDate(subscription.trialEndsAt)} />
        <InfoItem label="Monthly price" value={formatCurrency(subscription.package.priceMonthly, subscription.package.currency)} />
      </dl>

      <div className="mt-4">
        <SubscriptionActions
          subscription={subscription}
          isSaving={isSaving}
          extendDate={extendDate}
          onExtendDateChange={onExtendDateChange}
          onExtend={onExtend}
          onChangePackage={onChangePackage}
          onActivate={onActivate}
          onSuspend={onSuspend}
          onCancel={onCancel}
          compact
        />
      </div>
    </article>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#fbfaf6] p-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink/35">{label}</dt>
      <dd className="mt-1 font-extrabold text-ink">{value}</dd>
    </div>
  );
}

type SubscriptionActionProps = {
  isSaving: boolean;
  extendDate: string;
  onExtendDateChange: (value: string) => void;
  onExtend: () => void;
  onChangePackage: () => void;
  onActivate: () => void;
  onSuspend: () => void;
  onCancel: () => void;
  compact?: boolean;
};

function SubscriptionActions({
  isSaving,
  extendDate,
  onExtendDateChange,
  onExtend,
  onChangePackage,
  onActivate,
  onSuspend,
  onCancel,
  compact = false,
}: SubscriptionActionProps & { subscription: AdminSubscription }) {
  const actionBase =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className={`flex flex-col gap-2 ${compact ? "" : "items-end"}`}>
      <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-end"}`}>
        <button type="button" onClick={onChangePackage} disabled={isSaving} className={`${actionBase} border-ink/10 text-ink/60 hover:bg-[#f4f0e8]`}>
          <Pencil size={14} aria-hidden="true" />
          Change
        </button>
        <button type="button" onClick={onActivate} disabled={isSaving} className={`${actionBase} border-leaf/20 bg-mint text-leaf hover:bg-leaf/10`}>
          <PlayCircle size={14} aria-hidden="true" />
          Activate
        </button>
        <button type="button" onClick={onSuspend} disabled={isSaving} className={`${actionBase} border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100`}>
          <PauseCircle size={14} aria-hidden="true" />
          Suspend
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={`${actionBase} border-red-200 bg-red-50 text-red-600 hover:bg-red-100`}>
          <XCircle size={14} aria-hidden="true" />
          Cancel
        </button>
      </div>
      <div className={`grid w-full gap-2 ${compact ? "" : "max-w-sm"} sm:grid-cols-[1fr_auto]`}>
        <input
          type="date"
          value={extendDate}
          onChange={(event) => onExtendDateChange(event.target.value)}
          className="rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        />
        <button
          type="button"
          onClick={onExtend}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-bold text-ink/60 transition-colors hover:bg-[#f4f0e8] disabled:opacity-60"
        >
          <CalendarPlus size={15} aria-hidden="true" />
          Extend
        </button>
      </div>
    </div>
  );
}

function AssignPackageModal({
  mode,
  isBusinessScoped,
  businesses,
  packages,
  form,
  isSaving,
  editingSubscription,
  onChange,
  onClose,
  onSubmit,
}: {
  mode: ModalMode;
  isBusinessScoped: boolean;
  businesses: AdminBusiness[];
  packages: AdminPackage[];
  form: SubscriptionFormState;
  isSaving: boolean;
  editingSubscription: AdminSubscription | null;
  onChange: (form: SubscriptionFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const title = mode === "change" ? "Change package" : "Assign package";

  function update<K extends keyof SubscriptionFormState>(key: K, value: SubscriptionFormState[K]) {
    onChange({ ...form, [key]: value });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 sm:items-center sm:justify-center">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full overflow-y-auto rounded-lg bg-white shadow-soft sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">
              {editingSubscription ? editingSubscription.business.name : "Choose a package and subscription terms."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink/10 p-2 text-ink/50 hover:bg-[#f4f0e8]"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {!isBusinessScoped && mode === "assign" && (
            <label className="sm:col-span-2 text-sm font-bold text-ink/65">
              Business
              <select
                value={form.businessId}
                onChange={(event) => update("businessId", event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
              >
                <option value="">Choose business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name} ({business.user.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="sm:col-span-2 text-sm font-bold text-ink/65">
            Package
            <select
              value={form.packageId}
              onChange={(event) => update("packageId", event.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            >
              <option value="">Choose package</option>
              {packages.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} · {formatCurrency(plan.priceMonthly, plan.currency)}
                </option>
              ))}
            </select>
          </label>

          <SelectField label="Status" value={form.status} onChange={(value) => update("status", value as SubscriptionStatus)}>
            {subscriptionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Billing cycle" value={form.billingCycle} onChange={(value) => update("billingCycle", value as BillingCycle)}>
            {billingCycles.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <DateField label="Starts at" value={form.startsAt} onChange={(value) => update("startsAt", value)} required />
          <DateField label="Ends at" value={form.endsAt} onChange={(value) => update("endsAt", value)} />
          <DateField label="Trial ends at" value={form.trialEndsAt} onChange={(value) => update("trialEndsAt", value)} />
          <label className="sm:col-span-2 text-sm font-bold text-ink/65">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#f4f0e8] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !form.businessId || !form.packageId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {mode === "change" ? "Change package" : "Assign package"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-bold text-ink/65">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
      >
        {children}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-bold text-ink/65">
      {label}
      <input
        type="date"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
      />
    </label>
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
            className="rounded-lg border border-ink/10 px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#f4f0e8] disabled:opacity-60"
          >
            Keep subscription
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
