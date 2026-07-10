import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { getApiErrorMessage, isPaymentProviderError } from "../services/apiClient";
import { getPublicPackages, type PublicPackage } from "../services/landingApi";
import {
  createSubscriptionCheckout,
  getBusinessSubscription,
  type BillingCycle,
  type BusinessSubscriptionOverview,
} from "../services/subscriptionApi";
import { formatCurrency } from "../utils/format";

type Message = { type: "success" | "error"; text: string };

const featureLabels: Array<{ key: keyof PublicPackage["features"]; label: string }> = [
  { key: "allowReports", label: "Reports" },
  { key: "allowPdfExport", label: "PDF export" },
  { key: "allowCsvExport", label: "CSV export" },
  { key: "allowInventoryAlerts", label: "Inventory alerts" },
  { key: "allowAiInsights", label: "AI insights" },
];

function daysUntil(date?: string | null) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function formatDate(date?: string | null) {
  if (!date) return "None";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function priceFor(plan: PublicPackage, cycle: BillingCycle) {
  const amount = cycle === "YEARLY" && plan.priceYearly != null ? plan.priceYearly : plan.priceMonthly;
  const suffix = cycle === "YEARLY" ? "/yr" : "/mo";
  return amount === 0 ? "Free" : `${formatCurrency(amount, plan.currency)}${suffix}`;
}

function planFeatures(plan: PublicPackage) {
  const enabled = featureLabels
    .filter((feature) => plan.features[feature.key])
    .map((feature) => feature.label);
  return [
    `Up to ${plan.limits.maxProducts} products`,
    `${plan.limits.maxSalesPerMonth} sales/month`,
    `${plan.limits.maxExpensesPerMonth} expenses/month`,
    ...enabled,
  ];
}

function PageMessage({ message }: { message: Message }) {
  const Icon = message.type === "success" ? CheckCircle2 : AlertCircle;
  const classes =
    message.type === "success"
      ? "border-leaf/20 bg-mint text-leaf"
      : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message.text}</span>
    </div>
  );
}

export default function SubscriptionPage() {
  const [searchParams] = useSearchParams();
  const [overview, setOverview] = useState<BusinessSubscriptionOverview | null>(null);
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder || a.priceMonthly - b.priceMonthly),
    [packages],
  );
  const selectedPackage = sortedPackages.find((plan) => plan.id === selectedPackageId) ?? sortedPackages[0];
  const subscription = overview?.subscription ?? null;
  const trialDaysLeft = daysUntil(subscription?.trialEndsAt);
  const pendingPayments = overview?.payments.filter((payment) => payment.status === "PENDING") ?? [];

  async function loadData({ clearMessage = true } = {}) {
    setIsLoading(true);
    if (clearMessage) setMessage(null);

    try {
      const [nextOverview, plans] = await Promise.all([
        getBusinessSubscription(),
        getPublicPackages(),
      ]);
      setOverview(nextOverview);
      setPackages(plans);
      setSelectedPackageId((current) => {
        if (current && plans.some((plan) => plan.id === current)) return current;
        return nextOverview.subscription?.packageId ?? plans[0]?.id ?? "";
      });
    } catch (error) {
      const text = isPaymentProviderError(error)
        ? `${getApiErrorMessage(error)} The payment attempt has been recorded for admin review.`
        : getApiErrorMessage(error);
      setMessage({ type: "error", text });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment) {
      setMessage({
        type: "success",
        text: "Payment submitted. Your subscription will update after AzamPay confirms it.",
      });
    }
    loadData({ clearMessage: !payment });
  }, []);

  async function handleCheckout() {
    if (!selectedPackage) return;
    setIsCheckingOut(true);
    setMessage(null);

    try {
      const result = await createSubscriptionCheckout({
        packageId: selectedPackage.id,
        billingCycle,
      });

      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      setMessage({ type: "success", text: "Subscription updated." });
      await loadData({ clearMessage: false });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">Billing</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Subscription</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Manage your trial, package, and AzamPay subscription payments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {message && <PageMessage message={message} />}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-ink/10 bg-white">
            <Loader2 size={24} className="animate-spin text-leaf" aria-hidden="true" />
          </div>
        ) : (
          <>
            <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">
                      Current package
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-ink">
                      {subscription?.package.name ?? "No package"}
                    </h2>
                    <p className="mt-1 text-sm font-bold text-ink/50">
                      {subscription?.status ?? "Not active"}
                    </p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-mint text-leaf">
                    <ShieldCheck size={21} aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <StatusTile label="Trial ends" value={formatDate(subscription?.trialEndsAt)} />
                  <StatusTile label="Renews/expires" value={formatDate(subscription?.endsAt)} />
                  <StatusTile
                    label="Trial left"
                    value={trialDaysLeft == null ? "None" : `${trialDaysLeft} days`}
                  />
                </div>

                {pendingPayments.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    {pendingPayments.length} payment pending confirmation from AzamPay.
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">Choose billing</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/45">
                      Select a package and continue to AzamPay checkout.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 rounded-lg border border-ink/10 bg-[#f7faf9] p-1">
                    {(["MONTHLY", "YEARLY"] as BillingCycle[]).map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        className={[
                          "rounded-md px-3 py-2 text-xs font-black",
                          billingCycle === cycle ? "bg-white text-leaf shadow-sm" : "text-ink/45",
                        ].join(" ")}
                      >
                        {cycle === "MONTHLY" ? "Monthly" : "Yearly"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sortedPackages.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPackageId(plan.id)}
                      className={[
                        "min-h-48 rounded-lg border p-4 text-left transition-colors",
                        selectedPackage?.id === plan.id
                          ? "border-leaf bg-mint/50"
                          : "border-ink/10 bg-white hover:border-leaf/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-ink">{plan.name}</h3>
                          <p className="mt-1 text-sm font-bold text-leaf">
                            {priceFor(plan, billingCycle)}
                          </p>
                        </div>
                        {subscription?.packageId === plan.id && (
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black text-leaf">
                            Current
                          </span>
                        )}
                      </div>
                      <ul className="mt-4 space-y-2">
                        {planFeatures(plan).slice(0, 5).map((feature) => (
                          <li key={feature} className="flex gap-2 text-xs font-semibold text-ink/60">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={!selectedPackage || isCheckingOut}
                  onClick={handleCheckout}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto"
                >
                  {isCheckingOut ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <CreditCard size={16} aria-hidden="true" />
                  )}
                  Continue to AzamPay
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
              <div className="border-b border-ink/10 px-4 py-3">
                <h2 className="font-display text-base font-bold text-ink">Recent payments</h2>
              </div>
              {overview?.payments.length ? (
                <div className="divide-y divide-ink/10">
                  {overview.payments.map((payment) => (
                    <div key={payment.id} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-5 sm:items-center">
                      <span className="font-extrabold text-ink">{payment.package.name}</span>
                      <span className="font-bold text-ink/55">{formatCurrency(payment.amount, payment.currency)}</span>
                      <span className="font-bold text-ink/55">{payment.billingCycle}</span>
                      <span className="font-black text-leaf">{payment.status}</span>
                      <span className="truncate font-mono text-xs text-ink/40 sm:text-right">{payment.externalId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-sm font-semibold text-ink/45">No payments yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f7faf9] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-ink/35">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-ink">{value}</p>
    </div>
  );
}
