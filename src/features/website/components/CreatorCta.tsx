// src/features/website/components/CreatorCta.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { CinematicPanel, Eyebrow, GRADIENT_TEXT } from "./CinematicPanel.tsx";
import { SHOWCASE_GALLERY } from "./landingMedia.ts";

/** Closing call-to-action inviting photographers and filmmakers to sell. */
export const CreatorCta: React.FC = () => {
    const backdropImages = SHOWCASE_GALLERY.slice(0, 8);

    return (
        <CinematicPanel
            aria-labelledby="creator-cta-heading"
            backdrop={
                <div aria-hidden="true" className="absolute inset-0 -z-20 grid auto-rows-fr grid-cols-4 gap-2 opacity-35 sm:grid-cols-8">
                    {backdropImages.map((item) => (
                        <img
                            key={item.id}
                            src={item.kind === "video" ? item.poster : item.src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                        />
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/70 via-neutral-950/85 to-neutral-950" />
                </div>
            }
        >
            <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-10 sm:py-28 lg:py-36">
                <Eyebrow tone="dark" icon={<Icons.Sell size={14} className="text-primary-container" />}>
                    For photographers & filmmakers
                </Eyebrow>
                <h2 id="creator-cta-heading" className="mt-6 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                    Turn your camera roll into <span className={GRADIENT_TEXT}>recurring income</span>
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
                    Upload once, earn every time. Keep up to 70% of each sale, get paid monthly, and reach buyers in 150+ countries.
                </p>

                <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-bold text-on-primary shadow-lg shadow-primary/30 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        Start selling
                        <Icons.Next size={16} />
                    </Link>
                    <Link
                        to="/creator-guidelines"
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                    >
                        Read creator guidelines
                    </Link>
                </div>
            </div>
        </CinematicPanel>
    );
};

export default CreatorCta;
