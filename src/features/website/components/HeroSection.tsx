// src/features/website/components/HeroSection.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { cn } from "@/components/ui/index.ts";
import { HERO_MEDIA_COLUMNS, HERO_TRENDING_TAGS, type ShowcaseMedia } from "./landingMedia.ts";
import { MediaTile } from "./MediaTile.tsx";
import { CinematicPanel, Eyebrow, GRADIENT_TEXT, LANDING_CONTAINER } from "./CinematicPanel.tsx";

type MediaFilter = "all" | "photos" | "videos";

const MEDIA_FILTERS: { value: MediaFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "photos", label: "Photos" },
    { value: "videos", label: "Videos" },
];

export interface HeroSectionProps {
    title?: React.ReactNode;
    subtitle?: string;
    badgeText?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
}

/** A vertically auto-scrolling column; items are duplicated so the loop is seamless. */
const MarqueeColumn: React.FC<{ items: ShowcaseMedia[]; reverse?: boolean; duration: string; className?: string }> = ({
    items,
    reverse,
    duration,
    className,
}) => (
    <div className={cn("relative overflow-hidden", className)}>
        <div
            className={cn(
                "flex flex-col gap-3 motion-safe:animate-[hero-marquee-y_var(--marquee-duration)_linear_infinite] hover:[animation-play-state:paused]",
                reverse && "[animation-direction:reverse]",
            )}
            style={{ "--marquee-duration": duration } as React.CSSProperties}
        >
            {[...items, ...items].map((item, index) => (
                <div key={`${item.id}-${index}`} aria-hidden={index >= items.length || undefined}>
                    <MediaTile item={item} />
                </div>
            ))}
        </div>
    </div>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
    title = (
        <>
            Stunning photos & videos,{" "}
            <span className={GRADIENT_TEXT}>
                ready to create with
            </span>
        </>
    ),
    subtitle = "Royalty-free 4K footage, high-resolution photography, and creative assets from independent creators — licensed in one click, downloaded instantly.",
    badgeText = "New: 12,000+ 4K clips added this week",
    primaryCtaText = "Search",
    primaryCtaHref = "/explore",
    secondaryCtaText = "Start selling your work",
    secondaryCtaHref = "/signup",
}) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<MediaFilter>("all");

    const goToSearch = (q: string) => {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (filter !== "all") params.set("type", filter);
        const qs = params.toString();
        void navigate(qs ? `${primaryCtaHref}?${qs}` : primaryCtaHref);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        goToSearch(query);
    };

    return (
        <CinematicPanel>
            <div className={cn(LANDING_CONTAINER, "grid items-center gap-10 pb-14 pt-28 sm:pb-20 sm:pt-32 lg:min-h-[100svh] lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-0")}>
                {/* Copy + search */}
                <div className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:pb-16 lg:pt-28 lg:text-left">
                    <Eyebrow tone="dark" icon={<Icons.Sparkles size={14} className="text-primary-container" />}>
                        {badgeText}
                    </Eyebrow>

                    <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4rem]">
                        {title}
                    </h1>

                    <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0">
                        {subtitle}
                    </p>

                    <form
                        role="search"
                        onSubmit={handleSubmit}
                        className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-2 shadow-xl shadow-black/30 backdrop-blur-md"
                    >
                        <div role="radiogroup" aria-label="Media type" className="flex gap-1 px-1 pb-2">
                            {MEDIA_FILTERS.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={filter === value}
                                    onClick={() => setFilter(value)}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container",
                                        filter === value ? "bg-white text-neutral-950" : "text-white/60 hover:bg-white/10 hover:text-white",
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 pl-4">
                            <Icons.Search size={18} className="shrink-0 text-neutral-400" />
                            <label htmlFor="hero-search" className="sr-only">
                                Search photos and videos
                            </label>
                            <input
                                id="hero-search"
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search sunsets, drone shots, portraits…"
                                className="min-w-0 flex-1 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none sm:text-base"
                            />
                            <button
                                type="submit"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-on-primary transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            >
                                <span className="hidden sm:inline">{primaryCtaText}</span>
                                <Icons.Next size={16} />
                            </button>
                        </div>
                    </form>

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white/45">Trending</span>
                        {HERO_TRENDING_TAGS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => goToSearch(tag)}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/75 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-left sm:max-w-md lg:mx-0">
                        {[
                            { value: "2M+", label: "Photos & clips" },
                            { value: "4K", label: "Video quality" },
                            { value: "100%", label: "Royalty-free" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <dt className="sr-only">{stat.label}</dt>
                                <dd className="text-2xl font-extrabold tracking-tight sm:text-3xl">{stat.value}</dd>
                                <dd className="mt-0.5 text-xs text-white/50">{stat.label}</dd>
                            </div>
                        ))}
                    </dl>

                    <p className="mt-6 text-sm text-white/55">
                        Are you a creator?{" "}
                        <Link to={secondaryCtaHref} className="inline-flex items-center gap-1 font-semibold text-white underline-offset-4 hover:underline">
                            {secondaryCtaText}
                            <Icons.ChevronRight size={14} />
                        </Link>
                    </p>
                </div>

                {/* Media wall */}
                <div
                    className="relative grid h-[420px] grid-cols-2 gap-3 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)] sm:h-[520px] sm:grid-cols-3 lg:h-[100svh] lg:min-h-[680px]"
                >
                    <MarqueeColumn items={HERO_MEDIA_COLUMNS[0]} duration="38s" />
                    <MarqueeColumn items={HERO_MEDIA_COLUMNS[1]} duration="46s" reverse />
                    <MarqueeColumn items={HERO_MEDIA_COLUMNS[2]} duration="42s" className="hidden sm:block" />
                </div>
            </div>
        </CinematicPanel>
    );
};

export default HeroSection;
