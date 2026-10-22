// src/features/website/components/landing/FaqSection.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

interface FaqItem {
  id: string;
  topic: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-ai-studio",
    topic: "AI Studio",
    question: "How does AI Studio work, and are generated assets commercially safe?",
    answer:
      "All AI-generated models, backgrounds, and vectors generated through our AI Studio pipeline are ethically trained exclusively on model-released and licensed stock collections. Every generated asset includes commercial indemnity and can be used across digital ads, packaging, broadcast video, and SaaS interfaces without copyright disputes.",
  },
  {
    id: "faq-free-assets",
    topic: "Free Assets",
    question: "How do I claim my 10 free assets, and what is included in the trial?",
    answer:
      "When you create a new account, you instantly receive 10 complimentary asset credits. You can redeem these for any high-resolution photo, vector, or design template across our curated catalog. Unused credits remain active for 30 days, and all deliverables downloaded during your trial come with perpetual royalty-free commercial rights.",
  },
  {
    id: "faq-plans",
    topic: "Creative Cloud Plans",
    question: "How do subscription plans work, and can I roll over unused credits?",
    answer:
      "Yes! All active monthly and annual plans feature automatic credit rollover. Unused credits roll over to the next billing cycle as long as your subscription remains active (up to 12 months). Additionally, teams can pool credits across multiple seats with centralized license management.",
  },
  {
    id: "faq-licensing",
    topic: "Licensing & Rights",
    question: "What is the difference between Standard and Extended commercial licenses?",
    answer:
      "A Standard License grants unlimited web views, digital advertising, packaging under 500,000 units, and internal business use. An Extended License removes reproduction caps, permits integration into items for resale (such as print-on-demand merchandise or app templates), and includes $250,000 in comprehensive legal indemnification.",
  },
  {
    id: "faq-deliverables",
    topic: "Deliverables & Formats",
    question: "What source file formats and resolutions are provided with downloads?",
    answer:
      "Every asset deliverable includes uncompressed production packages: layered Adobe Photoshop (PSD), vector Illustrator (AI/EPS/SVG), high-bitrate ProRes or MP4 4K video footage, or PBR-textured Blender/GLB/FBX files for 3D assets.",
  },
];

export const FaqSection: React.FC = () => {
  return (
    <section className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <Icons.HelpCircle size={14} />
          <span>Got Questions?</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-on-surface">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Everything you need to know about stock licensing, AI Studio, and creative subscription plans.
        </p>
      </div>

      {/* Accordion List using native <details name="faq"> for exclusive accessible disclosures */}
      <div className="max-w-3xl mx-auto space-y-3.5">
        {FAQ_ITEMS.map((item, index) => (
          <details
            key={item.id}
            name="landing-faq"
            open={index === 0}
            className="group rounded-2xl bg-surface border border-outline-variant/30 hover:border-outline-variant/60 transition-all shadow-2xs open:shadow-md open:border-primary/40 overflow-hidden"
          >
            <summary className="flex items-center justify-between p-4 sm:p-5 text-sm sm:text-base font-bold text-on-surface cursor-pointer select-none list-none group-open:text-primary transition-colors">
              <span className="flex items-center gap-3 pr-4">
                <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-semibold shrink-0 uppercase tracking-wide">
                  {item.topic}
                </span>
                <span className="text-balance">{item.question}</span>
              </span>
              <Icons.ChevronDown
                size={18}
                className="text-on-surface-variant shrink-0 transition-transform duration-300 group-open:rotate-180 group-open:text-primary"
              />
            </summary>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-on-surface-variant leading-relaxed border-t border-outline-variant/10">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Bottom contact CTA */}
      <div className="text-center pt-2">
        <p className="text-xs text-on-surface-variant">
          Still have questions? Check out our{" "}
          <Link to="/help" className="text-primary font-semibold hover:underline">
            Help Center
          </Link>{" "}
          or read our full{" "}
          <Link to="/licenses" className="text-primary font-semibold hover:underline">
            Licensing Agreement
          </Link>
          .
        </p>
      </div>
    </section>
  );
};

export default FaqSection;

