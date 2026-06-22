import {
  ReceiptText,
  WalletCards,
  Boxes,
  BarChart3,
  FileText,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { FeatureCard, SectionHeader } from "./LandingDesignSystem";

type FeatureContent = {
  title?: unknown;
  description?: unknown;
  iconName?: unknown;
  imageUrl?: unknown;
};

const iconMap = {
  BarChart3,
  Boxes,
  FileText,
  ReceiptText,
  Smartphone,
  WalletCards,
};

const features = [
  {
    icon: ReceiptText,
    title: "Sales Tracking",
    description:
      "Record every sale in seconds. Know exactly what sold, when, and for how much — all in one searchable history.",
  },
  {
    icon: WalletCards,
    title: "Expense Tracking",
    description:
      "Log rent, transport, stock purchases, and any other cost. Never lose an expense record again.",
  },
  {
    icon: Boxes,
    title: "Product & Stock Management",
    description:
      "Add your products, set quantities, and get alerts when stock runs low before you miss a sale.",
  },
  {
    icon: BarChart3,
    title: "Daily Profit Dashboard",
    description:
      "See your net profit at a glance every day. No spreadsheets, no mental math — just clear numbers.",
  },
  {
    icon: FileText,
    title: "Simple Business Reports",
    description:
      "Weekly and monthly summaries of your sales, expenses, and top-performing products in plain language.",
  },
  {
    icon: Smartphone,
    title: "Mobile-Friendly Design",
    description:
      "Built for phones first. Use BizTrack on your Android or iPhone with no downloads required.",
  },
].map((feature) => ({ ...feature, imageUrl: "" }));

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function normalizeFeatures(items?: FeatureContent[] | null) {
  const dynamicFeatures = Array.isArray(items)
    ? items
        .map((item) => {
          const iconName = textFrom(item.iconName);
          return {
            icon: iconMap[iconName as keyof typeof iconMap] ?? Sparkles,
            title: textFrom(item.title),
            description: textFrom(item.description),
            imageUrl: textFrom(item.imageUrl),
          };
        })
        .filter((item) => item.title && item.description)
    : [];

  return dynamicFeatures.length ? dynamicFeatures : features;
}

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  features?: FeatureContent[] | null;
};

export default function FeaturesSection({ eyebrow, title, description, features: dynamicFeatures }: Props) {
  const visibleFeatures = normalizeFeatures(dynamicFeatures);

  return (
    <section id="features" className="scroll-mt-20 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow={eyebrow || "Everything you need"}
          title={title || "Powerful features, simple enough for anyone"}
          description={description || "BizTrack packs everything a small business owner needs into a clean, easy-to-use interface."}
          align="center"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFeatures.map(({ icon, title, description, imageUrl }) => (
            <FeatureCard key={title} icon={icon} title={title} description={description} imageUrl={imageUrl} />
          ))}
        </div>
      </div>
    </section>
  );
}
