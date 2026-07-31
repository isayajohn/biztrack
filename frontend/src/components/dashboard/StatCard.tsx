import type { LucideIcon } from "lucide-react";
import { AnimatedIcon, MotionPanel } from "../animate-ui/MotionPrimitives";

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
    <MotionPanel className="bento-card animate-pulse rounded-xl p-3.5">
      <div className="mb-3 h-9 w-9 rounded-lg bg-ink/8" />
      <div className="mb-2 h-2.5 w-14 rounded-full bg-ink/8" />
      <div className="h-6 w-20 rounded-full bg-ink/8" />
    </MotionPanel>
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
    <MotionPanel
      className={[
        "rounded-xl p-3.5 transition-all",
        isPositive
          ? "bento-card border-leaf/20 bg-gradient-to-br from-white/90 to-mint/55"
          : isNegative
            ? "bento-card border-clay/20 bg-gradient-to-br from-white/90 to-orange-50/65"
            : "bento-card",
      ].join(" ")}
    >
      <span
        className={`mb-3 grid h-9 w-9 place-items-center rounded-lg ${iconClass}`}
        aria-hidden="true"
      >
        <AnimatedIcon icon={Icon} size={17} />
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
    </MotionPanel>
  );
}
