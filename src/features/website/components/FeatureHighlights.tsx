// src/features/website/components/FeatureHighlights.tsx
import React from "react";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";
import { Card, CardTitle, CardDescription } from "@/components/ui/index.ts";

export interface FeatureItem {
    id: string;
    icon: IconComponent;
    title: string;
    description: string;
}

const DEFAULT_FEATURES: FeatureItem[] = [
    {
        id: "instant-delivery",
        icon: Icons.Performance,
        title: "Instant Delivery",
        description: "Download source files, licenses, and documentation immediately upon verified checkout.",
    },
    {
        id: "verified-quality",
        icon: Icons.Security,
        title: "Verified Quality",
        description: "Every asset is strictly vetted for code cleanliness, design standards, and commercial licensing.",
    },
    {
        id: "zero-fees",
        icon: Icons.Categories,
        title: "0% Creator Launch Fees",
        description: "Keep 100% of your earnings during your first 30 days selling your templates and kits.",
    },
];

export interface FeatureHighlightsProps {
    features?: FeatureItem[];
}

export const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({
    features = DEFAULT_FEATURES,
}) => {
    return (
        /*
            Breakpoint strategy:
              1 column  → <sm  (mobile: ≤639px)
              2 columns → sm   (640–1023px) — was sm:grid-cols-3 which caused
                          3 very cramped ~150px-wide cards at 480–640px viewports
              3 columns → lg   (1024px+)

            This ensures each card has enough horizontal breathing room at every
            intermediate viewport size between mobile and desktop.
        */
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {features.map((feature) => {
                const Icon = feature.icon;
                return (
                    <Card
                        key={feature.id}
                        className="p-6 space-y-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Icon size={20} />
                        </div>
                        <CardTitle as="h3" className="text-base font-semibold text-on-surface">
                            {feature.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-on-surface-variant leading-relaxed">
                            {feature.description}
                        </CardDescription>
                    </Card>
                );
            })}
        </section>
    );
};

export default FeatureHighlights;
