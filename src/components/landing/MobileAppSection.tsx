import { BarChart3, Boxes, Download, ReceiptText, ShieldCheck, ShoppingCart } from "lucide-react";
import { apiClient } from "../../services/apiClient";

type Props = {
  title?: string | null;
  description?: string | null;
  androidUrl?: string | null;
  iosUrl?: string | null;
  apkAvailable?: boolean;
};

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="currentColor" d="M17.1 12.5c0-2.8 2.3-4.1 2.4-4.2a5.2 5.2 0 0 0-4.1-2.2c-1.7-.2-3.4 1-4.3 1-.9 0-2.3-1-3.8-1-2 0-3.8 1.1-4.8 2.8-2 3.5-.5 8.8 1.4 11.6.9 1.4 2 2.9 3.5 2.8 1.4-.1 2-1 3.7-1 1.7 0 2.2 1 3.7 1 1.5 0 2.5-1.4 3.4-2.8a12.7 12.7 0 0 0 1.6-3.3 4.9 4.9 0 0 1-2.7-4.7ZM14.3 4.3A4.9 4.9 0 0 0 15.5.8a5 5 0 0 0-3.3 1.7A4.6 4.6 0 0 0 11 5.9a4.1 4.1 0 0 0 3.3-1.6Z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 32 36" className="h-5 w-5" aria-hidden="true">
        <path fill="#18bd97" d="M1 2.8v30.4L18.5 18 1 2.8Z" />
      <path fill="#f59e0b" d="m18.5 18 5.1-4.4 6.1 3.5c1.7 1 1.7 2.8 0 3.8l-6.1 3.5-5.1-6.4Z" />
      <path fill="#22c55e" d="M1 2.8 22.8 15l-4.3 3L1 2.8Z" />
      <path fill="#ef4444" d="m1 33.2 21.8-12.1-4.3-3.1L1 33.2Z" />
    </svg>
  );
}

function PhoneMockup() {
  const items = [
    { icon: ShoppingCart, label: "Sales" },
    { icon: ReceiptText, label: "Expenses" },
    { icon: Boxes, label: "Stock" },
    { icon: BarChart3, label: "Reports" },
  ];

  return (
    <div className="relative mx-auto h-[390px] w-[205px] rotate-[-15deg] rounded-[2.8rem] border-[7px] border-[#121b21] bg-white p-2 shadow-[0_30px_55px_rgba(0,0,0,0.32)] sm:h-[430px] sm:w-[225px]">
      <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#111827]" />
      <div className="h-full overflow-hidden rounded-[2.05rem] bg-[#f7faf9] px-3 pb-4 pt-8 text-[#10231e]">
        <div className="flex items-center justify-between text-[7px] font-black"><span>9:41</span><span>● ● ◒</span></div>
        <div className="mt-5">
          <p className="text-[8px] font-bold text-[#6b7d77]">Welcome back</p>
          <p className="text-sm font-black">Your business</p>
        </div>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#18bd97] to-[#0b9279] p-4 text-white shadow-lg">
          <p className="text-[8px] font-semibold text-white/70">Today&apos;s sales</p>
          <p className="mt-1 text-xl font-black">TZS 485,000</p>
          <p className="mt-2 text-[7px] font-bold text-white/75">+12.4% from yesterday</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-xl bg-white p-3 text-center shadow-sm">
              <Icon className="mx-auto h-5 w-5 text-[#18bd97]" />
              <p className="mt-1 text-[8px] font-extrabold">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-[8px] font-black">This week</p><p className="text-[7px] font-bold text-[#18bd97]">View report</p></div>
          <div className="mt-3 flex h-14 items-end gap-1.5">
            {[35, 55, 42, 75, 58, 88, 68].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#18bd97]" style={{ height: `${height}%` }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileAppSection({ title, description, androidUrl, iosUrl, apkAvailable }: Props) {
  const baseUrl = String(apiClient.defaults.baseURL ?? "/api").replace(/\/$/, "");
  const apkUrl = `${baseUrl}/public/landing-page/mobile-app.apk`;

  return (
    <section id="mobile-app" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative mx-auto min-h-[510px] max-w-6xl overflow-hidden rounded-[1.7rem] bg-gradient-to-br from-[#18bd97] via-[#18bd97] to-[#0b9279] text-white shadow-[0_16px_35px_rgba(11,146,121,0.24)] lg:min-h-[500px]">
        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative grid min-h-[510px] lg:grid-cols-[1.05fr_0.95fr] lg:min-h-[500px]">
          <div className="z-10 flex flex-col justify-center px-7 py-12 sm:px-14 lg:px-20">
            <h2 className="max-w-lg font-display text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">
              {title || "Download and enjoy the experience"}
            </h2>
            <p className="mt-6 max-w-md text-base font-medium leading-7 text-white/85 sm:text-lg">
              {description || "Don’t miss out! Download now for seamless business management wherever you are."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {iosUrl && <a href={iosUrl} target="_blank" rel="noreferrer" className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#111827] shadow-sm transition hover:-translate-y-0.5"><AppleLogo />Apple Store</a>}
              {androidUrl && <a href={androidUrl} target="_blank" rel="noreferrer" className="inline-flex h-13 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-[#111827] shadow-sm transition hover:-translate-y-0.5"><PlayLogo />Play Store</a>}
              {apkAvailable && <a href={apkUrl} className="inline-flex h-13 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-white/20"><Download size={18} />Download APK</a>}
              {!androidUrl && !iosUrl && !apkAvailable && <span className="rounded-full bg-white/15 px-6 py-3 text-sm font-bold text-white">Mobile app coming soon</span>}
            </div>
            {apkAvailable && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-white/70"><ShieldCheck size={15} />Official Android installation file</p>}
          </div>
          <div className="relative hidden items-end justify-center pt-12 lg:flex">
            <div className="absolute bottom-[-155px] right-10"><PhoneMockup /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
