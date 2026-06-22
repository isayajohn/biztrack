import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

export type Testimonial = {
  name: string;
  role: string;
  business: string;
  text: string;
  avatarSeed: string;
  avatarUrl?: string;
  stars?: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Amara Nwosu",
    role: "Owner",
    business: "Amara's Provisions Store",
    text: "Before BizTrack I had no idea how much profit I was actually making. Now I check my dashboard every morning like a routine. It's completely changed how I manage my shop.",
    avatarSeed: "amara-nwosu",
    stars: 5,
  },
  {
    name: "Kwame Asante",
    role: "Freelancer",
    business: "Kwame Phone Repairs",
    text: "I used to write repairs and parts in a notebook and lose pages. BizTrack made everything digital and I can see exactly which job type makes me the most money.",
    avatarSeed: "kwame-asante",
    stars: 5,
  },
  {
    name: "Fatima Al-Hassan",
    role: "Founder",
    business: "Fatima's Food Corner",
    text: "Tracking food sales used to be impossible. BizTrack is so fast — I record a sale in 3 seconds and at the end of the day I see my real profit. No guessing anymore.",
    avatarSeed: "fatima-hassan",
    stars: 5,
  },
  {
    name: "Carlos Mendes",
    role: "Owner",
    business: "Carlos Fresh Produce",
    text: "The stock alerts alone are worth it. I used to run out of tomatoes and not notice until customers complained. Now I get a warning before it happens.",
    avatarSeed: "carlos-mendes",
    stars: 5,
  },
  {
    name: "Priya Sharma",
    role: "Owner",
    business: "Priya Tailoring & Alterations",
    text: "I was nervous about using any software but BizTrack is so simple. No accounting needed. The profit number is always right there on my screen.",
    avatarSeed: "priya-sharma",
    stars: 5,
  },
  {
    name: "Emmanuel Okafor",
    role: "Farmer",
    business: "Okafor Farm Supplies",
    text: "I sell at three different markets and used to lose track of expenses. BizTrack keeps everything organised and the weekly report tells me which market is most profitable.",
    avatarSeed: "emmanuel-okafor",
    stars: 5,
  },
];

const VISIBLE_TESTIMONIALS = 3;
const TESTIMONIAL_INTERVAL_MS = 4000;

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-sun text-sun" aria-hidden="true" />
      ))}
    </div>
  );
}

function textFrom(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

type TestimonialContent = {
  name?: unknown;
  role?: unknown;
  business?: unknown;
  company?: unknown;
  message?: unknown;
  quote?: unknown;
  text?: unknown;
  avatarUrl?: unknown;
  imageUrl?: unknown;
  photoUrl?: unknown;
};

function normalizeTestimonials(items?: TestimonialContent[] | null) {
  const dynamicTestimonials = Array.isArray(items)
    ? items
        .map((item, index) => {
          const name = textFrom(item.name);
          return {
            name,
            role: textFrom(item.role) || "Customer",
            business: textFrom(item.business) || textFrom(item.company),
            text: textFrom(item.message) || textFrom(item.quote) || textFrom(item.text),
            avatarSeed: name || `testimonial-${index + 1}`,
            avatarUrl: textFrom(item.avatarUrl) || textFrom(item.imageUrl) || textFrom(item.photoUrl),
            stars: 5,
          };
        })
        .filter((item) => item.name && item.text)
    : [];

  return dynamicTestimonials.length ? dynamicTestimonials : TESTIMONIALS;
}

function TestimonialCard({ name, role, business, text, avatarSeed, avatarUrl, stars }: Testimonial) {
  return (
    <article className="flex min-h-[260px] flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card">
      <StarRow count={stars} />
      <blockquote className="mt-3 flex-1 text-sm leading-6 text-slateMuted">
        &ldquo;{text}&rdquo;
      </blockquote>
      <div className="mt-4 flex items-center gap-2.5 border-t border-slate-200 pt-4">
        <img
          src={avatarUrl || `https://i.pravatar.cc/36?u=${avatarSeed}`}
          alt={name}
          className="h-9 w-9 rounded-full object-cover"
          width={36}
          height={36}
        />
        <div>
          <p className="text-sm font-bold text-ink">{name}</p>
          <p className="text-xs text-slateMuted">
            {role} · {business}
          </p>
        </div>
      </div>
    </article>
  );
}

type Props = {
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  testimonials?: TestimonialContent[] | null;
};

export default function TestimonialsSection({ eyebrow, title, description, testimonials }: Props) {
  const [startIndex, setStartIndex] = useState(0);
  const visibleSource = useMemo(() => normalizeTestimonials(testimonials), [testimonials]);

  const movePrevious = () => {
    setStartIndex((current) => (current + 1) % visibleSource.length);
  };

  const moveNext = () => {
    setStartIndex((current) => (current - 1 + visibleSource.length) % visibleSource.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      moveNext();
    }, TESTIMONIAL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [visibleSource.length]);

  const visibleTestimonials = useMemo(
    () =>
      Array.from({ length: Math.min(VISIBLE_TESTIMONIALS, visibleSource.length) }, (_, index) => {
        const testimonialIndex = (startIndex + index) % visibleSource.length;
        return visibleSource[testimonialIndex];
      }),
    [startIndex, visibleSource],
  );

  return (
    <section
      className="bg-cloud py-14 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          id="testimonials-heading"
          eyebrow={eyebrow || "Real stories"}
          title={title || "What business owners say."}
          description={description || undefined}
          align="center"
        />

        <div className="relative">
          <button
            type="button"
            onClick={movePrevious}
            className="absolute left-0 top-1/2 z-10 inline-flex h-11 w-11 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-[calc(50%+0.125rem)] hover:border-emerald-200 hover:text-leaf hover:shadow-card focus:outline-none focus:ring-4 focus:ring-leaf/15 sm:-translate-x-5 lg:-translate-x-6"
            aria-label="Previous testimonials"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={moveNext}
            className="absolute right-0 top-1/2 z-10 inline-flex h-11 w-11 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-ink shadow-sm transition-all hover:-translate-y-[calc(50%+0.125rem)] hover:border-emerald-200 hover:text-leaf hover:shadow-card focus:outline-none focus:ring-4 focus:ring-leaf/15 sm:translate-x-5 lg:translate-x-6"
            aria-label="Next testimonials"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          <div className="overflow-hidden px-8 sm:px-10 lg:px-0">
            <div
              key={startIndex}
              className="grid animate-testimonial-swipe-right gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visibleTestimonials.map((testimonial) => (
                <TestimonialCard key={`${startIndex}-${testimonial.name}`} {...testimonial} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
