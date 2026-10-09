// src/features/website/components/MediaTile.tsx
import React, { useEffect, useRef } from "react";
import { cn } from "@/components/ui/index.ts";
import type { ShowcaseMedia } from "./landingMedia.ts";

export interface AutoPlayVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
    src: string;
    poster?: string;
}

/** Muted looping video that only plays while on screen and when motion is allowed. */
export const AutoPlayVideo: React.FC<AutoPlayVideoProps> = ({ className, ...props }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = ref.current;
        if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) void video.play().catch(() => undefined);
                else video.pause();
            },
            { threshold: 0.25 },
        );
        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return (
        <video
            ref={ref}
            muted
            loop
            playsInline
            preload="none"
            className={cn("absolute inset-0 size-full object-cover", className)}
            {...props}
        />
    );
};

export interface MediaTileProps {
    item: ShowcaseMedia;
    className?: string;
}

export const MediaTile: React.FC<MediaTileProps> = ({ item, className }) => (
    <figure className={cn("group relative w-full overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10", item.aspect, className)}>
        {item.kind === "video" ? (
            <AutoPlayVideo src={item.src} poster={item.poster} aria-label={item.alt} />
        ) : (
            <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {item.kind === "video" && (
            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                {item.duration}
            </span>
        )}

        <figcaption className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-2 text-[11px] font-medium text-white/90">
            <span className="truncate">{item.author}</span>
            <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur">
                {item.kind === "video" ? "4K" : "Photo"}
            </span>
        </figcaption>
    </figure>
);

export default MediaTile;
