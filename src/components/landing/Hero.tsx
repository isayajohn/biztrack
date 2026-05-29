import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  Home,
  ShoppingCart,
  WalletCards,
} from "lucide-react";
import Button from "@mui/material/Button";
import { Link as RouterLink } from "react-router-dom";

const businessTypes = [
  "Small shops",
  "Food sellers",
  "Freelancers",
  "Repair shops",
  "Street vendors",
];

// ─── Mobile app screen content ──────────────────────────────────────────────

function MobileScreen() {
  const tabs = [
    { icon: Home, label: "Home", active: true },
    { icon: ShoppingCart, label: "Sales", active: false },
    { icon: WalletCards, label: "Expenses", active: false },
    { icon: FileText, label: "Reports", active: false },
  ] as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4fbf7]">
      {/* App header */}
      <div className="shrink-0 bg-leaf px-4 pb-6 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/55">
              BizTrack
            </p>
            <p className="text-[13px] font-bold text-white">Today's Overview</p>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/15"
            aria-label="Notifications"
          >
            <Bell size={12} className="text-white" aria-hidden="true" />
          </button>
        </div>
        {/* Big profit number */}
        <div className="mt-3">
          <p className="text-[9px] font-semibold text-white/55">Today's Profit</p>
          <div className="flex items-end gap-2">
            <p
              className="text-[28px] font-extrabold leading-none text-white"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              $177
            </p>
            <span className="mb-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[8px] font-bold text-white">
              ↑ +18%
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-hidden px-3 pb-1">
        {/* Metric cards – float over header */}
        <div className="-mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white p-2.5 shadow-card">
            <p className="text-[8px] font-semibold text-ink/45">Sales</p>
            <p className="mt-0.5 text-[15px] font-extrabold text-ink">$248</p>
            <span className="text-[8px] font-bold text-leaf">↑ +12%</span>
          </div>
          <div className="rounded-xl bg-white p-2.5 shadow-card">
            <p className="text-[8px] font-semibold text-ink/45">Expenses</p>
            <p className="mt-0.5 text-[15px] font-extrabold text-ink">$71</p>
            <span className="text-[8px] font-bold text-clay">↓ -5%</span>
          </div>
        </div>

        {/* Low stock alert */}
        <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-orange-200/70 bg-orange-50 px-2.5 py-1.5">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c86b3c"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-[8px] font-bold text-clay">
            Low Stock: Rice 5kg, +2 more
          </p>
        </div>

        {/* Mini sales chart */}
        <div className="mt-2 rounded-xl bg-white p-2.5 shadow-card">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[8px] font-bold uppercase tracking-wide text-ink/40">
              Weekly Sales
            </p>
            <span className="text-[8px] font-bold text-leaf">+24%</span>
          </div>
          <div className="flex items-end gap-[3px]" style={{ height: 34 }}>
            {[55, 70, 45, 80, 65, 90, 75].map((h, i) => (
              <div
                key={`mbar-${i}`}
                className="flex-1 rounded-t"
                style={{
                  height: `${h}%`,
                  backgroundColor: i === 5 ? "#1f8a5b" : "#d1f0e0",
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span
                key={`ml-${i}`}
                className="flex-1 text-center text-[7px] font-semibold text-ink/30"
              >
                {d}
              </span>
            ))}
          </div>
        </div>

        {/* Latest sale */}
        <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2.5 py-2 shadow-card">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-mint">
              <ShoppingCart size={11} className="text-leaf" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[9px] font-bold text-ink">2× Rice 5kg bags</p>
              <p className="text-[7.5px] text-ink/40">3 minutes ago</p>
            </div>
          </div>
          <span className="text-[11px] font-extrabold text-leaf">+$34</span>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div className="mt-auto shrink-0 flex items-center justify-around border-t border-ink/8 bg-white px-2 pb-2 pt-1.5">
        {tabs.map(({ icon: Icon, label, active }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <Icon
              size={13}
              className={active ? "text-leaf" : "text-ink/30"}
              aria-hidden="true"
            />
            <span
              className={`text-[7px] font-bold ${
                active ? "text-leaf" : "text-ink/30"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phone frame + animated mockup ──────────────────────────────────────────

function DashboardPreview() {
  return (
    <div className="relative flex justify-center">
      {/* Soft glow behind phone */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-3/4 w-3/4 -translate-x-1/2 rounded-full bg-leaf/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Phone — floats */}
      <div className="animate-float relative" style={{ width: 252, height: 524 }}>
        {/* Outer shell */}
        <div
          className="absolute inset-0 rounded-[2.75rem] bg-[#0c0c0c]"
          style={{
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          {/* Side buttons */}
          <div className="absolute -left-[3px] top-[86px] h-7 w-[3px] rounded-l-full bg-[#2a2a2a]" aria-hidden="true" />
          <div className="absolute -left-[3px] top-[128px] h-12 w-[3px] rounded-l-full bg-[#2a2a2a]" aria-hidden="true" />
          <div className="absolute -left-[3px] top-[154px] h-12 w-[3px] rounded-l-full bg-[#2a2a2a]" aria-hidden="true" />
          <div className="absolute -right-[3px] top-[120px] h-16 w-[3px] rounded-r-full bg-[#2a2a2a]" aria-hidden="true" />

          {/* Screen — flex column so status bar + app fill vertically */}
          <div className="absolute inset-[3px] flex flex-col overflow-hidden rounded-[2.45rem]">
            {/* Dynamic Island */}
            <div
              className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-[1.1rem] bg-[#0c0c0c]"
              style={{ width: 86, height: 26 }}
              aria-hidden="true"
            />

            {/* Status bar */}
            <div className="shrink-0 flex items-center justify-between bg-[#0c0c0c] px-5 py-[7px]">
              <span
                className="text-[10.5px] font-semibold text-white"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                9:41
              </span>
              <div className="flex items-center gap-1.5" aria-hidden="true">
                {/* Cell signal */}
                <div className="flex items-end gap-[2px]">
                  {[3, 5, 7, 9].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2.5px] rounded-sm bg-white"
                      style={{ height: h }}
                    />
                  ))}
                </div>
                {/* Wi-Fi */}
                <svg width="14" height="11" viewBox="0 0 22 16" fill="none">
                  <circle cx="11" cy="14.5" r="1.5" fill="white" />
                  <path
                    d="M5.5 9a7.5 7.5 0 0111 0"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1.5 5a13.5 13.5 0 0119 0"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                {/* Battery */}
                <div className="flex items-center gap-[1px]">
                  <div className="relative flex h-[9px] w-[16px] items-center rounded-[2px] border border-white/50 px-[1.5px]">
                    <div className="h-full w-[10px] rounded-[1px] bg-white" />
                  </div>
                  <div className="h-[5px] w-[2px] rounded-r-sm bg-white/50" />
                </div>
              </div>
            </div>

            {/* App screen */}
            <MobileScreen />
          </div>
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-[6px] left-1/2 h-[4px] w-[68px] -translate-x-1/2 rounded-full bg-white/30"
          aria-hidden="true"
        />
      </div>

      {/* Animated sale toast */}
      <div className="animate-sale-toast pointer-events-none absolute -right-2 top-32 z-10 rounded-2xl bg-white px-3 py-2 shadow-soft sm:-right-8">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint">
            <CheckCircle2 size={11} className="text-leaf" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold text-ink">Sale recorded!</p>
            <p className="text-[9px] font-semibold text-leaf">+$34 · Rice 5kg</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hero section ────────────────────────────────────────────────────────────

export default function Hero() {
  return (
    <section className="hero-pattern relative overflow-hidden">
      {/* Background decoration orbs */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-leaf/6 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-16 h-64 w-64 rounded-full bg-mint/70 blur-2xl"
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
        {/* Left: copy */}
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-leaf/20 bg-mint px-3.5 py-1.5 text-sm font-semibold text-leaf">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />
            Built for everyday small businesses
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
            Simple sales and expense tracking{" "}
            <span className="text-leaf">for small businesses</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink/65 sm:text-lg">
            Track your daily sales, expenses, products, and profit from one easy
            dashboard. No accounting degree required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              component={RouterLink}
              to="/register"
              variant="contained"
              endIcon={<ArrowRight size={18} aria-hidden="true" />}
              sx={{
                borderRadius: 3,
                boxShadow: "0 18px 45px rgba(23, 33, 27, 0.09)",
                fontSize: "1rem",
                px: 3,
                py: 1.5,
                transition: "all 180ms ease",
                "&:hover": {
                  boxShadow: "0 18px 45px rgba(23, 33, 27, 0.14)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={RouterLink}
              to="/demo"
              variant="outlined"
              sx={{
                borderColor: "rgba(23, 33, 27, 0.15)",
                borderRadius: 3,
                color: "#17211b",
                fontSize: "1rem",
                px: 3,
                py: 1.5,
                transition: "all 180ms ease",
                "&:hover": {
                  backgroundColor: "#ffffff",
                  borderColor: "rgba(23, 33, 27, 0.25)",
                  boxShadow: "0 4px 24px rgba(23, 33, 27, 0.08)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              View Demo
            </Button>
          </div>
          <p className="mt-4 text-xs font-semibold text-ink/40">
            No credit card required · Cancel anytime
          </p>

          {/* Trust strip */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-ink/35">Works for:</span>
            {businessTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink/55 shadow-sm"
              >
                <CheckCircle2 size={11} className="text-leaf" aria-hidden="true" />
                {type}
              </span>
            ))}
          </div>
        </div>

        {/* Right: mobile phone mockup */}
        <div className="flex justify-center lg:justify-end lg:pl-4">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
