import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  HelpCircle,
  ImagePlus,
  Smartphone,
  Lightbulb,
  Loader2,
  MapPin,
  Megaphone,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAdminLandingContent,
  publishAdminLandingContent,
  updateAdminLandingContent,
  uploadAdminLandingApk,
} from "../../services/adminApi";
import type { LandingPageContent } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type FeatureItem = {
  title: string;
  description: string;
  iconName: string;
  imageUrl: string;
};

type PricingItem = {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonUrl: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type TestimonialItem = {
  name: string;
  business: string;
  message: string;
  role: string;
  avatarUrl: string;
};

type TrustIndicator = {
  label: string;
};

type FooterLink = {
  label: string;
  href: string;
};

type ProblemItem = {
  quote: string;
  detail: string;
};

type SolutionRow = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
};

type HowItWorksStep = {
  number: string;
  title: string;
  description: string;
};

type ProblemSectionState = {
  eyebrow: string;
  title: string;
  description: string;
  items: ProblemItem[];
};

type SolutionSectionState = {
  eyebrow: string;
  title: string;
  description: string;
  rows: SolutionRow[];
};

type HowItWorksSectionState = {
  eyebrow: string;
  title: string;
  description: string;
  steps: HowItWorksStep[];
};

type LandingEditorTab =
  | "hero"
  | "story"
  | "features"
  | "pricing"
  | "faq"
  | "testimonials"
  | "footer"
  | "mobile"
  | "seo";

type LandingEditorState = {
  id?: string | null;
  heroTitle: string;
  heroSubtitle: string;
  heroKicker: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  heroTrustText: string;
  heroImageUrl: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresDescription: string;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingDescription: string;
  testimonialsEyebrow: string;
  testimonialsTitle: string;
  testimonialsDescription: string;
  faqEyebrow: string;
  faqTitle: string;
  faqDescription: string;
  finalCtaKicker: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
  heroTrustIndicators: TrustIndicator[];
  features: FeatureItem[];
  pricing: PricingItem[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  footerLinks: Array<Record<string, unknown>>;
  footerTagline: string;
  footerBadge: string;
  footerProductLinks: FooterLink[];
  footerCompanyLinks: FooterLink[];
  problemSection: ProblemSectionState;
  solutionSection: SolutionSectionState;
  howItWorks: HowItWorksSectionState;
  mobileAppTitle: string;
  mobileAppDescription: string;
  androidAppUrl: string;
  iosAppUrl: string;
  apkFileName: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
};

const fallbackState: LandingEditorState = {
  heroTitle: "",
  heroSubtitle: "",
  heroKicker: "",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
  heroTrustText: "",
  heroImageUrl: "",
  heroTrustIndicators: [],
  featuresEyebrow: "",
  featuresTitle: "",
  featuresDescription: "",
  pricingEyebrow: "",
  pricingTitle: "",
  pricingDescription: "",
  testimonialsEyebrow: "",
  testimonialsTitle: "",
  testimonialsDescription: "",
  faqEyebrow: "",
  faqTitle: "",
  faqDescription: "",
  finalCtaKicker: "",
  finalCtaTitle: "",
  finalCtaDescription: "",
  features: [],
  pricing: [],
  faqs: [],
  testimonials: [],
  footerLinks: [],
  footerTagline: "",
  footerBadge: "",
  footerProductLinks: [],
  footerCompanyLinks: [],
  problemSection: { eyebrow: "", title: "", description: "", items: [] },
  solutionSection: { eyebrow: "", title: "", description: "", rows: [] },
  howItWorks: { eyebrow: "", title: "", description: "", steps: [] },
  mobileAppTitle: "Get BizTrack on your phone",
  mobileAppDescription: "Run your business anywhere with the BizTrack mobile app.",
  androidAppUrl: "",
  iosAppUrl: "",
  apkFileName: "",
  seoTitle: "",
  seoDescription: "",
  isPublished: false,
};

const MAX_LANDING_IMAGE_BYTES = 4 * 1024 * 1024;

const emptyFeature: FeatureItem = { title: "", description: "", iconName: "", imageUrl: "" };
const emptyPricing: PricingItem = {
  name: "",
  price: "",
  description: "",
  features: [""],
  buttonText: "Get Started",
  buttonUrl: "/register",
};
const emptyFaq: FaqItem = { question: "", answer: "" };
const emptyTestimonial: TestimonialItem = { name: "", business: "", message: "", role: "", avatarUrl: "" };
const emptyFooterLink: Record<string, unknown> = { label: "", value: "", href: "" };
const emptyTrustIndicator: TrustIndicator = { label: "" };
const emptyFooterNavLink: FooterLink = { label: "", href: "" };
const emptyProblemItem: ProblemItem = { quote: "", detail: "" };
const emptySolutionRow: SolutionRow = { eyebrow: "", title: "", description: "", bullets: [""] };
const emptyHowItWorksStep: HowItWorksStep = { number: "", title: "", description: "" };
const DEFAULT_REQUIRED_LANDING_COPY = {
  heroTitle: "Simple sales and expense tracking for growing businesses",
  heroSubtitle: "Track sales, expenses, products, inventory, and profit from one easy dashboard built for small business owners.",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function textFrom(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function arrayFrom(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringListFrom(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item ?? "")).filter(Boolean) : [];
}

function sectionHeadingFrom(sec: unknown) {
  if (!sec || typeof sec !== "object" || Array.isArray(sec)) {
    return { eyebrow: "", title: "", description: "" };
  }
  const record = sec as Record<string, unknown>;
  return {
    eyebrow: textFrom(record, ["eyebrow"]),
    title: textFrom(record, ["title"]),
    description: textFrom(record, ["description"]),
  };
}

function editorFromContent(content: LandingPageContent): LandingEditorState {
  return {
    id: content.id,
    heroTitle: content.heroTitle ?? "",
    heroSubtitle: content.heroSubtitle ?? "",
    heroKicker: content.heroKicker ?? "",
    primaryButtonText: content.primaryButtonText ?? "",
    primaryButtonUrl: content.primaryButtonUrl ?? "",
    secondaryButtonText: content.secondaryButtonText ?? "",
    secondaryButtonUrl: content.secondaryButtonUrl ?? "",
    heroTrustText: content.heroTrustText ?? "",
    heroImageUrl: content.heroImageUrl ?? "",
    heroTrustIndicators: arrayFrom(content.heroTrustIndicators).map((item) => ({
      label: textFrom(item, ["label"]),
    })),
    featuresEyebrow: content.featuresEyebrow ?? "",
    featuresTitle: content.featuresTitle ?? "",
    featuresDescription: content.featuresDescription ?? "",
    pricingEyebrow: content.pricingEyebrow ?? "",
    pricingTitle: content.pricingTitle ?? "",
    pricingDescription: content.pricingDescription ?? "",
    testimonialsEyebrow: content.testimonialsEyebrow ?? "",
    testimonialsTitle: content.testimonialsTitle ?? "",
    testimonialsDescription: content.testimonialsDescription ?? "",
    faqEyebrow: content.faqEyebrow ?? "",
    faqTitle: content.faqTitle ?? "",
    faqDescription: content.faqDescription ?? "",
    finalCtaKicker: content.finalCtaKicker ?? "",
    finalCtaTitle: content.finalCtaTitle ?? "",
    finalCtaDescription: content.finalCtaDescription ?? "",
    features: arrayFrom(content.features).map((feature) => ({
      title: textFrom(feature, ["title", "name"]),
      description: textFrom(feature, ["description", "text"]),
      iconName: textFrom(feature, ["iconName", "icon"]),
      imageUrl: textFrom(feature, ["imageUrl", "image", "photoUrl"]),
    })),
    pricing: arrayFrom(content.pricing).map((plan) => ({
      name: textFrom(plan, ["name", "title"]),
      price: textFrom(plan, ["price"]),
      description: textFrom(plan, ["description", "text"]),
      features: stringListFrom(plan.features).length ? stringListFrom(plan.features) : [""],
      buttonText: textFrom(plan, ["buttonText"], "Get Started"),
      buttonUrl: textFrom(plan, ["buttonUrl"], "/register"),
    })),
    faqs: arrayFrom(content.faqs).map((faq) => ({
      question: textFrom(faq, ["question", "title"]),
      answer: textFrom(faq, ["answer", "text"]),
    })),
    testimonials: arrayFrom(content.testimonials).map((testimonial) => ({
      name: textFrom(testimonial, ["name"]),
      business: textFrom(testimonial, ["business", "company"]),
      message: textFrom(testimonial, ["message", "quote", "text"]),
      role: textFrom(testimonial, ["role", "title"]),
      avatarUrl: textFrom(testimonial, ["avatarUrl", "imageUrl", "photoUrl"]),
    })),
    footerLinks: arrayFrom(content.footerLinks),
    footerTagline: content.footerTagline ?? "",
    footerBadge: content.footerBadge ?? "",
    footerProductLinks: arrayFrom(content.footerProductLinks).map((item) => ({
      label: textFrom(item, ["label"]),
      href: textFrom(item, ["href"]),
    })),
    footerCompanyLinks: arrayFrom(content.footerCompanyLinks).map((item) => ({
      label: textFrom(item, ["label"]),
      href: textFrom(item, ["href"]),
    })),
    problemSection: (() => {
      const sec = content.problemSection;
      if (!sec || typeof sec !== "object" || Array.isArray(sec)) return fallbackState.problemSection;
      const record = sec as Record<string, unknown>;
      return {
        ...sectionHeadingFrom(record),
        items: arrayFrom(record.items).map((item) => ({
          quote: textFrom(item, ["quote"]),
          detail: textFrom(item, ["detail"]),
        })),
      };
    })(),
    solutionSection: (() => {
      const sec = content.solutionSection;
      if (!sec || typeof sec !== "object" || Array.isArray(sec)) return fallbackState.solutionSection;
      const record = sec as Record<string, unknown>;
      return {
        ...sectionHeadingFrom(record),
        rows: arrayFrom(record.rows).map((row) => ({
          eyebrow: textFrom(row, ["eyebrow"]),
          title: textFrom(row, ["title"]),
          description: textFrom(row, ["description"]),
          bullets: stringListFrom(row.bullets).length ? stringListFrom(row.bullets) : [""],
        })),
      };
    })(),
    howItWorks: (() => {
      const sec = content.howItWorks;
      if (!sec || typeof sec !== "object" || Array.isArray(sec)) return fallbackState.howItWorks;
      const record = sec as Record<string, unknown>;
      return {
        ...sectionHeadingFrom(record),
        steps: arrayFrom(record.steps).map((step) => ({
          number: textFrom(step, ["number"]),
          title: textFrom(step, ["title"]),
          description: textFrom(step, ["description"]),
        })),
      };
    })(),
    mobileAppTitle: content.mobileAppTitle ?? "",
    mobileAppDescription: content.mobileAppDescription ?? "",
    androidAppUrl: content.androidAppUrl ?? "",
    iosAppUrl: content.iosAppUrl ?? "",
    apkFileName: content.apkFileName ?? "",
    seoTitle: content.seoTitle ?? "",
    seoDescription: content.seoDescription ?? "",
    isPublished: Boolean(content.isPublished),
  };
}

function payloadFromState(state: LandingEditorState, isPublished: boolean): LandingPageContent {
  return {
    id: state.id,
    heroTitle: state.heroTitle.trim() || DEFAULT_REQUIRED_LANDING_COPY.heroTitle,
    heroSubtitle: state.heroSubtitle.trim() || DEFAULT_REQUIRED_LANDING_COPY.heroSubtitle,
    heroKicker: state.heroKicker.trim() || null,
    primaryButtonText: state.primaryButtonText.trim() || DEFAULT_REQUIRED_LANDING_COPY.primaryButtonText,
    primaryButtonUrl: state.primaryButtonUrl.trim() || DEFAULT_REQUIRED_LANDING_COPY.primaryButtonUrl,
    secondaryButtonText: state.secondaryButtonText.trim() || DEFAULT_REQUIRED_LANDING_COPY.secondaryButtonText,
    secondaryButtonUrl: state.secondaryButtonUrl.trim() || DEFAULT_REQUIRED_LANDING_COPY.secondaryButtonUrl,
    heroTrustText: state.heroTrustText.trim() || null,
    heroImageUrl: state.heroImageUrl.trim() || null,
    featuresEyebrow: state.featuresEyebrow.trim() || null,
    featuresTitle: state.featuresTitle.trim() || null,
    featuresDescription: state.featuresDescription.trim() || null,
    pricingEyebrow: state.pricingEyebrow.trim() || null,
    pricingTitle: state.pricingTitle.trim() || null,
    pricingDescription: state.pricingDescription.trim() || null,
    testimonialsEyebrow: state.testimonialsEyebrow.trim() || null,
    testimonialsTitle: state.testimonialsTitle.trim() || null,
    testimonialsDescription: state.testimonialsDescription.trim() || null,
    faqEyebrow: state.faqEyebrow.trim() || null,
    faqTitle: state.faqTitle.trim() || null,
    faqDescription: state.faqDescription.trim() || null,
    finalCtaKicker: state.finalCtaKicker.trim() || null,
    finalCtaTitle: state.finalCtaTitle.trim() || null,
    finalCtaDescription: state.finalCtaDescription.trim() || null,
    features: state.features
      .filter((feature) => feature.title.trim() || feature.description.trim())
      .map((feature) => ({
        title: feature.title.trim(),
        description: feature.description.trim(),
        iconName: feature.iconName.trim() || undefined,
        imageUrl: feature.imageUrl.trim() || undefined,
      })),
    pricing: state.pricing
      .filter((plan) => plan.name.trim() || plan.price.trim())
      .map((plan) => ({
        name: plan.name.trim(),
        price: plan.price.trim(),
        description: plan.description.trim(),
        features: plan.features.map((feature) => feature.trim()).filter(Boolean),
        buttonText: plan.buttonText.trim(),
        buttonUrl: plan.buttonUrl.trim(),
      })),
    faqs: state.faqs
      .filter((faq) => faq.question.trim() || faq.answer.trim())
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() })),
    testimonials: state.testimonials
      .filter((testimonial) => testimonial.name.trim() || testimonial.message.trim())
      .map((testimonial) => ({
        name: testimonial.name.trim(),
        business: testimonial.business.trim(),
        message: testimonial.message.trim(),
        role: testimonial.role.trim() || undefined,
        avatarUrl: testimonial.avatarUrl.trim() || undefined,
      })),
    footerLinks: state.footerLinks
      .map((item) => ({
        label: textFrom(item, ["label", "title", "type"]).trim(),
        value: textFrom(item, ["value", "text", "href", "url"]).trim(),
        href: textFrom(item, ["href", "url"]).trim(),
      }))
      .filter((item) => item.label || item.value || item.href),
    heroTrustIndicators: state.heroTrustIndicators
      .filter((item) => item.label.trim())
      .map((item) => ({ label: item.label.trim() })),
    footerTagline: state.footerTagline.trim() || null,
    footerBadge: state.footerBadge.trim() || null,
    footerProductLinks: state.footerProductLinks
      .filter((item) => item.label.trim() || item.href.trim())
      .map((item) => ({ label: item.label.trim(), href: item.href.trim() })),
    footerCompanyLinks: state.footerCompanyLinks
      .filter((item) => item.label.trim() || item.href.trim())
      .map((item) => ({ label: item.label.trim(), href: item.href.trim() })),
    problemSection: {
      eyebrow: state.problemSection.eyebrow.trim() || undefined,
      title: state.problemSection.title.trim() || undefined,
      description: state.problemSection.description.trim() || undefined,
      items: state.problemSection.items
        .filter((item) => item.quote.trim() || item.detail.trim())
        .map((item) => ({ quote: item.quote.trim(), detail: item.detail.trim() })),
    },
    solutionSection: {
      eyebrow: state.solutionSection.eyebrow.trim() || undefined,
      title: state.solutionSection.title.trim() || undefined,
      description: state.solutionSection.description.trim() || undefined,
      rows: state.solutionSection.rows
        .filter((row) => row.title.trim())
        .map((row) => ({
          eyebrow: row.eyebrow.trim() || undefined,
          title: row.title.trim(),
          description: row.description.trim(),
          bullets: row.bullets.map((b) => b.trim()).filter(Boolean),
        })),
    },
    howItWorks: {
      eyebrow: state.howItWorks.eyebrow.trim() || undefined,
      title: state.howItWorks.title.trim() || undefined,
      description: state.howItWorks.description.trim() || undefined,
      steps: state.howItWorks.steps
        .filter((step) => step.title.trim())
        .map((step) => ({
          number: step.number.trim() || undefined,
          title: step.title.trim(),
          description: step.description.trim(),
        })),
    },
    mobileAppTitle: state.mobileAppTitle.trim() || null,
    mobileAppDescription: state.mobileAppDescription.trim() || null,
    androidAppUrl: state.androidAppUrl.trim() || null,
    iosAppUrl: state.iosAppUrl.trim() || null,
    apkFileName: state.apkFileName || null,
    seoTitle: state.seoTitle.trim() || null,
    seoDescription: state.seoDescription.trim() || null,
    isPublished,
  };
}

function validateState(state: LandingEditorState) {
  for (const tab of ["hero", "story", "features", "pricing", "faq", "testimonials", "mobile", "footer", "seo"] satisfies LandingEditorTab[]) {
    const tabError = validateTab(state, tab);
    if (tabError) return tabError;
  }
  return null;
}

function validateTab(state: LandingEditorState, tab: LandingEditorTab) {
  if (tab === "hero") {
    if (state.heroTitle.trim().length < 2) return "Hero title is required.";
    if (state.heroSubtitle.trim().length < 2) return "Hero subtitle is required.";
    if (!state.primaryButtonText.trim() || !state.primaryButtonUrl.trim()) return "Primary button text and URL are required.";
    if (!state.secondaryButtonText.trim() || !state.secondaryButtonUrl.trim()) return "Secondary button text and URL are required.";
  }

  if (tab === "story") {
    if (state.problemSection.items.some((item) => !item.quote.trim() || !item.detail.trim())) {
      return "Every problem card needs a quote and detail.";
    }
    if (state.solutionSection.rows.some((row) => !row.title.trim() || !row.description.trim())) {
      return "Every solution row needs a title and description.";
    }
    if (state.howItWorks.steps.some((step) => !step.title.trim() || !step.description.trim())) {
      return "Every how-it-works step needs a title and description.";
    }
  }

  if (tab === "features" && state.features.some((feature) => !feature.title.trim() || !feature.description.trim())) {
    return "Every feature needs a title and description.";
  }

  if (tab === "pricing" && state.pricing.some((plan) => !plan.name.trim() || !plan.price.trim() || !plan.description.trim())) {
    return "Every pricing card needs a name, price, and description.";
  }

  if (tab === "faq" && state.faqs.some((faq) => !faq.question.trim() || !faq.answer.trim())) {
    return "Every FAQ needs a question and answer.";
  }

  if (tab === "testimonials" && state.testimonials.some((testimonial) => !testimonial.name.trim() || !testimonial.message.trim())) {
    return "Every testimonial needs a name and message.";
  }

  if (tab === "footer") {
    if (state.footerLinks.some((item) => !textFrom(item, ["label", "title", "type"]).trim() || !textFrom(item, ["value", "text", "href", "url"]).trim())) {
      return "Every footer contact item needs a label and value.";
    }
    if (state.footerProductLinks.some((item) => !item.label.trim() || !item.href.trim())) {
      return "Every footer product link needs a label and URL.";
    }
    if (state.footerCompanyLinks.some((item) => !item.label.trim() || !item.href.trim())) {
      return "Every footer company link needs a label and URL.";
    }
  }

  return null;
}

function PageMessage({ type, text }: { type: "success" | "error"; text: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  const classes = type === "success" ? "border-leaf/20 bg-mint text-leaf" : "border-red-200 bg-red-50 text-red-600";

  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export default function AdminLandingPagePage() {
  const [state, setState] = useState<LandingEditorState>(fallbackState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<LandingEditorTab>("hero");
  const [savingTab, setSavingTab] = useState<LandingEditorTab | null>(null);
  const [uploadingApk, setUploadingApk] = useState(false);

  useEffect(() => {
    let alive = true;

    getAdminLandingContent()
      .then((content) => {
        if (alive) setState(editorFromContent(content));
      })
      .catch((error) => {
        if (alive) setMessage({ type: "error", text: getApiErrorMessage(error) });
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const statusText = useMemo(() => (state.isPublished ? "Published" : "Draft"), [state.isPublished]);
  const editorTabs = useMemo(
    () => [
      { id: "hero" as const, label: "Hero", icon: <Megaphone size={16} aria-hidden="true" /> },
      { id: "mobile" as const, label: "Mobile app", icon: <Smartphone size={16} aria-hidden="true" /> },
      { id: "story" as const, label: "Story", icon: <Lightbulb size={16} aria-hidden="true" /> },
      { id: "features" as const, label: "Features", icon: <Sparkles size={16} aria-hidden="true" /> },
      { id: "pricing" as const, label: "Pricing", icon: <FileText size={16} aria-hidden="true" /> },
      { id: "faq" as const, label: "FAQ", icon: <HelpCircle size={16} aria-hidden="true" /> },
      { id: "testimonials" as const, label: "Stories", icon: <Star size={16} aria-hidden="true" /> },
      { id: "footer" as const, label: "Footer", icon: <MapPin size={16} aria-hidden="true" /> },
      { id: "seo" as const, label: "SEO & CTA", icon: <Search size={16} aria-hidden="true" /> },
    ],
    [],
  );
  const activeTabLabel = editorTabs.find((tab) => tab.id === activeTab)?.label ?? "Section";

  function update<K extends keyof LandingEditorState>(key: K, value: LandingEditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function imageFromFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Choose a valid image file." });
      return null;
    }

    if (file.size > MAX_LANDING_IMAGE_BYTES) {
      setMessage({ type: "error", text: "Image must be under 4 MB." });
      return null;
    }

    return readFileAsDataUrl(file);
  }

  async function saveContent(isPublished: boolean, successText: string, validationScope: LandingEditorTab | "all" = "all") {
    const validationError = validationScope === "all" ? validateState(state) : validateTab(state, validationScope);
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return null;
    }

    const saved = await updateAdminLandingContent(payloadFromState(state, isPublished));
    setState(editorFromContent(saved));
    setMessage({ type: "success", text: successText });
    return saved;
  }

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSavingTab(activeTab);
    setMessage(null);

    try {
      await saveContent(false, `${activeTabLabel} saved.`, activeTab);
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
      setSavingTab(null);
    }
  }

  async function saveTab(tab: LandingEditorTab) {
    setIsSaving(true);
    setSavingTab(tab);
    setMessage(null);

    try {
      const tabLabel = editorTabs.find((item) => item.id === tab)?.label ?? "Section";
      await saveContent(false, `${tabLabel} saved.`, tab);
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
      setSavingTab(null);
    }
  }

  async function publish() {
    setIsPublishing(true);
    setMessage(null);

    try {
      const saved = await saveContent(true, "Landing page published.");
      if (saved) {
        const published = await publishAdminLandingContent();
        setState(editorFromContent(published));
        setMessage({ type: "success", text: "Landing page published." });
      }
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsPublishing(false);
    }
  }

  async function uploadApk(file: File) {
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setMessage({ type: "error", text: "Choose an Android .apk file." });
      return;
    }
    setUploadingApk(true);
    setMessage(null);
    try {
      const saved = await uploadAdminLandingApk(file);
      setState(editorFromContent(saved));
      setMessage({ type: "success", text: "APK uploaded. Publish the landing page when you are ready." });
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setUploadingApk(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-leaf">SUPER_ADMIN</p>
          <h1 className="mt-1 font-display text-xl font-bold text-ink">Landing page content</h1>
          <p className="mt-1 text-sm font-semibold text-ink/45">
            Edit public page copy, pricing, FAQs, testimonials, and SEO without touching code.
          </p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-extrabold ${
            state.isPublished ? "border-leaf/20 bg-mint text-leaf" : "border-amber-200 bg-amber-50 text-amber-700"
          }`}>
            {statusText}
          </span>
        </div>
        <div className="grid gap-2 sm:flex">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#eef8f4]"
          >
            <Eye size={16} aria-hidden="true" />
            Preview Landing Page
          </Link>
          <button
            type="submit"
            form="landing-page-form"
            disabled={isSaving || isPublishing || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-4 py-2.5 text-sm font-extrabold text-leaf hover:bg-leaf/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
            Save {activeTabLabel}
          </button>
          <button
            type="button"
            onClick={publish}
            disabled={isSaving || isPublishing || isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            Publish
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {message && <PageMessage type={message.type} text={message.text} />}

        {isLoading ? (
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-ink/50">
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
              Loading landing page content...
            </div>
          </div>
        ) : (
          <form id="landing-page-form" onSubmit={saveDraft} className="space-y-4">
            <div className="sticky top-0 z-20 overflow-x-auto border-b border-ink/10 bg-cloud/95 py-2 backdrop-blur">
              <div className="flex min-w-max gap-2">
                {editorTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold transition-colors ${
                        isActive
                          ? "border-leaf bg-leaf text-white shadow-sm"
                          : "border-ink/10 bg-white text-ink/55 hover:bg-[#eef8f4]"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => void saveTab(activeTab)}
                  disabled={isSaving || isPublishing}
                  className="ml-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-extrabold text-leaf hover:bg-leaf/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTab === activeTab ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
                  Save {activeTabLabel}
                </button>
              </div>
            </div>

            {activeTab === "hero" && (
            <EditorSection title="Hero section" icon={<Megaphone size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="Hero kicker" value={state.heroKicker} onChange={(value) => update("heroKicker", value)} placeholder="Built for small businesses" />
                <TextField label="Hero title" value={state.heroTitle} onChange={(value) => update("heroTitle", value)} required />
                <TextField label="Primary button text" value={state.primaryButtonText} onChange={(value) => update("primaryButtonText", value)} required />
                <TextArea label="Hero subtitle" value={state.heroSubtitle} onChange={(value) => update("heroSubtitle", value)} rows={3} required className="lg:col-span-2" />
                <TextField label="Primary button URL" value={state.primaryButtonUrl} onChange={(value) => update("primaryButtonUrl", value)} required />
                <TextField label="Secondary button text" value={state.secondaryButtonText} onChange={(value) => update("secondaryButtonText", value)} required />
                <TextField label="Secondary button URL" value={state.secondaryButtonUrl} onChange={(value) => update("secondaryButtonUrl", value)} required />
                <TextArea label="Trust text" value={state.heroTrustText} onChange={(value) => update("heroTrustText", value)} rows={2} className="lg:col-span-2" />
              </div>
              <div className="mt-4 rounded-lg border border-ink/8 bg-[#f7faf9] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">Trust indicator chips</p>
                  <button
                    type="button"
                    onClick={() => update("heroTrustIndicators", [...state.heroTrustIndicators, { ...emptyTrustIndicator }])}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-xs font-extrabold text-ink/55 hover:bg-[#eef8f4]"
                  >
                    <Plus size={13} aria-hidden="true" />
                    Add chip
                  </button>
                </div>
                <div className="grid gap-2">
                  {state.heroTrustIndicators.map((indicator, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        value={indicator.label}
                        onChange={(e) => update("heroTrustIndicators", state.heroTrustIndicators.map((it, i) => i === index ? { ...it, label: e.target.value } : it))}
                        placeholder="e.g. Easy to use"
                        className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                      />
                      <button
                        type="button"
                        onClick={() => update("heroTrustIndicators", state.heroTrustIndicators.filter((_, i) => i !== index))}
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                        aria-label="Remove chip"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {!state.heroTrustIndicators.length && (
                    <p className="text-xs text-ink/35">No chips yet. Defaults will be shown.</p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 mt-4">
                <ImageField
                  label="Hero picture"
                  value={state.heroImageUrl}
                  onChange={(value) => update("heroImageUrl", value)}
                  onFile={async (file) => {
                    const dataUrl = await imageFromFile(file);
                    if (dataUrl) update("heroImageUrl", dataUrl);
                  }}
                  onClear={() => update("heroImageUrl", "")}
                />
              </div>
            </EditorSection>
            )}

            {activeTab === "story" && (
            <>
            {/* Problem section */}
            <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-leaf"><XCircle size={18} aria-hidden="true" /></span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">Problem section</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/45">Highlight the pain points your product solves. Leave empty to use default content.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => update("problemSection", { ...state.problemSection, items: [...state.problemSection.items, { ...emptyProblemItem }] })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-extrabold text-leaf hover:bg-leaf/10"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add problem card
                </button>
              </div>
              <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <TextField label="Eyebrow" value={state.problemSection.eyebrow} onChange={(v) => update("problemSection", { ...state.problemSection, eyebrow: v })} placeholder="Sound familiar?" />
                <TextField label="Heading" value={state.problemSection.title} onChange={(v) => update("problemSection", { ...state.problemSection, title: v })} placeholder="Running a business blind is stressful" />
                <TextArea label="Subheading" value={state.problemSection.description} onChange={(v) => update("problemSection", { ...state.problemSection, description: v })} rows={2} />
              </div>
              <div className="grid gap-3">
                {state.problemSection.items.map((item, index) => (
                  <RepeaterCard
                    key={index}
                    title={`Problem ${index + 1}`}
                    onDelete={() => update("problemSection", { ...state.problemSection, items: state.problemSection.items.filter((_, i) => i !== index) })}
                  >
                    <div className="grid gap-3">
                      <TextField label="Quote" value={item.quote} onChange={(v) => updateProblemItem(index, "quote", v)} placeholder="I don't know if I made profit today" />
                      <TextArea label="Detail" value={item.detail} onChange={(v) => updateProblemItem(index, "detail", v)} rows={2} />
                    </div>
                  </RepeaterCard>
                ))}
                {!state.problemSection.items.length && <EmptyList label="No problem cards yet. Default content will be shown on the public page." />}
              </div>
            </section>

            {/* Solution section */}
            <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-leaf"><Lightbulb size={18} aria-hidden="true" /></span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">Solution section</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/45">Alternating rows showcasing how your product addresses each problem. Leave empty to use defaults.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => update("solutionSection", { ...state.solutionSection, rows: [...state.solutionSection.rows, { ...emptySolutionRow, bullets: [""] }] })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-extrabold text-leaf hover:bg-leaf/10"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add row
                </button>
              </div>
              <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <TextField label="Eyebrow" value={state.solutionSection.eyebrow} onChange={(v) => update("solutionSection", { ...state.solutionSection, eyebrow: v })} placeholder="The solution" />
                <TextField label="Heading" value={state.solutionSection.title} onChange={(v) => update("solutionSection", { ...state.solutionSection, title: v })} placeholder="BizTrack gives you the full picture." />
                <TextArea label="Subheading" value={state.solutionSection.description} onChange={(v) => update("solutionSection", { ...state.solutionSection, description: v })} rows={2} />
              </div>
              <div className="grid gap-3">
                {state.solutionSection.rows.map((row, rowIndex) => (
                  <RepeaterCard
                    key={rowIndex}
                    title={`Row ${rowIndex + 1}`}
                    onDelete={() => update("solutionSection", { ...state.solutionSection, rows: state.solutionSection.rows.filter((_, i) => i !== rowIndex) })}
                  >
                    <div className="grid gap-3 lg:grid-cols-2">
                      <TextField label="Eyebrow" value={row.eyebrow} onChange={(v) => updateSolutionRow(rowIndex, "eyebrow", v)} placeholder="Money in" />
                      <TextField label="Title" value={row.title} onChange={(v) => updateSolutionRow(rowIndex, "title", v)} required />
                      <TextArea label="Description" value={row.description} onChange={(v) => updateSolutionRow(rowIndex, "description", v)} rows={2} className="lg:col-span-2" />
                    </div>
                    <div className="mt-3 rounded-lg bg-[#f7faf9] p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">Bullet points</p>
                        <button
                          type="button"
                          onClick={() => updateSolutionRowBullets(rowIndex, [...row.bullets, ""])}
                          className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-xs font-extrabold text-ink/55 hover:bg-[#eef8f4]"
                        >
                          <Plus size={13} aria-hidden="true" />
                          Add bullet
                        </button>
                      </div>
                      <div className="grid gap-2">
                        {row.bullets.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                            <input
                              value={bullet}
                              onChange={(e) => {
                                const next = [...row.bullets];
                                next[bulletIndex] = e.target.value;
                                updateSolutionRowBullets(rowIndex, next);
                              }}
                              className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                            />
                            <button
                              type="button"
                              onClick={() => updateSolutionRowBullets(rowIndex, row.bullets.filter((_, i) => i !== bulletIndex))}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                              aria-label="Remove bullet"
                            >
                              <Trash2 size={15} aria-hidden="true" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </RepeaterCard>
                ))}
                {!state.solutionSection.rows.length && <EmptyList label="No solution rows yet. Default content will be shown on the public page." />}
              </div>
            </section>
            </>
            )}

            {activeTab === "features" && (
            <>
            <EditorSection title="Features heading" icon={<FileText size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-3">
                <TextField label="Features eyebrow" value={state.featuresEyebrow} onChange={(value) => update("featuresEyebrow", value)} />
                <TextField label="Features title" value={state.featuresTitle} onChange={(value) => update("featuresTitle", value)} />
                <TextArea label="Features description" value={state.featuresDescription} onChange={(value) => update("featuresDescription", value)} rows={2} />
              </div>
            </EditorSection>

            <DynamicSection
              title="Features section"
              description="Add, edit, or delete feature cards shown on the public page."
              icon={<Sparkles size={18} aria-hidden="true" />}
              addLabel="Add feature"
              onAdd={() => update("features", [...state.features, { ...emptyFeature }])}
            >
              {state.features.map((feature, index) => (
                <RepeaterCard
                  key={index}
                  title={`Feature ${index + 1}`}
                  onDelete={() => update("features", state.features.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField
                      label="Title"
                      value={feature.title}
                      onChange={(value) => updateFeature(index, "title", value)}
                      required
                    />
                    <TextField
                      label="Icon name"
                      value={feature.iconName}
                      onChange={(value) => updateFeature(index, "iconName", value)}
                      placeholder="ReceiptText"
                    />
                    <ImageField
                      label="Feature picture"
                      value={feature.imageUrl}
                      onChange={(value) => updateFeature(index, "imageUrl", value)}
                      onFile={async (file) => {
                        const dataUrl = await imageFromFile(file);
                        if (dataUrl) updateFeature(index, "imageUrl", dataUrl);
                      }}
                      onClear={() => updateFeature(index, "imageUrl", "")}
                    />
                    <TextArea
                      label="Description"
                      value={feature.description}
                      onChange={(value) => updateFeature(index, "description", value)}
                      rows={2}
                      required
                      className="lg:col-span-2"
                    />
                  </div>
                </RepeaterCard>
              ))}
              {!state.features.length && <EmptyList label="No features yet." />}
            </DynamicSection>
            </>
            )}

            {activeTab === "story" && (
            <>
            {/* How It Works section */}
            <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-leaf"><ClipboardList size={18} aria-hidden="true" /></span>
                  <div>
                    <h2 className="font-display text-base font-bold text-ink">How it works</h2>
                    <p className="mt-1 text-sm font-semibold text-ink/45">Numbered steps showing users how to get started. Leave empty to use default content.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => update("howItWorks", { ...state.howItWorks, steps: [...state.howItWorks.steps, { ...emptyHowItWorksStep, number: String(state.howItWorks.steps.length + 1).padStart(2, "0") }] })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-extrabold text-leaf hover:bg-leaf/10"
                >
                  <Plus size={16} aria-hidden="true" />
                  Add step
                </button>
              </div>
              <div className="mb-4 grid gap-4 lg:grid-cols-3">
                <TextField label="Eyebrow" value={state.howItWorks.eyebrow} onChange={(v) => update("howItWorks", { ...state.howItWorks, eyebrow: v })} placeholder="How it works" />
                <TextField label="Heading" value={state.howItWorks.title} onChange={(v) => update("howItWorks", { ...state.howItWorks, title: v })} placeholder="Up and running in minutes" />
                <TextArea label="Subheading" value={state.howItWorks.description} onChange={(v) => update("howItWorks", { ...state.howItWorks, description: v })} rows={2} />
              </div>
              <div className="grid gap-3">
                {state.howItWorks.steps.map((step, index) => (
                  <RepeaterCard
                    key={index}
                    title={`Step ${index + 1}`}
                    onDelete={() => update("howItWorks", { ...state.howItWorks, steps: state.howItWorks.steps.filter((_, i) => i !== index) })}
                  >
                    <div className="grid gap-3 lg:grid-cols-[80px_1fr]">
                      <TextField label="Step number" value={step.number} onChange={(v) => updateHowItWorksStep(index, "number", v)} placeholder="01" />
                      <TextField label="Title" value={step.title} onChange={(v) => updateHowItWorksStep(index, "title", v)} required />
                      <TextArea label="Description" value={step.description} onChange={(v) => updateHowItWorksStep(index, "description", v)} rows={2} className="lg:col-span-2" />
                    </div>
                  </RepeaterCard>
                ))}
                {!state.howItWorks.steps.length && <EmptyList label="No steps yet. Default content will be shown on the public page." />}
              </div>
            </section>
            </>
            )}

            {activeTab === "pricing" && (
            <>
            <EditorSection title="Pricing heading" icon={<FileText size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-3">
                <TextField label="Pricing eyebrow" value={state.pricingEyebrow} onChange={(value) => update("pricingEyebrow", value)} />
                <TextField label="Pricing title" value={state.pricingTitle} onChange={(value) => update("pricingTitle", value)} />
                <TextArea label="Pricing description" value={state.pricingDescription} onChange={(value) => update("pricingDescription", value)} rows={2} />
              </div>
            </EditorSection>
            <DynamicSection
              title="Pricing section"
              description="Manage public pricing cards and their call-to-action links."
              icon={<FileText size={18} aria-hidden="true" />}
              addLabel="Add pricing card"
              onAdd={() => update("pricing", [...state.pricing, { ...emptyPricing, features: [""] }])}
            >
              {state.pricing.map((plan, index) => (
                <RepeaterCard
                  key={index}
                  title={`Pricing card ${index + 1}`}
                  onDelete={() => update("pricing", state.pricing.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField label="Name" value={plan.name} onChange={(value) => updatePricing(index, "name", value)} required />
                    <TextField label="Price" value={plan.price} onChange={(value) => updatePricing(index, "price", value)} required />
                    <TextArea label="Description" value={plan.description} onChange={(value) => updatePricing(index, "description", value)} rows={2} required className="lg:col-span-2" />
                    <TextField label="Button text" value={plan.buttonText} onChange={(value) => updatePricing(index, "buttonText", value)} />
                    <TextField label="Button URL" value={plan.buttonUrl} onChange={(value) => updatePricing(index, "buttonUrl", value)} />
                  </div>
                  <div className="mt-3 rounded-lg bg-[#f7faf9] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">Features list</p>
                      <button
                        type="button"
                        onClick={() => updatePricingFeatures(index, [...plan.features, ""])}
                        className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-xs font-extrabold text-ink/55 hover:bg-[#eef8f4]"
                      >
                        <Plus size={13} aria-hidden="true" />
                        Add item
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                          <input
                            value={feature}
                            onChange={(event) => {
                              const nextFeatures = [...plan.features];
                              nextFeatures[featureIndex] = event.target.value;
                              updatePricingFeatures(index, nextFeatures);
                            }}
                            className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
                          />
                          <button
                            type="button"
                            onClick={() => updatePricingFeatures(index, plan.features.filter((_, itemIndex) => itemIndex !== featureIndex))}
                            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100"
                            aria-label="Delete pricing feature"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </RepeaterCard>
              ))}
              {!state.pricing.length && <EmptyList label="No pricing cards yet." />}
            </DynamicSection>
            </>
            )}

            {activeTab === "faq" && (
            <>
            <EditorSection title="FAQ heading" icon={<HelpCircle size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-3">
                <TextField label="FAQ eyebrow" value={state.faqEyebrow} onChange={(value) => update("faqEyebrow", value)} />
                <TextField label="FAQ title" value={state.faqTitle} onChange={(value) => update("faqTitle", value)} />
                <TextArea label="FAQ description" value={state.faqDescription} onChange={(value) => update("faqDescription", value)} rows={2} />
              </div>
            </EditorSection>
            <DynamicSection
              title="FAQ section"
              description="Questions and answers displayed near the bottom of the public page."
              icon={<HelpCircle size={18} aria-hidden="true" />}
              addLabel="Add FAQ"
              onAdd={() => update("faqs", [...state.faqs, { ...emptyFaq }])}
            >
              {state.faqs.map((faq, index) => (
                <RepeaterCard
                  key={index}
                  title={`FAQ ${index + 1}`}
                  onDelete={() => update("faqs", state.faqs.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <div className="grid gap-3">
                    <TextField label="Question" value={faq.question} onChange={(value) => updateFaq(index, "question", value)} required />
                    <TextArea label="Answer" value={faq.answer} onChange={(value) => updateFaq(index, "answer", value)} rows={2} required />
                  </div>
                </RepeaterCard>
              ))}
              {!state.faqs.length && <EmptyList label="No FAQs yet." />}
            </DynamicSection>
            </>
            )}

            {activeTab === "testimonials" && (
            <>
            <EditorSection title="Testimonials heading" icon={<Star size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-3">
                <TextField label="Testimonials eyebrow" value={state.testimonialsEyebrow} onChange={(value) => update("testimonialsEyebrow", value)} />
                <TextField label="Testimonials title" value={state.testimonialsTitle} onChange={(value) => update("testimonialsTitle", value)} />
                <TextArea label="Testimonials description" value={state.testimonialsDescription} onChange={(value) => update("testimonialsDescription", value)} rows={2} />
              </div>
            </EditorSection>
            <DynamicSection
              title="Testimonials"
              description="Optional customer quotes for the public landing page."
              icon={<Star size={18} aria-hidden="true" />}
              addLabel="Add testimonial"
              onAdd={() => update("testimonials", [...state.testimonials, { ...emptyTestimonial }])}
            >
              {state.testimonials.map((testimonial, index) => (
                <RepeaterCard
                  key={index}
                  title={`Testimonial ${index + 1}`}
                  onDelete={() => update("testimonials", state.testimonials.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField label="Name" value={testimonial.name} onChange={(value) => updateTestimonial(index, "name", value)} required />
                    <TextField label="Business" value={testimonial.business} onChange={(value) => updateTestimonial(index, "business", value)} />
                    <TextField label="Role" value={testimonial.role} onChange={(value) => updateTestimonial(index, "role", value)} placeholder="Owner" />
                    <ImageField
                      label="Avatar"
                      value={testimonial.avatarUrl}
                      onChange={(value) => updateTestimonial(index, "avatarUrl", value)}
                      onFile={async (file) => {
                        const dataUrl = await imageFromFile(file);
                        if (dataUrl) updateTestimonial(index, "avatarUrl", dataUrl);
                      }}
                      onClear={() => updateTestimonial(index, "avatarUrl", "")}
                    />
                    <TextArea label="Message" value={testimonial.message} onChange={(value) => updateTestimonial(index, "message", value)} rows={3} required className="lg:col-span-2" />
                  </div>
                </RepeaterCard>
              ))}
              {!state.testimonials.length && <EmptyList label="No testimonials yet." />}
            </DynamicSection>
            </>
            )}

            {activeTab === "footer" && (
            <>
            <DynamicSection
              title="Footer contact"
              description="Manage the contact details shown in the public footer."
              icon={<MapPin size={18} aria-hidden="true" />}
              addLabel="Add contact"
              onAdd={() => update("footerLinks", [...state.footerLinks, { ...emptyFooterLink }])}
            >
              {state.footerLinks.map((item, index) => (
                <RepeaterCard
                  key={index}
                  title={`Contact ${index + 1}`}
                  onDelete={() => update("footerLinks", state.footerLinks.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-3">
                    <TextField
                      label="Label"
                      value={textFrom(item, ["label", "title", "type"])}
                      onChange={(value) => updateFooterLink(index, "label", value)}
                      placeholder="Email"
                      required
                    />
                    <TextField
                      label="Value"
                      value={textFrom(item, ["value", "text", "href", "url"])}
                      onChange={(value) => updateFooterLink(index, "value", value)}
                      placeholder="support@biztrack.co"
                      required
                    />
                    <TextField
                      label="Link"
                      value={textFrom(item, ["href", "url"])}
                      onChange={(value) => updateFooterLink(index, "href", value)}
                      placeholder="mailto:support@biztrack.co"
                    />
                  </div>
                </RepeaterCard>
              ))}
              {!state.footerLinks.length && <EmptyList label="No footer contacts yet. Defaults will be shown on the public page." />}
            </DynamicSection>

            <EditorSection title="Footer settings" icon={<MapPin size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea label="Footer tagline" value={state.footerTagline} onChange={(value) => update("footerTagline", value)} rows={2} className="lg:col-span-2" />
                <TextField label="Footer badge text" value={state.footerBadge} onChange={(value) => update("footerBadge", value)} placeholder="Free to get started" />
              </div>
            </EditorSection>

            <DynamicSection
              title="Footer product links"
              description="Navigation links shown in the Product column of the footer."
              icon={<FileText size={18} aria-hidden="true" />}
              addLabel="Add link"
              onAdd={() => update("footerProductLinks", [...state.footerProductLinks, { ...emptyFooterNavLink }])}
            >
              {state.footerProductLinks.map((item, index) => (
                <RepeaterCard
                  key={index}
                  title={`Link ${index + 1}`}
                  onDelete={() => update("footerProductLinks", state.footerProductLinks.filter((_, i) => i !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField label="Label" value={item.label} onChange={(v) => update("footerProductLinks", state.footerProductLinks.map((it, i) => i === index ? { ...it, label: v } : it))} placeholder="Features" />
                    <TextField label="URL / anchor" value={item.href} onChange={(v) => update("footerProductLinks", state.footerProductLinks.map((it, i) => i === index ? { ...it, href: v } : it))} placeholder="#features" />
                  </div>
                </RepeaterCard>
              ))}
              {!state.footerProductLinks.length && <EmptyList label="No product links yet. Defaults will be shown." />}
            </DynamicSection>

            <DynamicSection
              title="Footer company links"
              description="Navigation links shown in the Company column of the footer."
              icon={<FileText size={18} aria-hidden="true" />}
              addLabel="Add link"
              onAdd={() => update("footerCompanyLinks", [...state.footerCompanyLinks, { ...emptyFooterNavLink }])}
            >
              {state.footerCompanyLinks.map((item, index) => (
                <RepeaterCard
                  key={index}
                  title={`Link ${index + 1}`}
                  onDelete={() => update("footerCompanyLinks", state.footerCompanyLinks.filter((_, i) => i !== index))}
                >
                  <div className="grid gap-3 lg:grid-cols-2">
                    <TextField label="Label" value={item.label} onChange={(v) => update("footerCompanyLinks", state.footerCompanyLinks.map((it, i) => i === index ? { ...it, label: v } : it))} placeholder="About" />
                    <TextField label="URL / anchor" value={item.href} onChange={(v) => update("footerCompanyLinks", state.footerCompanyLinks.map((it, i) => i === index ? { ...it, href: v } : it))} placeholder="#" />
                  </div>
                </RepeaterCard>
              ))}
              {!state.footerCompanyLinks.length && <EmptyList label="No company links yet. Defaults will be shown." />}
            </DynamicSection>
            </>
            )}

            {activeTab === "mobile" && (
            <EditorSection title="Mobile app downloads" icon={<Smartphone size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="Section title" value={state.mobileAppTitle} onChange={(value) => update("mobileAppTitle", value)} />
                <TextArea label="Description" value={state.mobileAppDescription} onChange={(value) => update("mobileAppDescription", value)} rows={3} className="lg:col-span-2" />
                <TextField label="Google Play app link" value={state.androidAppUrl} onChange={(value) => update("androidAppUrl", value)} placeholder="https://play.google.com/store/apps/details?id=..." />
                <TextField label="Apple App Store link" value={state.iosAppUrl} onChange={(value) => update("iosAppUrl", value)} placeholder="https://apps.apple.com/app/..." />
              </div>
              <div className="mt-4 rounded-lg border border-ink/10 bg-[#f7faf9] p-4">
                <p className="text-sm font-extrabold text-ink">Direct Android APK</p>
                <p className="mt-1 text-xs font-semibold text-ink/50">Upload up to 200 MB. Users can download it securely from the landing page.</p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-bold text-white hover:bg-leaf/90">
                  {uploadingApk ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {uploadingApk ? "Uploading..." : state.apkFileName ? "Replace APK" : "Upload APK"}
                  <input type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" disabled={uploadingApk} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadApk(file); event.target.value = ""; }} />
                </label>
                {state.apkFileName && <p className="mt-2 text-xs font-bold text-leaf">Current file: {state.apkFileName}</p>}
              </div>
            </EditorSection>
            )}

            {activeTab === "seo" && (
            <>
            <EditorSection title="Final CTA" icon={<Send size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="Final CTA kicker" value={state.finalCtaKicker} onChange={(value) => update("finalCtaKicker", value)} />
                <TextField label="Final CTA title" value={state.finalCtaTitle} onChange={(value) => update("finalCtaTitle", value)} />
                <TextArea label="Final CTA description" value={state.finalCtaDescription} onChange={(value) => update("finalCtaDescription", value)} rows={3} className="lg:col-span-2" />
              </div>
            </EditorSection>

            <EditorSection title="SEO" icon={<Search size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="SEO title" value={state.seoTitle} onChange={(value) => update("seoTitle", value)} />
                <TextArea label="SEO description" value={state.seoDescription} onChange={(value) => update("seoDescription", value)} rows={3} className="lg:col-span-2" />
              </div>
            </EditorSection>
            </>
            )}
          </form>
        )}
      </div>
    </div>
  );

  function updateFeature<K extends keyof FeatureItem>(index: number, key: K, value: FeatureItem[K]) {
    update(
      "features",
      state.features.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function updatePricing<K extends keyof Omit<PricingItem, "features">>(index: number, key: K, value: PricingItem[K]) {
    update(
      "pricing",
      state.pricing.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function updatePricingFeatures(index: number, features: string[]) {
    update(
      "pricing",
      state.pricing.map((item, itemIndex) => (itemIndex === index ? { ...item, features } : item)),
    );
  }

  function updateFaq<K extends keyof FaqItem>(index: number, key: K, value: FaqItem[K]) {
    update(
      "faqs",
      state.faqs.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function updateTestimonial<K extends keyof TestimonialItem>(index: number, key: K, value: TestimonialItem[K]) {
    update(
      "testimonials",
      state.testimonials.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function updateFooterLink(index: number, key: "label" | "value" | "href", value: string) {
    update(
      "footerLinks",
      state.footerLinks.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    );
  }

  function updateProblemItem<K extends keyof ProblemItem>(index: number, key: K, value: string) {
    update("problemSection", {
      ...state.problemSection,
      items: state.problemSection.items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    });
  }

  function updateSolutionRow<K extends keyof Omit<SolutionRow, "bullets">>(index: number, key: K, value: string) {
    update("solutionSection", {
      ...state.solutionSection,
      rows: state.solutionSection.rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    });
  }

  function updateSolutionRowBullets(rowIndex: number, bullets: string[]) {
    update("solutionSection", {
      ...state.solutionSection,
      rows: state.solutionSection.rows.map((row, i) => (i === rowIndex ? { ...row, bullets } : row)),
    });
  }

  function updateHowItWorksStep<K extends keyof HowItWorksStep>(index: number, key: K, value: string) {
    update("howItWorks", {
      ...state.howItWorks,
      steps: state.howItWorks.steps.map((step, i) => (i === index ? { ...step, [key]: value } : step)),
    });
  }
}

function EditorSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-leaf">{icon}</span>
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DynamicSection({
  title,
  description,
  icon,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-leaf">{icon}</span>
          <div>
            <h2 className="font-display text-base font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-ink/45">{description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-sm font-extrabold text-leaf hover:bg-leaf/10"
        >
          <Plus size={16} aria-hidden="true" />
          {addLabel}
        </button>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function RepeaterCard({ title, onDelete, children }: { title: string; onDelete: () => void; children: ReactNode }) {
  return (
    <article className="rounded-lg border border-ink/10 bg-[#f7faf9] p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-ink">{title}</h3>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
          aria-label={`Delete ${title}`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
      {children}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-bold text-ink/65">
      {label}
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`text-sm font-bold text-ink/65 ${className}`}>
      {label}
      <textarea
        value={value}
        rows={rows}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
      />
    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onFile,
  onClear,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFile: (file: File) => void | Promise<void>;
  onClear: () => void;
}) {
  return (
    <div className="text-sm font-bold text-ink/65">
      <span>{label}</span>
      <div className="mt-1 grid gap-2">
        {value ? (
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
            <img src={value} alt="" className="h-32 w-full object-cover" />
          </div>
        ) : (
          <div className="grid h-32 place-items-center rounded-lg border border-dashed border-ink/15 bg-[#f7faf9] text-xs font-extrabold text-ink/35">
            No image selected
          </div>
        )}
        <input
          value={value.startsWith("data:") ? "" : value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste image URL or upload a file"
          className="w-full rounded-lg border border-ink/15 bg-[#f7faf9] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-leaf/20 bg-mint px-3 py-2 text-xs font-extrabold text-leaf hover:bg-leaf/10">
            <ImagePlus size={14} aria-hidden="true" />
            Upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onFile(file);
                event.target.value = "";
              }}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={onClear}
            disabled={!value}
            className="inline-flex items-center justify-center rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs font-extrabold text-ink/55 hover:bg-[#eef8f4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/15 bg-[#f7faf9] px-4 py-6 text-center text-sm font-semibold text-ink/45">
      {label}
    </div>
  );
}
