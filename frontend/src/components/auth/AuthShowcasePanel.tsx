import { BarChart3, PackageCheck, ReceiptText, TrendingUp } from "lucide-react";

type AuthShowcasePanelProps = {
  title: string;
  text: string;
};

const chartPoints = [
  "M 24 142 L 90 102 L 148 126 L 218 84 L 302 116 L 386 72",
  "M 24 118 L 92 134 L 152 82 L 220 106 L 306 92 L 386 108",
];

export default function AuthShowcasePanel({ title, text }: AuthShowcasePanelProps) {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#063f3d] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-center">
      <DecorativeSquares />

      <div className="relative mx-auto w-full max-w-xl">
        <div className="relative mx-auto w-full max-w-lg rounded-xl border border-white/30 bg-white/82 p-5 text-ink shadow-[0_24px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">BizTrack</p>
              <h2 className="mt-1 font-display text-lg font-black text-ink">Analytics</h2>
            </div>
            <div className="flex gap-2 rounded-lg bg-[#f1f5f9] p-1 text-[10px] font-bold text-slateMuted">
              <span className="rounded-md bg-white px-3 py-1 shadow-sm">Weekly</span>
              <span className="px-3 py-1">Monthly</span>
              <span className="px-3 py-1">Yearly</span>
            </div>
          </div>

          <div className="relative h-40 overflow-hidden rounded-lg border border-ink/10 bg-white/62">
            <div className="absolute inset-x-0 top-8 h-px bg-ink/10" />
            <div className="absolute inset-x-0 top-16 h-px bg-ink/10" />
            <div className="absolute inset-x-0 top-24 h-px bg-ink/10" />
            <svg viewBox="0 0 410 160" className="h-full w-full" aria-hidden="true">
              <path d={chartPoints[0]} fill="none" stroke="#12b890" strokeWidth="4" />
              <path d={chartPoints[1]} fill="none" stroke="#64748b" strokeWidth="3" opacity="0.75" />
              <path
                d="M 24 142 L 90 102 L 148 126 L 218 84 L 302 116 L 386 72 L 386 156 L 24 156 Z"
                fill="url(#profitGradient)"
                opacity="0.35"
              />
              <defs>
                <linearGradient id="profitGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#12b890" />
                  <stop offset="100%" stopColor="#12b890" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-4 text-center text-[11px] font-bold text-slateMuted">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
          </div>
        </div>

        <div className="absolute -right-2 top-36 w-48 rounded-xl border border-white/30 bg-white/82 p-5 text-ink shadow-[0_24px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl">
          <div className="relative mx-auto grid h-32 w-32 place-items-center rounded-full bg-[#e5e7eb]">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(#12b890_0_42%,#e5e7eb_42%_100%)]" />
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner">
              <div>
                <p className="text-xs font-bold text-slateMuted">Total</p>
                <p className="font-display text-2xl font-black text-ink">42%</p>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs font-bold text-slateMuted">Profit growth</p>
        </div>

        <div className="mt-28 text-center">
          <h2 className="font-display text-2xl font-black">{title}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-7 text-white/78">
            {text}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Metric icon={ReceiptText} label="Sales" value="+18%" />
          <Metric icon={PackageCheck} label="Stock" value="126" />
          <Metric icon={TrendingUp} label="Profit" value="TZS" />
        </div>
      </div>
    </aside>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/10 p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur">
      <Icon size={17} className="text-white/75" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold text-white/55">{label}</p>
      <p className="mt-1 font-display text-lg font-black text-white">{value}</p>
    </div>
  );
}

function DecorativeSquares() {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-35" aria-hidden="true">
      <span className="absolute right-10 top-0 h-12 w-12 rounded bg-white/15" />
      <span className="absolute right-28 top-5 h-10 w-10 rounded bg-white/12" />
      <span className="absolute right-48 top-3 h-6 w-6 rounded bg-white/10" />
      <span className="absolute right-16 top-28 h-8 w-8 rounded bg-white/12" />
      <span className="absolute right-40 top-36 h-7 w-7 rounded bg-white/10" />
      <span className="absolute bottom-6 left-12 h-12 w-12 rounded bg-white/14" />
      <span className="absolute bottom-16 left-24 h-8 w-8 rounded bg-white/12" />
      <span className="absolute bottom-28 left-16 h-6 w-6 rounded bg-white/10" />
      <span className="absolute bottom-2 left-36 h-10 w-10 rounded bg-white/12" />
    </div>
  );
}
