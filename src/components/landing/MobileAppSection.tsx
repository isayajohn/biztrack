import { Download, ShieldCheck, Smartphone } from "lucide-react";
import { apiClient } from "../../services/apiClient";

type Props = {
  title?: string | null;
  description?: string | null;
  androidUrl?: string | null;
  iosUrl?: string | null;
  apkAvailable?: boolean;
};

function GooglePlayBadge() {
  return (
    <span className="inline-flex h-12 items-center gap-2 rounded-lg bg-black px-3.5 text-left text-white ring-1 ring-white/20">
      <svg viewBox="0 0 32 36" className="h-8 w-7 shrink-0" aria-hidden="true">
        <path fill="#00d6ff" d="M1 2.8v30.4L18.5 18 1 2.8Z" />
        <path fill="#ffcf00" d="m18.5 18 5.1-4.4 6.1 3.5c1.7 1 1.7 2.8 0 3.8l-6.1 3.5-5.1-6.4Z" />
        <path fill="#00f076" d="M1 2.8 22.8 15l-4.3 3L1 2.8Z" />
        <path fill="#ff3a44" d="m1 33.2 21.8-12.1-4.3-3.1L1 33.2Z" />
      </svg>
      <span><span className="block text-[9px] uppercase leading-none">Get it on</span><span className="mt-1 block text-lg font-semibold leading-none">Google Play</span></span>
    </span>
  );
}

export default function MobileAppSection({ title, description, androidUrl, iosUrl, apkAvailable }: Props) {
  const baseUrl = String(apiClient.defaults.baseURL ?? "/api").replace(/\/$/, "");
  const apkUrl = `${baseUrl}/public/landing-page/mobile-app.apk`;

  return (
    <section id="mobile-app" className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-ink text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center justify-center bg-gradient-to-br from-leaf to-emerald-700 p-10 sm:p-14">
          <div className="relative flex h-56 w-40 items-center justify-center rounded-[2.3rem] border-[7px] border-white/90 bg-cloud shadow-2xl">
            <div className="absolute top-2 h-1.5 w-12 rounded-full bg-ink/20" />
            <Smartphone className="h-16 w-16 text-leaf" strokeWidth={1.5} />
          </div>
        </div>
        <div className="p-8 sm:p-12 lg:p-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-mint">BizTrack mobile</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title || "Manage your business wherever you are"}</h2>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/65">{description || "Track sales, expenses, stock, and profit from your phone."}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {androidUrl && <a href={androidUrl} target="_blank" rel="noreferrer" aria-label="Get BizTrack on Google Play"><GooglePlayBadge /></a>}
            {iosUrl && <a href={iosUrl} target="_blank" rel="noreferrer" aria-label="Download BizTrack on the App Store"><img src="/app-store-badge.svg" alt="Download on the App Store" className="h-12 w-auto" /></a>}
            {apkAvailable && <a href={apkUrl} className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-extrabold text-white hover:bg-white/15"><Download size={18} />Download APK</a>}
            {!androidUrl && !iosUrl && !apkAvailable && <span className="rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white/70">Mobile app download is coming soon.</span>}
          </div>
          {apkAvailable && <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/45"><ShieldCheck size={15} className="text-mint" />Android installation file provided directly by BizTrack.</p>}
        </div>
      </div>
    </section>
  );
}
