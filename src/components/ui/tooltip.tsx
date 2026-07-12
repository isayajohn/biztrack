import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: ReactNode }) {
  return <span className="group/tooltip relative flex">{children}</span>;
}

export function TooltipTrigger({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("flex", className)} {...props}>
      {children}
    </span>
  );
}

export function TooltipContent({ children, className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-ink/10 bg-ink px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
