// src/features/website/components/HeroSection.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Badge, Button } from "@/components/ui/index.ts";

export interface HeroSectionProps {
    title?: React.ReactNode;
    subtitle?: string;
    badgeText?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
    title = (
        <>
            {/*
                Removed the hardcoded <br /> — it caused awkward premature line breaks
                at narrow viewports (320–375px). The heading now wraps naturally.
                The highlighted phrase sits inline using a span, which flows correctly
                at all viewport widths.
            */}
            Discover & Sell{" "}
            <span className="text-primary-container">Premium Digital Assets</span>
        </>
    ),
    subtitle = "Explore thousands of UI kits, 3D graphics, boilerplates, and creative templates crafted by elite creators worldwide with instant automated delivery.",
    badgeText = "Next-Gen Digital Asset Marketplace",
    primaryCtaText = "Explore Marketplace",
    primaryCtaHref = "/explore",
    secondaryCtaText = "Join Community",
    secondaryCtaHref = "/signup",
}) => {
    return (
        <section className="text-center space-y-6 max-w-3xl mx-auto pt-6 px-0">
            {/* Badge */}
            <Badge variant="primary" size="md" className="gap-2 px-3.5 py-1.5 rounded-full">
                <Icons.Magic size={14} />
                <span>{badgeText}</span>
            </Badge>

            {/*
                Heading size scale:
                  text-3xl (30px) at <sm   — safe for 320px+ without overflow
                  text-4xl (36px) at sm    — comfortable at 480px+
                  text-5xl (48px) at md    — tablet
                  text-6xl (60px) at lg    — desktop

                Previously text-4xl was the mobile size, which caused overflow
                and awkward breaks at 320–360px.
            */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface leading-tight">
                {title}
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link to={primaryCtaHref}>
                    <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        className="rounded-full gap-2 shadow-sm"
                        rightIcon={<Icons.Next size={16} />}
                    >
                        {primaryCtaText}
                    </Button>
                </Link>
                <Link to={secondaryCtaHref}>
                    <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="rounded-full"
                    >
                        {secondaryCtaText}
                    </Button>
                </Link>
            </div>
        </section>
    );
};

export default HeroSection;
