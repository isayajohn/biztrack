import { useEffect, useState } from "react";
import {
  ArrowRight,
  Barcode,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  Check,
  CreditCard,
  FileText,
  Globe2,
  ReceiptText,
  Repeat2,
  ShoppingCart,
  Smartphone,
  Tags,
  TrendingDown,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingLanguage } from "../../i18n/LandingLanguageContext";

type FeatureContent = { title?: unknown; description?: unknown; iconName?: unknown; imageUrl?: unknown };
type FeatureDetail = { tagline: string; overview: string; bullets: Array<{ title: string; body: string }>; bestFor: string };
type Feature = { icon: LucideIcon; title: string; description: string; detail: FeatureDetail };

const ICONS: Record<string, LucideIcon> = { Barcode, BarChart3, Bot, Boxes, Building2, CreditCard, FileText, Globe2, ReceiptText, Repeat2, ShoppingCart, Smartphone, Tags, TrendingDown, Users };

const FEATURES: Feature[] = [
  {
    icon: ShoppingCart,
    title: "Point of Sale (POS)",
    description: "Fast counter checkout with product search, discounts, tax, payments, and instant receipts.",
    detail: {
      tagline: "Turn every checkout into accurate business data.",
      overview: "BizTrack POS helps staff serve customers quickly while keeping sales, stock, customer balances, payments, and reports connected automatically.",
      bullets: [
        { title: "Quick checkout", body: "Search products, adjust quantities, apply discounts, and complete a sale in seconds." },
        { title: "Flexible payments", body: "Record cash, bank, card, mobile money, and credit transactions clearly." },
        { title: "Automatic stock updates", body: "Each completed product sale updates inventory and movement history." },
        { title: "Instant receipts", body: "Print or share a professional receipt as soon as payment is recorded." },
      ],
      bestFor: "Retail shops, restaurants, pharmacies, wholesalers, and any busy sales counter.",
    },
  },
  {
    icon: BarChart3,
    title: "Executive Dashboard",
    description: "Real-time revenue, profit, and cash flow at a glance — across every business.",
    detail: {
      tagline: "Your business, at a glance.",
      overview: "The Executive Dashboard brings every sale, expense, debt, payment, and stock movement into one live command centre. See what changed today without rebuilding a spreadsheet.",
      bullets: [
        { title: "Live revenue and profit", body: "Compare today, this week, and this month with the previous period." },
        { title: "Cash position in real time", body: "See available cash after outstanding customer and supplier debts." },
        { title: "Business health signals", body: "Track profit margin, stock health, and debt risk from one view." },
        { title: "Recent activity feed", body: "Follow sales, payments, and stock changes across users and branches." },
      ],
      bestFor: "Owners and managers who need one screen to answer how the business is performing right now.",
    },
  },
  {
    icon: Bot,
    title: "AI Copilot",
    description: "Daily summaries and recommendations that explain what is happening and why.",
    detail: {
      tagline: "An analyst on call, 24/7.",
      overview: "Ask BizTrack questions in plain language. The Copilot reads your live sales, stock, debts, and customer activity, then explains the answer with the numbers behind it.",
      bullets: [
        { title: "Plain-language answers", body: "Ask about best months, outstanding debt, fast sellers, or margin changes." },
        { title: "Daily intelligence briefings", body: "Start the day with wins, risks, and the action that deserves attention." },
        { title: "Proactive recommendations", body: "Spot stock risks, late payers, and unusual spending before they grow." },
        { title: "Grounded in your data", body: "Recommendations use the business records stored in your BizTrack workspace." },
      ],
      bestFor: "Operators who want clarity without spending hours reviewing spreadsheets and reports.",
    },
  },
  {
    icon: ReceiptText,
    title: "Invoices & Sales",
    description: "Create, send, and track invoices and sales with status the moment they change.",
    detail: {
      tagline: "Get paid faster, with less paperwork.",
      overview: "Record counter sales quickly, create professional invoices, and keep payment status connected to customers, stock, debts, and reports.",
      bullets: [
        { title: "Fast sale recording", body: "Capture products, quantities, discounts, payment method, and receipts in seconds." },
        { title: "Professional documents", body: "Create clear invoices and printable or shareable sale receipts." },
        { title: "Payment status tracking", body: "Follow paid, partially paid, and outstanding balances automatically." },
        { title: "Stock-aware sales", body: "Completed product sales update inventory movement without duplicate entry." },
      ],
      bestFor: "Retailers, service businesses, and growing teams that sell on cash and credit.",
    },
  },
  {
    icon: Boxes,
    title: "Inventory Management",
    description: "Live stock levels with automatic low-stock alerts before you run out.",
    detail: {
      tagline: "Know what you have, before customers ask.",
      overview: "Manage products, suppliers, purchases, stock receiving, adjustments, damaged stock, and movement history from one connected inventory workspace.",
      bullets: [
        { title: "Live stock quantities", body: "See available products and their current values after every movement." },
        { title: "Low-stock alerts", body: "Identify products that need reordering before they cost you a sale." },
        { title: "Purchase receiving", body: "Receive supplier orders and update stock with a clear audit trail." },
        { title: "Labels and movements", body: "Print product labels and inspect stock-in, stock-out, and adjustments." },
      ],
      bestFor: "Shops, wholesalers, restaurants, and any business that buys and sells physical products.",
    },
  },
  {
    icon: Users,
    title: "Customers & Suppliers",
    description: "One profile per relationship — purchase history, balances, and contact info.",
    detail: {
      tagline: "Every business relationship, in context.",
      overview: "Keep the people and companies behind each sale, purchase, and debt connected, so your team always sees history before taking the next action.",
      bullets: [
        { title: "Customer statements", body: "Review sales, payments, outstanding balances, and transaction history." },
        { title: "Supplier records", body: "Link purchase orders, receiving, debts, and payment activity." },
        { title: "Debt reminders", body: "Prepare email, SMS, and WhatsApp-ready follow-ups for overdue accounts." },
        { title: "Shared contact context", body: "Give authorised staff the same accurate relationship information." },
      ],
      bestFor: "Businesses that sell on credit, buy from multiple suppliers, or manage repeat customers.",
    },
  },
  {
    icon: FileText,
    title: "Finance Reports",
    description: "P&L, cash flow, and expense breakdowns generated automatically, always current.",
    detail: {
      tagline: "Reports ready before you ask.",
      overview: "Turn daily operations into decision-ready reports without rebuilding formulas. Filter dates, compare categories, and export the result when needed.",
      bullets: [
        { title: "Profit and loss visibility", body: "Understand revenue, cost, expenses, and net performance together." },
        { title: "Cash-flow reporting", body: "See how money moves into and out of the business over time." },
        { title: "Inventory and purchase reports", body: "Review stock value, movement, purchasing, and supplier performance." },
        { title: "PDF and spreadsheet export", body: "Share and archive reports in formats your team already uses." },
      ],
      bestFor: "Owners, finance teams, and managers who need current reports without manual preparation.",
    },
  },
  {
    icon: Repeat2,
    title: "Automations",
    description: "Recurring invoices, reminders, and workflows that run without you touching them.",
    detail: {
      tagline: "Let routine work keep moving.",
      overview: "BizTrack automates the follow-ups and repeat billing that used to eat your day — recurring invoices, debt reminders, and low-stock checks all run themselves on schedule.",
      bullets: [
        { title: "Recurring invoices", body: "Bill a customer weekly, monthly, or quarterly — BizTrack generates and records the sale automatically." },
        { title: "Debt follow-ups", body: "Schedule reminders before and after customer or supplier debt becomes due." },
        { title: "Low-stock monitoring", body: "Surface products that cross their reorder threshold automatically." },
        { title: "Notification centre", body: "Keep operational alerts and important changes visible to the right users." },
      ],
      bestFor: "Teams that want fewer missed follow-ups and more consistent daily operations.",
    },
  },
  {
    icon: Globe2,
    title: "Multi-Country & Multi-Currency",
    description: "Pick your country and currency during onboarding. BizTrack adapts.",
    detail: {
      tagline: "Built for how African businesses actually operate.",
      overview: "Set your country and currency once during onboarding, and BizTrack adapts — amounts, reports, and branch operations all follow the setup that fits your market.",
      bullets: [
        { title: "Local currency setup", body: "Choose the currency your business uses; every amount across the app follows it." },
        { title: "Country-aware setup", body: "Onboarding adapts to the country you select from day one." },
        { title: "Branch workspaces", body: "Organise staff and business activity around operational locations." },
        { title: "Role-based access", body: "Control which tools and records each team member can use." },
      ],
      bestFor: "Growing businesses with multiple locations, team members, or regional operations.",
    },
  },
  {
    icon: Smartphone,
    title: "Installable PWA",
    description: "Add to your home screen on iOS and Android. No app store required.",
    detail: {
      tagline: "Your business goes where you go.",
      overview: "Install BizTrack straight from the browser — no app store, no download page. It sits on your home screen and opens full-screen like a native app.",
      bullets: [
        { title: "One-tap install", body: "Add BizTrack to your home screen from Chrome on Android or Safari on iOS." },
        { title: "No app store required", body: "Skip app store review and updates — the installed app always opens the latest version." },
        { title: "Full-screen, native feel", body: "Runs without browser chrome, just like an installed app." },
        { title: "Desktop-ready too", body: "Use wider dashboards and tables from a laptop or desktop when you need deeper review." },
      ],
      bestFor: "Owners and teams that work at the counter, in the field, and from the office.",
    },
  },
  {
    icon: TrendingDown,
    title: "Expenses & Purchases",
    description: "Track operating costs, supplier purchases, receiving, and payments in one connected workflow.",
    detail: {
      tagline: "Know where every shilling goes.",
      overview: "Capture expenses and supplier purchases as they happen, receive products into stock, and keep the true cost of running the business visible.",
      bullets: [
        { title: "Expense categories", body: "Organise rent, transport, utilities, wages, services, and other costs." },
        { title: "Supplier purchases", body: "Record purchase orders and connect them with suppliers and payment status." },
        { title: "Stock receiving", body: "Receive purchased goods directly into inventory with traceable movements." },
        { title: "Purchase reporting", body: "Compare suppliers, categories, dates, and total purchasing activity." },
      ],
      bestFor: "Businesses that need an accurate view of operating expenses and the full purchasing cycle.",
    },
  },
  {
    icon: CreditCard,
    title: "Debts & Collections",
    description: "Manage customer credit, supplier balances, repayments, reminders, and overdue reports.",
    detail: {
      tagline: "Stay on top of every amount owed.",
      overview: "Keep receivables and payables connected to customers, suppliers, due dates, payments, reminders, and management reports.",
      bullets: [
        { title: "Customer and supplier debts", body: "Track money owed to you and money your business owes separately." },
        { title: "Partial payments", body: "Record repayments over time while maintaining an accurate remaining balance." },
        { title: "Scheduled reminders", body: "Prepare timely email, SMS, and WhatsApp-ready follow-ups." },
        { title: "Aging reports", body: "See overdue accounts and collection performance by date and relationship." },
      ],
      bestFor: "Businesses that sell on credit, pay suppliers over time, or actively manage collections.",
    },
  },
  {
    icon: Tags,
    title: "Promotions & Pricing",
    description: "Run date-based promotions and discounts while keeping sale totals and margins consistent.",
    detail: {
      tagline: "Create offers without losing control.",
      overview: "Plan promotions around products and selling periods so counter staff can apply the right offers consistently.",
      bullets: [
        { title: "Scheduled offers", body: "Set promotion start and end dates in advance." },
        { title: "Product-level discounts", body: "Connect offers to the products they are designed to move." },
        { title: "Consistent checkout", body: "Help staff use the right pricing during each active campaign." },
        { title: "Promotion visibility", body: "Keep upcoming, active, and completed offers organised." },
      ],
      bestFor: "Retailers and wholesalers that use seasonal, clearance, or product-specific offers.",
    },
  },
  {
    icon: Building2,
    title: "Branches, Teams & Roles",
    description: "Manage locations, invite staff securely, and control access with clear user roles.",
    detail: {
      tagline: "Grow the team without losing control.",
      overview: "Create business locations, invite staff with secure invitation codes, and give each user access appropriate to their responsibilities.",
      bullets: [
        { title: "Multiple branches", body: "Organise people and operations around each active business location." },
        { title: "Secure invitations", body: "Invite staff using a time-limited code tied to the correct business." },
        { title: "Role-based permissions", body: "Separate owner, manager, cashier, and staff responsibilities." },
        { title: "Shared visibility", body: "Keep authorised team members working from the same current records." },
      ],
      bestFor: "Businesses adding staff, opening locations, or separating operational responsibilities.",
    },
  },
  {
    icon: Barcode,
    title: "Product Labels & Stock Control",
    description: "Create printable product labels and audit stock-in, adjustments, damage, and movement history.",
    detail: {
      tagline: "Make every product easier to identify and control.",
      overview: "Keep physical stock aligned with BizTrack through printable labels and detailed records for receiving, corrections, damage, and movement.",
      bullets: [
        { title: "Printable labels", body: "Create clear product labels for faster counter and stock-room handling." },
        { title: "Stock adjustments", body: "Correct quantities with a recorded reason and audit trail." },
        { title: "Damaged stock", body: "Separate unusable stock from products available for sale." },
        { title: "Movement history", body: "Review how and when each product quantity changed." },
      ],
      bestFor: "Product-based businesses that need dependable stock-room and counter accuracy.",
    },
  },
];

const SW_FEATURES: Record<string, { title: string; description: string }> = {
  "Point of Sale (POS)": { title: "Sehemu ya Mauzo (POS)", description: "Malipo ya haraka kauntani yenye utafutaji wa bidhaa, punguzo, kodi, njia za malipo na risiti za papo hapo." },
  "Executive Dashboard": { title: "Dashibodi ya Uongozi", description: "Mapato, faida na mtiririko wa fedha kwa wakati halisi katika biashara zako zote." },
  "AI Copilot": { title: "Msaidizi wa AI", description: "Muhtasari na mapendekezo ya kila siku yanayoeleza kinachoendelea na sababu zake." },
  "Invoices & Sales": { title: "Ankara na Mauzo", description: "Tengeneza, tuma na fuatilia ankara na mauzo mara hali inapobadilika." },
  "Inventory Management": { title: "Usimamizi wa Stoo", description: "Kiasi cha bidhaa kwa wakati halisi na tahadhari za bidhaa zinazokaribia kuisha." },
  "Customers & Suppliers": { title: "Wateja na Wasambazaji", description: "Wasifu mmoja wenye historia ya manunuzi, salio na mawasiliano kwa kila uhusiano." },
  "Finance Reports": { title: "Ripoti za Fedha", description: "Faida na hasara, mtiririko wa fedha na matumizi vinavyotengenezwa kiotomatiki." },
  Automations: { title: "Otomatiki", description: "Ankara za kujirudia, vikumbusho na michakato inayojiendesha kwa ratiba." },
  "Multi-Country & Multi-Currency": { title: "Nchi na Sarafu Nyingi", description: "Chagua nchi na sarafu wakati wa usanidi; BizTrack itajirekebisha." },
  "Installable PWA": { title: "Programu Inayosakinishwa (PWA)", description: "Ongeza kwenye skrini ya simu ya iOS au Android bila kupitia duka la programu." },
  "Expenses & Purchases": { title: "Matumizi na Manunuzi", description: "Fuatilia gharama, manunuzi ya wasambazaji, upokeaji wa bidhaa na malipo sehemu moja." },
  "Debts & Collections": { title: "Madeni na Makusanyo", description: "Simamia mikopo ya wateja, salio la wasambazaji, marejesho, vikumbusho na ripoti." },
  "Promotions & Pricing": { title: "Promosheni na Bei", description: "Endesha promosheni na punguzo za tarehe maalum huku jumla na faida vikibaki sahihi." },
  "Branches, Teams & Roles": { title: "Matawi, Timu na Majukumu", description: "Simamia maeneo, waalike wafanyakazi kwa usalama na dhibiti ruhusa zao." },
  "Product Labels & Stock Control": { title: "Lebo za Bidhaa na Udhibiti wa Stoo", description: "Chapisha lebo na kagua upokeaji, marekebisho, uharibifu na historia ya bidhaa." },
};

function textFrom(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function translateFeature(feature: Feature): Feature {
  const copy = SW_FEATURES[feature.title];
  if (!copy) return feature;
  return {
    ...feature,
    title: copy.title,
    description: copy.description,
    detail: {
      tagline: `${copy.title}, imeunganishwa kwa urahisi.`,
      overview: `${copy.description} Kila taarifa inaunganishwa na shughuli nyingine za biashara ili uweze kufanya maamuzi kwa uhakika.`,
      bullets: [
        { title: "Taarifa za wakati halisi", body: "Mabadiliko yanaonekana mara moja kwa watumiaji wenye ruhusa." },
        { title: "Kazi iliyounganishwa", body: "Epuka kuingiza taarifa zilezile katika sehemu tofauti za biashara." },
        { title: "Historia inayoeleweka", body: "Kagua shughuli, hali na mabadiliko muhimu kwa urahisi." },
        { title: "Ripoti za kuaminika", body: "Tumia taarifa zilizosasishwa kufanya maamuzi bora ya kila siku." },
      ],
      bestFor: "Biashara zinazotaka kufanya kazi kwa haraka, kwa usahihi na kwa kutumia taarifa zilizo wazi.",
    },
  };
}

function normalizeFeatures(items?: FeatureContent[] | null, isSwahili = false): Feature[] {
  if (isSwahili) return FEATURES.map(translateFeature);
  if (!Array.isArray(items) || !items.length) return FEATURES;
  const mapped = items.map((item, index) => {
    const title = textFrom(item.title);
    const fallback = FEATURES.find((feature) => feature.title.toLowerCase() === title.toLowerCase()) || FEATURES[index % FEATURES.length];
    const description = textFrom(item.description);
    return {
      icon: ICONS[textFrom(item.iconName)] || fallback.icon,
      title,
      description,
      detail: { ...fallback.detail, tagline: title ? `${title}, connected.` : fallback.detail.tagline, overview: description || fallback.detail.overview },
    };
  }).filter((item) => item.title && item.description);
  const mappedTitles = new Set(mapped.map((feature) => feature.title.toLowerCase()));
  return [...mapped, ...FEATURES.filter((feature) => !mappedTitles.has(feature.title.toLowerCase()))];
}

type Props = { eyebrow?: string | null; title?: string | null; description?: string | null; features?: FeatureContent[] | null };

export default function FeaturesSection({ eyebrow, title, description, features }: Props) {
  const { isSwahili } = useLandingLanguage();
  const visibleFeatures = normalizeFeatures(features, isSwahili);
  const [active, setActive] = useState<Feature | null>(null);
  const ActiveIcon = active?.icon;

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);

  return (
    <section id="features" className="scroll-mt-20 border-t border-white/5 bg-[#070b18] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.055] px-3 py-1.5 text-xs font-semibold text-emerald-300"><span>✣</span>{isSwahili ? "Vipengele" : eyebrow || "Features"}</span>
          <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">{isSwahili ? <>Mfumo mmoja. <span className="text-white/45">Kila shughuli.</span></> : title || <>One platform. <span className="text-white/45">Every workflow.</span></>}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/55">{isSwahili ? "Bofya kadi yoyote kuona maelezo ya jinsi inavyofanya kazi na faida zake kwa biashara yako." : description || "Tap any card for an extensive breakdown of how it works and why it matters."}</p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.title}
                type="button"
                onClick={() => setActive(feature)}
                className={`group relative min-h-[245px] overflow-hidden rounded-[22px] border p-7 text-left transition-all duration-500 hover:-translate-y-1.5 hover:border-emerald-400/40 ${index === 1 ? "border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 via-white/[0.035] to-cyan-500/10" : "border-white/10 bg-white/[0.03]"}`}
              >
                <span className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/0 blur-2xl transition-all duration-700 group-hover:bg-emerald-400/20" />
                <span className="relative grid h-11 w-11 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><Icon size={20} /></span>
                <h3 className="relative mt-6 font-display text-lg font-bold text-white">{feature.title}</h3>
                <p className="relative mt-2 text-sm leading-6 text-white/55">{feature.description}</p>
                <span className="relative mt-6 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">{isSwahili ? "Jifunze zaidi" : "Learn more"} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></span>
              </button>
            );
          })}
        </div>
      </div>

      {active && ActiveIcon && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setActive(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="feature-dialog-title" className="animate-fade-up relative my-6 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1e]/95 text-white shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
            <button type="button" onClick={() => setActive(null)} className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full text-white/55 hover:bg-white/10 hover:text-white" aria-label={isSwahili ? "Funga maelezo" : "Close feature details"}><X size={18} /></button>
            <div className="relative max-h-[88vh] overflow-y-auto p-7 sm:p-9">
              <div className="flex items-center gap-3 pr-10">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300"><ActiveIcon size={23} /></span>
                <div><h3 id="feature-dialog-title" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{active.title}</h3><p className="mt-1 text-sm text-emerald-300">{active.detail.tagline}</p></div>
              </div>
              <p className="mt-6 text-sm leading-7 text-white/70 sm:text-base">{active.detail.overview}</p>
              <div className="mt-6 grid gap-3">
                {active.detail.bullets.map((bullet) => (
                  <div key={bullet.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-3"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-emerald-300"><Check size={12} /></span><div><p className="text-sm font-bold text-white">{bullet.title}</p><p className="mt-1 text-sm leading-6 text-white/55">{bullet.body}</p></div></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">{isSwahili ? "Inafaa kwa" : "Best for"}</p><p className="mt-2 text-sm leading-6 text-white/75">{active.detail.bestFor}</p></div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" onClick={() => setActive(null)} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-emerald-400 px-6 py-3 text-sm font-bold text-[#031b12] hover:bg-emerald-300">{isSwahili ? "Jaribu" : "Try"} {active.title} <ArrowRight size={15} /></Link>
                <button type="button" onClick={() => setActive(null)} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-bold text-white hover:bg-white/[0.08]">{isSwahili ? "Funga" : "Close"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
