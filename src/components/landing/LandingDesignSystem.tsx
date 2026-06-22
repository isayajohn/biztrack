import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AnimatedIcon,
  MotionButtonSurface,
  MotionItem,
  MotionList,
  MotionPanel,
} from "../animate-ui/MotionPrimitives";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonBaseProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  className?: string;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

function buttonContent(children: ReactNode, icon?: ReactNode) {
  return (
    <>
      <span>{children}</span>
      {icon}
    </>
  );
}

function ButtonBase({ children, to, href, className, icon, type = "button", ...props }: ButtonBaseProps) {
  const classes = cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-leaf/15 disabled:pointer-events-none disabled:opacity-60",
    className,
  );

  if (to) {
    return (
      <MotionButtonSurface>
        <Link to={to} className={classes} onClick={props.onClick}>
          {buttonContent(children, icon)}
        </Link>
      </MotionButtonSurface>
    );
  }

  if (href) {
    return (
      <MotionButtonSurface>
        <a href={href} className={classes} onClick={props.onClick}>
          {buttonContent(children, icon)}
        </a>
      </MotionButtonSurface>
    );
  }

  return (
    <MotionButtonSurface>
      <button type={type} className={classes} disabled={props.disabled} onClick={props.onClick}>
        {buttonContent(children, icon)}
      </button>
    </MotionButtonSurface>
  );
}

export function PrimaryButton(props: ButtonBaseProps) {
  return (
    <ButtonBase
      {...props}
      className={cx(
        "bg-leaf text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-card",
        props.className,
      )}
    />
  );
}

export function SecondaryButton(props: ButtonBaseProps) {
  return (
    <ButtonBase
      {...props}
      className={cx(
        "border border-slate-200 bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-cloud",
        props.className,
      )}
    />
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  id?: string;
};

export function SectionHeader({ eyebrow, title, description, align = "left", id }: SectionHeaderProps) {
  return (
    <MotionPanel className={cx("mb-10 max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && (
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-leaf">
          {eyebrow}
        </p>
      )}
      <h2 id={id} className="mt-3 font-display text-3xl font-extrabold tracking-normal text-ink sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-7 text-slateMuted">{description}</p>}
    </MotionPanel>
  );
}

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  imageUrl?: string;
};

export function FeatureCard({ icon: Icon, title, description, imageUrl }: FeatureCardProps) {
  return (
    <MotionPanel className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-card">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="mb-4 h-32 w-full rounded-lg object-cover ring-1 ring-slate-200" />
      ) : (
        <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-mint text-leaf ring-1 ring-emerald-100">
          <AnimatedIcon icon={Icon} size={22} />
        </span>
      )}
      <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2.5 text-sm leading-6 text-slateMuted">{description}</p>
    </MotionPanel>
  );
}

type PricingCardProps = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  to: string;
  highlighted?: boolean;
  badge?: string;
};

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  to,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <MotionPanel
      className={cx(
        "relative flex h-full flex-col rounded-xl border bg-white p-7 shadow-sm transition-all duration-200 hover:shadow-card",
        highlighted ? "border-leaf ring-1 ring-leaf/15" : "border-slate-200",
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-6 rounded-full bg-leaf px-3 py-1 text-xs font-extrabold text-white shadow-sm">
          {badge}
        </span>
      )}
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.08em] text-slateMuted">{name}</p>
        <div className="mt-4 flex items-end gap-1.5">
          <span className="font-display text-4xl font-extrabold text-ink">{price}</span>
          <span className="mb-1.5 text-sm font-semibold text-slateMuted">/{period}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-slateMuted">{description}</p>
      </div>
      <MotionList className="mt-6 flex flex-1 flex-col gap-3">
        {features.map((feature) => (
          <MotionItem key={feature} className="flex items-start gap-2.5 text-sm font-semibold text-slate-700">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-leaf" aria-hidden="true" />
            <span>{feature}</span>
          </MotionItem>
        ))}
      </MotionList>
      {highlighted ? (
        <PrimaryButton to={to} className="mt-7 w-full">
          {cta}
        </PrimaryButton>
      ) : (
        <SecondaryButton to={to} className="mt-7 w-full">
          {cta}
        </SecondaryButton>
      )}
    </MotionPanel>
  );
}

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
};

export function StatCard({ icon: Icon, label, value, change }: StatCardProps) {
  return (
    <MotionPanel className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-mint text-leaf ring-1 ring-emerald-100">
        <AnimatedIcon icon={Icon} size={18} />
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slateMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
      {change && <p className="mt-1 text-xs font-bold text-leaf">{change}</p>}
    </MotionPanel>
  );
}
