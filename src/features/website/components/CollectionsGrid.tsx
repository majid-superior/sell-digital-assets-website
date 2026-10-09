// src/features/website/components/CollectionsGrid.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { cn } from "@/components/ui/index.ts";
import { SectionHeading } from "./CinematicPanel.tsx";
import { LANDING_COLLECTIONS, type Collection } from "./landingMedia.ts";

export interface CollectionsGridProps {
    collections?: Collection[];
}

/** Bento grid of image-led collections; the first collection is featured large. */
export const CollectionsGrid: React.FC<CollectionsGridProps> = ({ collections = LANDING_COLLECTIONS }) => (
    <section aria-labelledby="collections-heading" className="space-y-8">
        <SectionHeading
            id="collections-heading"
            eyebrow="Curated collections"
            eyebrowIcon={<Icons.Categories size={14} className="text-primary" />}
            title="Find the right shot, faster"
            description="Hand-picked sets of photos and footage, organised by mood, subject, and style."
            action={
                <Link to="/explore" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    Browse all collections
                    <Icons.Next size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
            }
        />

        <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4">
            {collections.map((collection, index) => (
                <Link
                    key={collection.id}
                    to={`/explore?q=${encodeURIComponent(collection.query)}`}
                    className={cn(
                        "group relative isolate overflow-hidden rounded-3xl bg-neutral-900 ring-1 ring-outline-variant/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        index === 0 && "col-span-2 row-span-2",
                    )}
                >
                    <img
                        src={collection.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                    <div className="flex h-full flex-col justify-end p-4 text-white sm:p-5">
                        <span className="mb-2 w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">
                            {collection.count} assets
                        </span>
                        <div className="flex items-end justify-between gap-3">
                            <h3 className={cn("font-bold leading-tight", index === 0 ? "text-2xl sm:text-3xl" : "text-base sm:text-lg")}>
                                {collection.title}
                            </h3>
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100 sm:-translate-x-2">
                                <Icons.Next size={16} />
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    </section>
);

export default CollectionsGrid;
