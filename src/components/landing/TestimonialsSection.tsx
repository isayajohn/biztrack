import { Star } from "lucide-react";
import { SectionHeader } from "./LandingDesignSystem";

export type Testimonial = {
  name: string;
  role: string;
  business: string;
  text: string;
  avatarSeed: string;
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

function StarRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} className="fill-sun text-sun" aria-hidden="true" />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [featured, ...rest] = TESTIMONIALS;

  return (
    <section
      className="bg-cloud py-14 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader id="testimonials-heading" eyebrow="Real stories" title="What business owners say." />

        {/* Featured testimonial */}
        <div className="mb-6 rounded-xl border border-emerald-200 bg-white p-7 shadow-card md:p-9">
          <StarRow count={featured.stars} />
          <blockquote className="mt-4 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            &ldquo;{featured.text}&rdquo;
          </blockquote>
          <div className="mt-5 flex items-center gap-3">
            <img
              src={`https://i.pravatar.cc/48?u=${featured.avatarSeed}`}
              alt={featured.name}
              className="h-11 w-11 rounded-full object-cover"
              width={44}
              height={44}
            />
            <div>
              <p className="font-bold text-ink">{featured.name}</p>
              <p className="text-sm text-slateMuted">
                {featured.role} · {featured.business}
              </p>
            </div>
          </div>
        </div>

        {/* Supporting grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map(({ name, role, business, text, avatarSeed, stars }) => (
            <article
              key={name}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <StarRow count={stars} />
              <blockquote className="mt-3 flex-1 text-sm leading-6 text-slateMuted">
                &ldquo;{text}&rdquo;
              </blockquote>
              <div className="mt-4 flex items-center gap-2.5 border-t border-slate-200 pt-4">
                <img
                  src={`https://i.pravatar.cc/36?u=${avatarSeed}`}
                  alt={name}
                  className="h-9 w-9 rounded-full object-cover"
                  width={36}
                  height={36}
                />
                <div>
                  <p className="text-sm font-bold text-ink">{name}</p>
                  <p className="text-xs text-slateMuted">{business}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
