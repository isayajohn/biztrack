import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfitColor = "positive" | "negative";

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  loading?: boolean;
  profitColor?: ProfitColor;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonStatCard() {
  return (
    <div className="animate-pulse rounded-xl border border-ink/10 bg-white p-3.5 shadow-sm">
      <div className="mb-3 h-9 w-9 rounded-lg bg-ink/8" />
      <div className="mb-2 h-2.5 w-14 rounded-full bg-ink/8" />
      <div className="h-6 w-20 rounded-full bg-ink/8" />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  loading = false,
  profitColor,
}: StatCardProps) {
  if (loading) return <SkeletonStatCard />;

  const isPositive = profitColor === "positive";
  const isNegative = profitColor === "negative";
  const isProfit = profitColor !== undefined;

  return (
    <article
      className={[
        "rounded-xl border p-3.5 shadow-sm transition-shadow hover:shadow-md",
        isPositive
          ? "border-leaf/20 bg-gradient-to-br from-white to-mint/50"
          : isNegative
            ? "border-clay/20 bg-gradient-to-br from-white to-orange-50/60"
            : "border-ink/10 bg-white",
      ].join(" ")}
    >
      <span
        className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${iconClass}`}
        aria-hidden="true"
      >
        <Icon size={17} />
      </span>
      <p className="text-xs font-semibold text-ink/50">{label}</p>
      <p
        className={[
          "mt-0.5 text-xl font-extrabold tracking-tight",
          isPositive ? "text-leaf" : isNegative ? "text-clay" : "text-ink",
        ].join(" ")}
        aria-label={isProfit ? `${label}: ${value}` : undefined}
      >
        {value}
      </p>
    </article>
  );
}
