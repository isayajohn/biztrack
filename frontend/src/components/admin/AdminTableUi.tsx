import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminPageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-[#dadad3] bg-white p-5 sm:p-7">{children}</div>
    </div>
  );
}

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f6f6f3] text-[#e60023]">
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#e60023]">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm font-semibold text-[#62625b]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function AdminFilterPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#dadad3] bg-white p-4 sm:p-5 ${className}`}>
      {children}
    </section>
  );
}

export function EntityAvatar({ value }: { value?: string }) {
  const parts = (value ?? "Record").trim().split(/\s+/).filter(Boolean);
  const label = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "R";

  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#dadad3] bg-[#f6f6f3] text-sm font-extrabold text-[#e60023]">
      {label}
    </span>
  );
}

export type AdminActionItem = {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  to?: string;
  disabled?: boolean;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function AdminActionMenu({ items, label = "Open actions" }: { items: AdminActionItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0, openUp: false });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
        openUp: window.innerHeight - rect.bottom < 260,
      });
    }
    setOpen((value) => !value);
  }

  const menu = open ? (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] cursor-default"
        aria-label="Close actions"
        onClick={() => setOpen(false)}
      />
      <div
        className="portal-popover fixed z-[71] w-56 rounded-2xl border border-[#e5e5e0] bg-white p-2"
        style={position.openUp ? { bottom: window.innerHeight - position.top + 44, right: position.right } : { top: position.top, right: position.right }}
        role="menu"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const tone =
            item.tone === "success"
              ? "text-[#0f7a4b] hover:bg-[#e0f8ed]"
              : item.tone === "warning"
                ? "text-amber-700 hover:bg-amber-50"
                : item.tone === "danger"
                  ? "text-[#e60023] hover:bg-red-50"
                  : "text-[#33332e] hover:bg-[#f6f6f3]";
          const classes = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tone}`;
          const content = <><Icon size={17} aria-hidden="true" /><span>{item.label}</span></>;

          if (item.to && !item.disabled) {
            return <Link key={item.label} to={item.to} role="menuitem" className={classes} onClick={() => setOpen(false)}>{content}</Link>;
          }

          return (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={classes}
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="portal-icon-button inline-grid h-11 w-11 place-items-center rounded-2xl border border-[#dadad3] bg-white text-[#33332e] transition-colors hover:bg-[#f6f6f3]"
      >
        <MoreVertical size={19} aria-hidden="true" />
      </button>
      {typeof document !== "undefined" && menu ? createPortal(menu, document.body) : null}
    </>
  );
}

export function AdminTablePagination({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 25, 50],
}: {
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  rowsPerPageOptions?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / rowsPerPage));
  const current = Math.min(page, pages - 1);
  const first = total === 0 ? 0 : current * rowsPerPage + 1;
  const last = Math.min(total, (current + 1) * rowsPerPage);

  return (
    <div className="grid gap-4 border-t border-[#e5e5e0] px-5 py-4 text-sm font-semibold text-[#62625b] sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <p>Showing {first} to {last} of {total} results</p>
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous page"
          disabled={current === 0}
          onClick={() => onPageChange(current - 1)}
          className="grid h-10 w-10 place-items-center rounded-xl text-[#62625b] hover:bg-[#f6f6f3] disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="grid h-10 min-w-10 place-items-center rounded-xl bg-[#e60023] px-3 font-extrabold text-white">
          {current + 1}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={current >= pages - 1}
          onClick={() => onPageChange(current + 1)}
          className="grid h-10 w-10 place-items-center rounded-xl text-[#62625b] hover:bg-[#f6f6f3] disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <label className="flex items-center gap-3 sm:justify-self-end">
        <span>Rows per page</span>
        <select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          className="h-10 rounded-xl border border-[#dadad3] bg-white px-3 font-bold text-[#211922] outline-none focus:border-[#211922]"
        >
          {rowsPerPageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    </div>
  );
}
