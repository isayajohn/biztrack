import { NavLink } from "react-router-dom";
import BrandLogo from "../BrandLogo";
import { AnimatedIcon } from "../animate-ui/MotionPrimitives";
import type { NavItem } from "../../constants/nav";

type Props = {
  navItems: NavItem[];
};

function groupItems(items: NavItem[]) {
  const groups: { section: string | null; items: NavItem[] }[] = [];
  for (const item of items) {
    const sec = item.section ?? null;
    const existing = groups.find((g) => g.section === sec);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ section: sec, items: [item] });
    }
  }
  return groups;
}

export default function Sidebar({ navItems }: Props) {
  const groups = groupItems(navItems);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/10 bg-white lg:flex"
      aria-label="Sidebar navigation"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-ink/10 px-5">
        <BrandLogo className="h-auto w-36 max-w-full" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map(({ section, items }) => (
          <div key={section ?? "__main__"} className="mb-2">
            {section && (
              <p className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-widest text-ink/30">
                {section}
              </p>
            )}
            <ul className="flex flex-col gap-0.5" role="list">
              {items.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-mint text-leaf"
                          : "text-ink/65 hover:bg-[#eef8f4] hover:text-ink",
                      ].join(" ")
                    }
                  >
                    <AnimatedIcon icon={Icon} size={18} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ink/10 px-5 py-3">
        <p className="text-xs font-semibold text-ink/30">BizTrack v0.1</p>
      </div>
    </aside>
  );
}
