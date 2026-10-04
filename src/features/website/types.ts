// src/features/website/types.ts
import type { ReactNode } from "react";

export interface FeatureHighlightItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    badge?: string;
}

export interface HeroBannerConfig {
    title: string;
    tagline: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
}

export interface MarketplaceCategoryCard {
    slug: string;
    name: string;
    description: string;
    iconName: string;
    count: number;
}

export interface CreatorTestimonial {
    id: string;
    author: string;
    role: string;
    avatarUrl: string;
    content: string;
    rating: number;
}
