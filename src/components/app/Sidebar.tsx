import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import BrandLogo from "../BrandLogo";
import { AnimatedIcon } from "../animate-ui/MotionPrimitives";
import type { NavItem } from "../../constants/nav";
import { getDamagedStock, getUnreadCount } from "../../services/inventoryApi";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

type Props = {
  navItems: NavItem[];
  collapsed?: boolean;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

const sectionOrder = [
  "Overview",
  "Sales",
  "Purchasing & Expenses",
  "Inventory",
  "Reports",
  "Management",
  "Account",
];

const collapsibleSections = new Set(["Sales", "Purchasing & Expenses", "Inventory", "Reports", "Management"]);
const iconSize = 18;

function groupItems(items: NavItem[]) {
  return sectionOrder
    .map((section) => ({
      section,
      items: items.filter((item) => (item.section ?? "Overview") === section),
    }))
    .filter((group) => group.items.length > 0);
}

function isRouteActive(pathname: string, to: string) {
  return pathname === to || (to !== "/dashboard" && pathname.startsWith(`${to}/`));
}

function Badge({ value, tone = "emerald" }: { value?: number; tone?: "emerald" | "orange" }) {
  if (!value || value <= 0) return null;

  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none",
        tone === "orange" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700",
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pb-1 pt-3 text-[10px] font-extrabold uppercase tracking-widest text-ink/35">
      {children}
    </p>
  );
}

export default function Sidebar({
  navItems,
  collapsed = false,
  variant = "desktop",
  onNavigate,
}: Props) {
  const location = useLocation();
  const groups = useMemo(() => groupItems(navItems), [navItems]);
  const flatItems = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [damagedCount, setDamagedCount] = useState(0);
  const isDesktop = variant === "desktop";
  const isCollapsed = isDesktop && collapsed;

  useEffect(() => {
    let cancelled = false;
    const shouldLoadNotifications = navItems.some((item) => item.label === "Notifications");
    const shouldLoadDamagedStock = navItems.some((item) => item.label === "Damaged Stock");

    if (shouldLoadNotifications) {
      getUnreadCount()
        .then((count) => {
          if (!cancelled) setNotificationCount(count);
        })
        .catch(() => undefined);
    }

    if (shouldLoadDamagedStock) {
      getDamagedStock()
        .then((records) => {
          if (!cancelled) {
            setDamagedCount(records.filter((record) => record.status.toUpperCase() === "PENDING").length);
          }
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [navItems]);

  const badgeFor = (label: string) => {
    if (label === "Notifications") return <Badge value={notificationCount} />;
    if (label === "Damaged Stock") return <Badge value={damagedCount} tone="orange" />;
    return null;
  };

  const renderLink = (item: NavItem) => {
    const link = (
      <NavLink
        to={item.to}
        onClick={onNavigate}
        className={() => {
          const active = isRouteActive(location.pathname, item.to);
          return cn(
            "relative flex h-10 items-center rounded-lg text-sm font-semibold transition-colors duration-200",
            isCollapsed ? "w-10 justify-center px-0" : "gap-3 px-3",
            active
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
              : "text-ink/68 hover:bg-emerald-50/70 hover:text-ink",
          );
        }}
      >
        <AnimatedIcon icon={item.icon} size={iconSize} className="shrink-0" />
        {!isCollapsed && (
          <>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {badgeFor(item.label)}
          </>
        )}
        {isCollapsed && badgeFor(item.label) ? (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        ) : null}
      </NavLink>
    );

    if (!isCollapsed) return link;

    return (
      <Tooltip key={item.to}>
        <TooltipTrigger>{link}</TooltipTrigger>
        <TooltipContent>{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const content = (
    <TooltipProvider>
      <div className={cn("flex h-full flex-col bg-white", isCollapsed ? "w-20" : "w-60")}>
        <div className={cn("flex h-16 shrink-0 items-center border-b border-ink/10", isCollapsed ? "justify-center px-3" : "px-5")}>
          <BrandLogo className={cn("h-auto max-w-full", isCollapsed ? "w-9" : "w-36")} />
        </div>

        <nav className={cn("flex-1 overflow-y-auto py-4", isCollapsed ? "px-2" : "px-3")} aria-label="Sidebar navigation">
          {isCollapsed ? (
            <ul className="flex flex-col items-center gap-1" role="list">
              {flatItems.map((item) => (
                <li key={item.to}>{renderLink(item)}</li>
              ))}
            </ul>
          ) : (
            groups.map(({ section, items }) => {
              const hasActiveItem = items.some((item) => isRouteActive(location.pathname, item.to));
              const isCollapsible = collapsibleSections.has(section);

              if (!isCollapsible) {
                return (
                  <div key={section} className="mb-2">
                    <SectionLabel>{section}</SectionLabel>
                    <ul className="flex flex-col gap-1" role="list">
                      {items.map((item) => (
                        <li key={item.to}>{renderLink(item)}</li>
                      ))}
                    </ul>
                  </div>
                );
              }

              return (
                <Collapsible key={section} defaultOpen={hasActiveItem || section !== "Reports"} className="mb-2">
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg px-3 pb-1 pt-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-ink/35 transition-colors hover:text-ink/55">
                    <span>{section}</span>
                    <ChevronDown size={14} className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="flex flex-col gap-1 pb-1" role="list">
                      {items.map((item) => (
                        <li key={item.to}>{renderLink(item)}</li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </nav>
      </div>
    </TooltipProvider>
  );

  if (!isDesktop) return content;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ink/10 bg-white transition-[width] duration-300 lg:flex",
        isCollapsed ? "w-20" : "w-60",
      )}
    >
      {content}
    </aside>
  );
}
