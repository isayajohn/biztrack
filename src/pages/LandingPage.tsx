import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LandingNavbar from "../components/landing/LandingNavbar";
import HeroSection from "../components/landing/HeroSection";
import DashboardPreview from "../components/landing/DashboardPreview";
import ProblemSection from "../components/landing/ProblemSection";
import SolutionSection from "../components/landing/SolutionSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import PricingSection from "../components/landing/PricingSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import FAQSection from "../components/landing/FAQSection";
import FinalCTA from "../components/landing/FinalCTA";
import LandingFooter from "../components/landing/LandingFooter";
import { getLandingPageContent } from "../services/landingApi";
import type { PublicLandingPageContent } from "../services/landingApi";

export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [content, setContent] = useState<PublicLandingPageContent | null>(null);

  useEffect(() => {
    let alive = true;

    getLandingPageContent()
      .then((nextContent) => {
        if (alive) setContent(nextContent);
      })
      .catch(() => {
        if (alive) setContent(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    document.title = content?.seoTitle || "BizTrack | Sales, expenses, stock, and profit tracking";

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      content?.seoDescription ||
      "BizTrack helps small business owners track sales, expenses, stock, and profit from one simple dashboard.";
  }, [content?.seoDescription, content?.seoTitle]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !pageRef.current) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>("main > section:not(:first-child)");

      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { autoAlpha: 0, y: 34 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              once: true,
            },
          },
        );
      });
    }, pageRef);

    return () => context.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-cloud text-ink">
      <LandingNavbar />
      <main>
        <HeroSection
          title={content?.heroTitle}
          subtitle={content?.heroSubtitle}
          primaryText={content?.primaryButtonText}
          primaryUrl={content?.primaryButtonUrl}
          secondaryText={content?.secondaryButtonText}
          secondaryUrl={content?.secondaryButtonUrl}
        />
        <DashboardPreview />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <LandingFooter seoDescription={content?.seoDescription} footerLinks={content?.footerLinks} />
    </div>
  );
}
