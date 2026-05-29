import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  Megaphone,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  getAdminLandingContent,
  publishAdminLandingContent,
  updateAdminLandingContent,
} from "../../services/adminApi";
import type { LandingPageContent } from "../../services/adminApi";
import { getApiErrorMessage } from "../../services/apiClient";

type FeatureItem = {
  title: string;
  description: string;
  iconName: string;
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
};

type LandingEditorState = {
  id?: string | null;
  heroTitle: string;
  heroSubtitle: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  features: FeatureItem[];
  pricing: PricingItem[];
  faqs: FaqItem[];
  testimonials: TestimonialItem[];
  footerLinks: Array<Record<string, unknown>>;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
};

const fallbackState: LandingEditorState = {
  heroTitle: "",
  heroSubtitle: "",
  primaryButtonText: "Get Started Free",
  primaryButtonUrl: "/register",
  secondaryButtonText: "View Demo",
  secondaryButtonUrl: "/demo",
  features: [],
  pricing: [],
  faqs: [],
  testimonials: [],
  footerLinks: [],
  seoTitle: "",
  seoDescription: "",
  isPublished: false,
};

const emptyFeature: FeatureItem = { title: "", description: "", iconName: "" };
const emptyPricing: PricingItem = {
  name: "",
  price: "",
  description: "",
  features: [""],
  buttonText: "Get Started",
  buttonUrl: "/register",
};
const emptyFaq: FaqItem = { question: "", answer: "" };
const emptyTestimonial: TestimonialItem = { name: "", business: "", message: "" };

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

function editorFromContent(content: LandingPageContent): LandingEditorState {
  return {
    id: content.id,
    heroTitle: content.heroTitle ?? "",
    heroSubtitle: content.heroSubtitle ?? "",
    primaryButtonText: content.primaryButtonText ?? "",
    primaryButtonUrl: content.primaryButtonUrl ?? "",
    secondaryButtonText: content.secondaryButtonText ?? "",
    secondaryButtonUrl: content.secondaryButtonUrl ?? "",
    features: arrayFrom(content.features).map((feature) => ({
      title: textFrom(feature, ["title", "name"]),
      description: textFrom(feature, ["description", "text"]),
      iconName: textFrom(feature, ["iconName", "icon"]),
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
    })),
    footerLinks: arrayFrom(content.footerLinks),
    seoTitle: content.seoTitle ?? "",
    seoDescription: content.seoDescription ?? "",
    isPublished: Boolean(content.isPublished),
  };
}

function payloadFromState(state: LandingEditorState, isPublished: boolean): LandingPageContent {
  return {
    id: state.id,
    heroTitle: state.heroTitle.trim(),
    heroSubtitle: state.heroSubtitle.trim(),
    primaryButtonText: state.primaryButtonText.trim(),
    primaryButtonUrl: state.primaryButtonUrl.trim(),
    secondaryButtonText: state.secondaryButtonText.trim(),
    secondaryButtonUrl: state.secondaryButtonUrl.trim(),
    features: state.features
      .filter((feature) => feature.title.trim() || feature.description.trim())
      .map((feature) => ({
        title: feature.title.trim(),
        description: feature.description.trim(),
        iconName: feature.iconName.trim() || undefined,
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
      })),
    footerLinks: state.footerLinks,
    seoTitle: state.seoTitle.trim() || null,
    seoDescription: state.seoDescription.trim() || null,
    isPublished,
  };
}

function validateState(state: LandingEditorState) {
  if (state.heroTitle.trim().length < 2) return "Hero title is required.";
  if (state.heroSubtitle.trim().length < 2) return "Hero subtitle is required.";
  if (!state.primaryButtonText.trim() || !state.primaryButtonUrl.trim()) return "Primary button text and URL are required.";
  if (!state.secondaryButtonText.trim() || !state.secondaryButtonUrl.trim()) return "Secondary button text and URL are required.";
  if (state.features.some((feature) => !feature.title.trim() || !feature.description.trim())) {
    return "Every feature needs a title and description.";
  }
  if (state.pricing.some((plan) => !plan.name.trim() || !plan.price.trim() || !plan.description.trim())) {
    return "Every pricing card needs a name, price, and description.";
  }
  if (state.faqs.some((faq) => !faq.question.trim() || !faq.answer.trim())) {
    return "Every FAQ needs a question and answer.";
  }
  if (state.testimonials.some((testimonial) => !testimonial.name.trim() || !testimonial.message.trim())) {
    return "Every testimonial needs a name and message.";
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

  function update<K extends keyof LandingEditorState>(key: K, value: LandingEditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function saveContent(isPublished: boolean, successText: string) {
    const validationError = validateState(state);
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
    setMessage(null);

    try {
      await saveContent(false, "Landing page draft saved.");
    } catch (error) {
      setMessage({ type: "error", text: getApiErrorMessage(error) });
    } finally {
      setIsSaving(false);
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
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-2.5 text-sm font-extrabold text-ink/60 hover:bg-[#f4f0e8]"
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
            Save Draft
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
            <EditorSection title="Hero section" icon={<Megaphone size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="Hero title" value={state.heroTitle} onChange={(value) => update("heroTitle", value)} required />
                <TextField label="Primary button text" value={state.primaryButtonText} onChange={(value) => update("primaryButtonText", value)} required />
                <TextArea label="Hero subtitle" value={state.heroSubtitle} onChange={(value) => update("heroSubtitle", value)} rows={3} required className="lg:col-span-2" />
                <TextField label="Primary button URL" value={state.primaryButtonUrl} onChange={(value) => update("primaryButtonUrl", value)} required />
                <TextField label="Secondary button text" value={state.secondaryButtonText} onChange={(value) => update("secondaryButtonText", value)} required />
                <TextField label="Secondary button URL" value={state.secondaryButtonUrl} onChange={(value) => update("secondaryButtonUrl", value)} required />
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
                  <div className="mt-3 rounded-lg bg-[#fbfaf6] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink/35">Features list</p>
                      <button
                        type="button"
                        onClick={() => updatePricingFeatures(index, [...plan.features, ""])}
                        className="inline-flex items-center gap-1 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-xs font-extrabold text-ink/55 hover:bg-[#f4f0e8]"
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
                    <TextArea label="Message" value={testimonial.message} onChange={(value) => updateTestimonial(index, "message", value)} rows={3} required className="lg:col-span-2" />
                  </div>
                </RepeaterCard>
              ))}
              {!state.testimonials.length && <EmptyList label="No testimonials yet." />}
            </DynamicSection>

            <EditorSection title="SEO" icon={<Search size={18} aria-hidden="true" />}>
              <div className="grid gap-4 lg:grid-cols-2">
                <TextField label="SEO title" value={state.seoTitle} onChange={(value) => update("seoTitle", value)} />
                <TextArea label="SEO description" value={state.seoDescription} onChange={(value) => update("seoDescription", value)} rows={3} className="lg:col-span-2" />
              </div>
            </EditorSection>
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
    <article className="rounded-lg border border-ink/10 bg-[#fbfaf6] p-3">
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
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
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
        className="mt-1 w-full rounded-lg border border-ink/15 bg-[#fbfaf6] px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/15"
      />
    </label>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink/15 bg-[#fbfaf6] px-4 py-6 text-center text-sm font-semibold text-ink/45">
      {label}
    </div>
  );
}
