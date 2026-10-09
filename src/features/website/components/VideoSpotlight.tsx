// src/features/website/components/VideoSpotlight.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { AutoPlayVideo } from "./MediaTile.tsx";
import { cn } from "@/components/ui/index.ts";
import { CinematicPanel, GRADIENT_TEXT, LANDING_CONTAINER, SectionHeading } from "./CinematicPanel.tsx";
import { SPOTLIGHT_VIDEO } from "./landingMedia.ts";

const SPOTLIGHT_POINTS = [
    "Up to 4K / 60fps, color-graded and ungraded",
    "Clips cut and ready for your editing timeline",
    "One license covers web, social, and broadcast",
];

/** Dark panel showcasing the video catalog with a large autoplaying reel. */
export const VideoSpotlight: React.FC = () => (
    <CinematicPanel aria-labelledby="video-spotlight-heading">
        <div className={cn(LANDING_CONTAINER, "grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:py-32")}>
            <div>
                <SectionHeading
                    id="video-spotlight-heading"
                    tone="dark"
                    eyebrow="Stock footage"
                    eyebrowIcon={<span className="size-1.5 animate-pulse rounded-full bg-red-500" />}
                    title={
                        <>
                            Cinematic footage that <span className={GRADIENT_TEXT}>moves people</span>
                        </>
                    }
                    description="Drone flyovers, slow motion, and timelapses from working filmmakers — ready to drop straight into your timeline."
                />

                <ul className="mt-8 space-y-3">
                    {SPOTLIGHT_POINTS.map((point) => (
                        <li key={point} className="flex items-start gap-3 text-sm text-white/80 sm:text-base">
                            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary-container/20 text-secondary-container">
                                <Icons.Check size={12} strokeWidth={3} />
                            </span>
                            {point}
                        </li>
                    ))}
                </ul>

                <Link
                    to="/explore?type=videos"
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-neutral-950 transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                    Explore videos
                    <Icons.Next size={16} />
                </Link>
            </div>

            <div className="relative">
                <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/30 via-transparent to-tertiary/30 blur-2xl" />
                <div className="relative aspect-video overflow-hidden rounded-3xl ring-1 ring-white/15">
                    <AutoPlayVideo src={SPOTLIGHT_VIDEO.src} poster={SPOTLIGHT_VIDEO.poster} aria-label={SPOTLIGHT_VIDEO.alt} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    <div className="absolute inset-x-4 bottom-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white">
                        <span className="rounded-full bg-black/55 px-2.5 py-1 backdrop-blur">3840 × 2160</span>
                        <span className="rounded-full bg-black/55 px-2.5 py-1 backdrop-blur">60 fps</span>
                        <span className="rounded-full bg-black/55 px-2.5 py-1 backdrop-blur">ProRes · MP4</span>
                    </div>
                </div>

                <div className="absolute -bottom-5 -right-2 hidden items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 p-3 pr-5 shadow-xl backdrop-blur sm:flex">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-on-primary">
                        <Icons.Rating size={18} className="fill-current" />
                    </span>
                    <div>
                        <p className="text-sm font-bold">4.9 / 5 rating</p>
                        <p className="text-[11px] text-white/55">from 18k+ video buyers</p>
                    </div>
                </div>
            </div>
        </div>
    </CinematicPanel>
);

export default VideoSpotlight;
