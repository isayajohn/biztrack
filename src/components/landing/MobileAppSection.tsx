import type { ReactNode } from "react";
import { BarChart3, Boxes, Download, ReceiptText, ShieldCheck, ShoppingCart } from "lucide-react";
import { apiClient } from "../../services/apiClient";
import { PrimaryButton, SecondaryButton } from "./LandingDesignSystem";

type Props = {
  title?: string | null;
  description?: string | null;
  androidUrl?: string | null;
  iosUrl?: string | null;
  apkAvailable?: boolean;
};

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="currentColor" d="M17.1 12.5c0-2.8 2.3-4.1 2.4-4.2a5.2 5.2 0 0 0-4.1-2.2c-1.7-.2-3.4 1-4.3 1-.9 0-2.3-1-3.8-1-2 0-3.8 1.1-4.8 2.8-2 3.5-.5 8.8 1.4 11.6.9 1.4 2 2.9 3.5 2.8 1.4-.1 2-1 3.7-1 1.7 0 2.2 1 3.7 1 1.5 0 2.5-1.4 3.4-2.8a12.7 12.7 0 0 0 1.6-3.3 4.9 4.9 0 0 1-2.7-4.7ZM14.3 4.3A4.9 4.9 0 0 0 15.5.8a5 5 0 0 0-3.3 1.7A4.6 4.6 0 0 0 11 5.9a4.1 4.1 0 0 0 3.3-1.6Z" />
    </svg>
  );
}

function PlayLogo() {
  return (
    <svg viewBox="0 0 32 36" className="h-4 w-4" aria-hidden="true">
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
    <div className="relative mx-auto h-[380px] w-[210px] rounded-[2.4rem] border border-slate-200 bg-white p-2 shadow-card sm:h-[420px] sm:w-[230px]">
      <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-slate-200" />
      <div className="h-full overflow-hidden rounded-[1.9rem] bg-cloud px-3 pb-4 pt-8">
        <div className="flex items-center justify-between text-[7px] font-black text-slateMuted">
          <span>9:41</span>
          <span>● ● ◒</span>
        </div>
        <div className="mt-5">
          <p className="text-[8px] font-bold text-slateMuted">Welcome back</p>
          <p className="text-sm font-black text-ink">Your business</p>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[8px] font-semibold text-slateMuted">Today&apos;s sales</p>
          <p className="mt-1 text-xl font-black text-ink">TZS 485,000</p>
          <p className="mt-2 text-[7px] font-bold text-leaf">+12.4% from yesterday</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="rounded-lg bg-mint p-3 text-center ring-1 ring-leaf/15">
              <Icon className="mx-auto h-5 w-5 text-leaf" />
              <p className="mt-1 text-[8px] font-extrabold text-ink">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[8px] font-black text-ink">This week</p>
            <p className="text-[7px] font-bold text-leaf">View report</p>
          </div>
          <div className="mt-3 flex h-14 items-end gap-1.5">
            {[35, 55, 42, 75, 58, 88, 68].map((height, index) => (
              <span key={index} className="flex-1 rounded-t bg-leaf/70" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileAppSection({ title, description, androidUrl, iosUrl, apkAvailable }: Props) {
  const baseUrl = String(apiClient.defaults.baseURL ?? "/api").replace(/\/$/, "");
  const apkUrl = `${baseUrl}/public/landing-page/mobile-app.apk`;

  const downloadLinks = [
    iosUrl && { key: "ios", href: iosUrl, icon: <AppleLogo />, label: "Apple Store" },
    androidUrl && { key: "android", href: androidUrl, icon: <PlayLogo />, label: "Play Store" },
    apkAvailable && { key: "apk", href: apkUrl, icon: <Download size={16} />, label: "Download APK" },
  ].filter(Boolean) as { key: string; href: string; icon: ReactNode; label: string }[];

  return (
    <section id="mobile-app" className="bg-cloud px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-7 py-12 sm:px-14 lg:px-16">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-leaf">Mobile app</p>
            <h2 className="mt-3 max-w-lg font-display text-3xl font-extrabold leading-tight tracking-normal text-ink sm:text-4xl">
              {title || "Download and enjoy the experience"}
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slateMuted">
              {description ||
                "Manage sales, expenses, and stock from your pocket. Download BizTrack for a fast, focused mobile experience wherever you are."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {downloadLinks.length > 0 ? (
                downloadLinks.map(({ key, href, icon, label }, index) => {
                  const Button = index === 0 ? PrimaryButton : SecondaryButton;
                  return (
                    <Button key={key} href={href} icon={icon}>
                      {label}
                    </Button>
                  );
                })
              ) : (
                <span className="rounded-full border border-slate-200 bg-cloud px-6 py-3 text-sm font-bold text-slateMuted">
                  Mobile app coming soon
                </span>
              )}
            </div>
            {apkAvailable && (
              <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slateMuted">
                <ShieldCheck size={15} className="text-leaf" />
                Official Android installation file
              </p>
            )}
          </div>
          <div className="hidden items-center justify-center bg-cloud p-10 lg:flex lg:min-h-[460px]">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
