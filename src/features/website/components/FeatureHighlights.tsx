// src/features/website/components/FeatureHighlights.tsx
import React from "react";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";
import { GRADIENT_TEXT_THEME, SectionHeading } from "./CinematicPanel.tsx";

export interface FeatureItem {
    id: string;
    icon: IconComponent;
    title: string;
    description: string;
}

const DEFAULT_FEATURES: FeatureItem[] = [
    {
        id: "royalty-free",
        icon: Icons.Security,
        title: "Royalty-free licensing",
        description: "Pay once and use everywhere — ads, social, film, and client work. No attribution, no surprise renewals.",
    },
    {
        id: "pro-quality",
        icon: Icons.Verified,
        title: "Reviewed by editors",
        description: "Every photo and clip is checked for sharpness, exposure, and model releases before it goes live.",
    },
    {
        id: "instant-delivery",
        icon: Icons.Performance,
        title: "Instant full-res downloads",
        description: "Original RAW-quality photos and 4K masters land in your library the moment checkout clears.",
    },
    {
        id: "fair-payouts",
        icon: Icons.Sell,
        title: "Fair creator payouts",
        description: "Creators keep up to 70% of every sale, so the people behind the lens keep shooting.",
    },
];

export interface FeatureHighlightsProps {
    features?: FeatureItem[];
}

export const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({ features = DEFAULT_FEATURES }) => (
    <section aria-labelledby="features-heading" className="space-y-10">
        <SectionHeading
            id="features-heading"
            eyebrow="Why creators & buyers choose us"
            eyebrowIcon={<Icons.Sparkles size={14} className="text-primary" />}
            title={
                <>
                    Built for people who <span className={GRADIENT_TEXT_THEME}>make things</span>
                </>
            }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                    <article
                        key={feature.id}
                        className="group relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                    >
                        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="flex items-center justify-between">
                            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Icon size={20} />
                            </span>
                            <span aria-hidden="true" className="text-sm font-bold tabular-nums text-on-surface-variant/40">
                                0{index + 1}
                            </span>
                        </div>
                        <h3 className="mt-6 text-base font-bold text-on-surface">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
                    </article>
                );
            })}
        </div>
    </section>
);

export default FeatureHighlights;
