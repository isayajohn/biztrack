import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Loader2,
  MoreVertical,
  Package,
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

function initials(value?: string) {
  const parts = (value ?? "Business").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "B";
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const classes =
    status === "ACTIVE"
      ? "border-[#b7ead7] bg-[#e0f8ed] text-[#0f7a4b]"
      : status === "SUSPENDED"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "TRIAL"
          ? "border-[#dadad3] bg-[#f6f6f3] text-[#62625b]"
          : status === "CANCELLED"
            ? "border-red-200 bg-red-50 text-[#9e0a0a]"
            : "border-[#dadad3] bg-white text-[#62625b]";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${classes}`}>
      {status === "ACTIVE" && <span className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />}
      {status.toLowerCase()}
    </span>
  );
}

function BillingBadge({ cycle }: { cycle: BillingCycle }) {
  return (
    <span className="inline-flex rounded-full bg-[#f6f6f3] px-3 py-1.5 text-xs font-bold uppercase text-[#211922]">
      {cycle}
    </span>
  );
}

function PageMessage({ type, text }: { type: "success" | "error"; text: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const classes = type === "success" ? "border-[#b7ead7] bg-[#e0f8ed] text-[#0f7a4b]" : "border-red-200 bg-red-50 text-[#9e0a0a]";

  return (
    <div className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>
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
    : "Billing Management";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-[#dadad3] bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f6f6f3] text-[#e60023]">
              <CreditCard size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              {isBusinessScoped && (
                <Link
                  to={`/admin/businesses/${routeBusinessId}`}
                  className="mb-3 inline-flex items-center gap-1.5 rounded-2xl border border-[#dadad3] bg-[#f6f6f3] px-3 py-2 text-xs font-bold text-[#62625b] transition-colors hover:bg-[#e5e5e0]"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  Business
                </Link>
              )}
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#e60023]">SUPER_ADMIN</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-ink">{title}</h1>
              <p className="mt-2 text-sm font-semibold text-ink/45">
                Manage business packages, billing cycles and subscription statuses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openAssignModal}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#e60023] px-5 text-sm font-bold text-white transition-colors hover:bg-[#cc001f]"
          >
            <CalendarPlus size={17} aria-hidden="true" />
            {isBusinessScoped ? "Assign or change" : "Add New Package"}
          </button>
        </div>

        <div className="mt-7 space-y-5">
          {message && <PageMessage type={message.type} text={message.text} />}

          <section className="rounded-2xl border border-[#dadad3] bg-white p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
              {!isBusinessScoped ? (
                <div className="relative">
                  <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#62625b]" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by business name or email..."
                    className="h-14 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] pl-12 pr-4 text-sm font-semibold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
                  />
                </div>
              ) : (
                <div className="flex h-14 items-center rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-bold text-[#62625b]">
                  Showing this business only
                </div>
              )}
              <FilterSelect value={packageFilter} onChange={setPackageFilter} label="All packages" icon={<Package size={18} />}>
                {packages.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect value={statusFilter} onChange={setStatusFilter} label="All statuses" icon={<CheckCircle2 size={18} />}>
                {subscriptionStatuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </FilterSelect>
              <FilterSelect value={billingFilter} onChange={setBillingFilter} label="All billing cycles" icon={<CalendarDays size={18} />}>
                {billingCycles.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </FilterSelect>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#dadad3] bg-white">
            {isLoading ? (
              <LoadingSubscriptions />
            ) : subscriptions.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-2 p-6 text-center">
                <CreditCard size={28} className="text-ink/25" aria-hidden="true" />
                <p className="text-sm font-semibold text-ink/45">No subscriptions found.</p>
              </div>
            ) : (
              <>
                <div className="hidden xl:block">
                  <table className="portal-data-table min-w-full text-left text-sm">
                    <thead className="border-b border-[#dadad3] bg-white text-xs font-extrabold uppercase tracking-[0.05em] text-[#62625b]">
                      <tr>
                        <th className="px-6 py-4">Business</th>
                        <th className="px-6 py-4">Package</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Billing cycle</th>
                        <th className="px-6 py-4">Starts at</th>
                        <th className="px-6 py-4">Ends at</th>
                        <th className="px-6 py-4">Trial ends at</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e0]">
                      {subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="align-middle transition-colors hover:bg-[#fbfbf9]">
                          <td className="px-6 py-6">
                            <div className="flex min-w-0 items-center gap-4">
                              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#dadad3] bg-[#f6f6f3] text-sm font-extrabold text-[#e60023]">
                                {initials(subscription.business.name)}
                              </span>
                              <div className="min-w-0">
                                <Link to={`/admin/businesses/${subscription.businessId}/subscription`} className="font-extrabold text-ink hover:text-[#e60023]">
                                  {subscription.business.name}
                                </Link>
                                <p className="mt-1 truncate text-sm font-semibold text-[#62625b]">{subscription.business.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <p className="font-extrabold capitalize text-ink">{subscription.package.name}</p>
                            <p className="mt-1 text-sm font-semibold text-[#62625b]">
                              {formatCurrency(subscription.package.priceMonthly, subscription.package.currency)}
                            </p>
                          </td>
                          <td className="px-6 py-6"><StatusBadge status={subscription.status} /></td>
                          <td className="px-6 py-6"><BillingBadge cycle={subscription.billingCycle} /></td>
                          <DateCell value={formatDate(subscription.startsAt)} icon={CalendarDays} />
                          <DateCell value={formatDate(subscription.endsAt)} />
                          <DateCell value={formatDate(subscription.trialEndsAt)} />
                          <td className="px-6 py-6">
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

                <div className="divide-y divide-[#e5e5e0] xl:hidden">
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
  icon,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#62625b]" aria-hidden="true">
        {icon}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full appearance-none rounded-2xl border border-[#dadad3] bg-[#fbfbf9] pl-12 pr-10 text-sm font-bold text-ink outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
      >
        <option value="">{label}</option>
        {children}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#62625b]" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

function LoadingSubscriptions() {
  return (
    <div className="divide-y divide-[#e5e5e0]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#f6f6f3]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-44 rounded-full bg-[#e5e5e0]" />
              <div className="mt-3 h-3 w-64 max-w-full rounded-full bg-[#f6f6f3]" />
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="h-10 rounded-2xl bg-[#f6f6f3]" />
            <div className="h-10 rounded-2xl bg-[#f6f6f3]" />
            <div className="h-10 rounded-2xl bg-[#f6f6f3]" />
            <div className="h-10 rounded-2xl bg-[#f6f6f3]" />
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
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#dadad3] bg-[#f6f6f3] text-sm font-extrabold text-[#e60023]">
            {initials(subscription.business.name)}
          </span>
          <div className="min-w-0">
            <Link to={`/admin/businesses/${subscription.businessId}/subscription`} className="font-display text-base font-bold text-ink hover:text-[#e60023]">
              {subscription.business.name}
            </Link>
            <p className="mt-1 truncate text-xs font-bold text-[#62625b]">{subscription.business.user.email}</p>
          </div>
        </div>
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

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoItem label="Package" value={subscription.package.name} />
        <InfoItem label="Status" value={subscription.status.toLowerCase()} badge={<StatusBadge status={subscription.status} />} />
        <InfoItem label="Billing" value={subscription.billingCycle} badge={<BillingBadge cycle={subscription.billingCycle} />} />
        <InfoItem label="Starts at" value={formatDate(subscription.startsAt)} />
        <InfoItem label="Ends at" value={formatDate(subscription.endsAt)} />
        <InfoItem label="Trial ends" value={formatDate(subscription.trialEndsAt)} />
        <InfoItem label="Monthly price" value={formatCurrency(subscription.package.priceMonthly, subscription.package.currency)} />
      </dl>
    </article>
  );
}

function DateCell({ value, icon: Icon = CalendarPlus }: { value: string; icon?: typeof CalendarPlus }) {
  return (
    <td className="px-6 py-6 font-semibold text-[#33332e]">
      <span className="inline-flex items-center gap-2">
        <Icon size={17} className="text-[#62625b]" aria-hidden="true" />
        {value}
      </span>
    </td>
  );
}

function InfoItem({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#f6f6f3] p-3">
      <dt className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#62625b]">{label}</dt>
      <dd className="mt-2 font-extrabold capitalize text-ink">{badge ?? value}</dd>
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
  subscription,
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
  const [open, setOpen] = useState(false);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className={`relative flex ${compact ? "shrink-0 justify-end" : "justify-end"}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isSaving}
        className="grid h-11 w-11 place-items-center rounded-full border border-[#dadad3] bg-white text-[#62625b] transition-colors hover:bg-[#f6f6f3] hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Subscription actions for ${subscription.business.name}`}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </button>

      {open && (
        <div className="portal-popover absolute right-0 top-12 z-30 w-56 rounded-[24px] border border-[#dadad3] bg-white p-2">
          <ActionMenuItem icon={Pencil} label="Change" onClick={() => run(onChangePackage)} />
          <ActionMenuItem icon={PlayCircle} label="Activate" tone="success" onClick={() => run(onActivate)} />
          <ActionMenuItem icon={PauseCircle} label="Suspend" tone="warning" onClick={() => run(onSuspend)} />
          <ActionMenuItem icon={XCircle} label="Cancel" tone="danger" onClick={() => run(onCancel)} />
          <div className="my-2 border-t border-[#e5e5e0]" />
          <label className="block px-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#62625b]">
            Extend until
          </label>
          <input
            type="date"
            value={extendDate}
            onChange={(event) => onExtendDateChange(event.target.value)}
            className="mt-2 h-10 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-3 text-sm font-semibold text-ink outline-none focus:border-ink focus:ring-2 focus:ring-[#435ee5]"
          />
          <button
            type="button"
            onClick={() => run(onExtend)}
            disabled={isSaving}
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-[#f6f6f3] px-3 text-sm font-bold text-ink transition-colors hover:bg-[#e5e5e0] disabled:opacity-60"
          >
            <CalendarPlus size={15} aria-hidden="true" />
            Extend
          </button>
        </div>
      )}
    </div>
  );
}

function ActionMenuItem({
  icon: Icon,
  label,
  tone = "default",
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  tone?: "default" | "success" | "warning" | "danger";
  onClick: () => void;
}) {
  const toneClasses =
    tone === "success"
      ? "text-[#0f7a4b] hover:bg-[#e0f8ed]"
      : tone === "warning"
        ? "text-amber-700 hover:bg-amber-50"
        : tone === "danger"
          ? "text-[#9e0a0a] hover:bg-red-50"
          : "text-ink hover:bg-[#f6f6f3]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-bold transition-colors ${toneClasses}`}
    >
      <Icon size={17} aria-hidden="true" />
      {label}
    </button>
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
    <div className="fixed inset-0 z-50 flex items-end bg-ink/50 p-3 sm:items-center sm:justify-center">
      <form onSubmit={onSubmit} className="portal-modal max-h-[92vh] w-full overflow-y-auto rounded-[32px] bg-white sm:max-w-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#e5e5e0] p-5">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">
              {editingSubscription ? editingSubscription.business.name : "Choose a package and subscription terms."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f6f6f3] text-[#62625b] hover:bg-[#e5e5e0] hover:text-ink"
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {!isBusinessScoped && mode === "assign" && (
            <label className="sm:col-span-2 text-sm font-bold text-[#62625b]">
              Business
              <select
                value={form.businessId}
                onChange={(event) => update("businessId", event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
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

          <label className="sm:col-span-2 text-sm font-bold text-[#62625b]">
            Package
            <select
              value={form.packageId}
              onChange={(event) => update("packageId", event.target.value)}
              required
              className="mt-2 h-12 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
            >
              <option value="">Choose package</option>
              {packages.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatCurrency(plan.priceMonthly, plan.currency)}
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
          <label className="sm:col-span-2 text-sm font-bold text-[#62625b]">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e5e5e0] p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 rounded-2xl bg-[#e5e5e0] px-4 text-sm font-extrabold text-ink hover:bg-[#c8c8c1] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !form.businessId || !form.packageId}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#e60023] px-4 text-sm font-bold text-white transition-colors hover:bg-[#cc001f] disabled:cursor-not-allowed disabled:opacity-60"
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
    <label className="text-sm font-bold text-[#62625b]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
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
    <label className="text-sm font-bold text-[#62625b]">
      {label}
      <input
        type="date"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-[#dadad3] bg-[#fbfbf9] px-4 text-sm font-semibold text-ink outline-none focus:border-ink focus:bg-white focus:ring-2 focus:ring-[#435ee5]"
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
      ? "bg-[#9e0a0a] text-white hover:bg-[#cc001f]"
      : "bg-amber-500 text-white hover:bg-amber-600";

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/45 p-3 sm:items-center sm:justify-center">
      <div className="portal-modal w-full rounded-[32px] bg-white p-5 sm:max-w-md">
        <h2 className="font-display text-xl font-bold text-ink">{action.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-ink/55">{action.body}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className="h-11 rounded-2xl bg-[#e5e5e0] px-4 text-sm font-extrabold text-ink hover:bg-[#c8c8c1] disabled:opacity-60"
          >
            Keep subscription
          </button>
          <button
            type="button"
            onClick={action.onConfirm}
            disabled={isWorking}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
          >
            {isWorking && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
