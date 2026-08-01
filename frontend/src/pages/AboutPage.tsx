import { ArrowRight, Building2, Globe2, MapPin, Smartphone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import FinalCTA from "../components/landing/FinalCTA";
import LandingFooter from "../components/landing/LandingFooter";
import LandingNavbar from "../components/landing/LandingNavbar";
import { useSeo } from "../hooks/useSeo";

const FACTS = [
  { icon: Building2, label: "Built by", value: "AfrigoTech" },
  { icon: MapPin, label: "Home", value: "Tanzania" },
  { icon: Globe2, label: "Made for", value: "African businesses" },
  { icon: Smartphone, label: "Available on", value: "Web and mobile" },
];

export default function AboutPage() {
  useSeo({
    title: "About BizTrack | Business clarity for African entrepreneurs",
    description:
      "Meet BizTrack, the AfrigoTech business platform built in Tanzania to help African businesses run sales, inventory, finance and reporting with confidence.",
    path: "/about",
  });

  return (
    <div className="min-h-screen bg-[#050811] text-white">
      <LandingNavbar />
      <main>
        <section className="relative overflow-hidden border-b border-white/[0.07] px-5 pb-24 pt-40 sm:px-8 sm:pb-32 sm:pt-48">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[70rem] -translate-x-1/2 rounded-full bg-[#12e4d7]/[0.07] blur-[150px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#12e4d7]/20 bg-[#12e4d7]/[0.055] px-4 py-2 text-xs font-bold text-[#55e7c3]">
              <Sparkles size={13} /> About BizTrack
            </span>
            <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-7xl lg:text-[5.5rem]">
              The story behind <span className="text-white/35">BizTrack.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-white/45 sm:text-lg">
              African entrepreneurs deserve clear, real-time answers about how their businesses are performing—without wrestling with scattered spreadsheets and disconnected tools.
            </p>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-20">
            <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c1220] sm:min-h-[560px]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_42%,rgba(18,228,215,.18),transparent_48%),linear-gradient(145deg,#12162a,#060812_70%)]" />
              <div className="absolute inset-0 opacity-[0.13] [background-image:radial-gradient(rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:26px_26px]" />
              <img
                src="/landing-hero-devices.png"
                alt="BizTrack dashboard shown on a laptop and mobile phone"
                className="absolute bottom-0 left-1/2 w-[122%] max-w-none -translate-x-1/2 object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,.5)]"
              />
              <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md sm:left-8 sm:top-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#55e7c3]">Our purpose</p>
                <p className="mt-1 text-sm font-semibold text-white/70">Turn business activity into clarity.</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#55e7c3]">Why we built it</span>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
                From daily records to <span className="text-white/35">confident decisions.</span>
              </h2>
              <div className="mt-7 space-y-5 text-[15px] leading-8 text-white/45">
                <p>
                  Many growing businesses know their customers and products deeply, yet still finish the day unsure about profit, cash, stock, or unpaid invoices. The information exists—it is simply spread across notebooks, chats and separate systems.
                </p>
                <p>
                  AfrigoTech created BizTrack to bring that work together. Sales update inventory, payments update cash, and every movement becomes a report a business owner can understand immediately.
                </p>
                <p>
                  Built around the way African businesses actually operate, BizTrack supports multiple currencies, branches, teams, mobile workflows and the everyday need to keep working from anywhere.
                </p>
              </div>
              <blockquote className="mt-9 border-l-2 border-[#12e4d7] pl-6 font-display text-xl font-medium leading-8 text-white/75">
                “Business software should make the next decision clearer—not add another layer of work.”
              </blockquote>
              <Link to="/#product-tour" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#12e4d7] px-6 py-3.5 text-sm font-bold text-[#051210] hover:bg-white">
                Explore the product <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.07] bg-[#080d19] px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/30">Company facts</p>
            <div className="mt-9 grid gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {FACTS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-[#0b101d] p-7 sm:p-8">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#12e4d7]/20 bg-[#12e4d7]/[0.07] text-[#55e7c3]">
                    <Icon size={19} />
                  </span>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-white/80">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-28 text-center sm:px-8 sm:py-36">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(18,228,215,.11),transparent_45%)]" />
          <p className="relative mx-auto max-w-5xl font-display text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-6xl">
            Built in Tanzania. <span className="text-white/35">Built for Africa.</span><br /> Ready for the world.
          </p>
        </section>

        <FinalCTA
          kicker="Build with clarity"
          title="Put your whole business in one clear view."
          description="Start with BizTrack today and turn every sale, stock movement and expense into a decision you can trust."
          primaryText="Start free"
          primaryUrl="/register"
        />
      </main>
      <LandingFooter tagline="Built by AfrigoTech to give ambitious African businesses one clear operating system for sales, inventory, finance and growth." />
    </div>
  );
}
