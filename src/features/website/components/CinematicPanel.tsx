// src/features/website/components/CinematicPanel.tsx
import React from "react";
import { cn } from "@/components/ui/index.ts";

export interface CinematicPanelProps extends React.HTMLAttributes<HTMLElement> {
    /** Background content (image, video) rendered behind the glow layers. */
    backdrop?: React.ReactNode;
}

/** Full-bleed dark "cinema" band shared by the landing page's feature panels. Stays dark in both themes. */
export const CinematicPanel: React.FC<CinematicPanelProps> = ({ backdrop, className, children, ...props }) => (
    <section
        className={cn("relative isolate overflow-hidden bg-neutral-950 text-white", className)}
        {...props}
    >
        {backdrop}
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-40 -z-10 size-[28rem] rounded-full bg-primary/40 blur-[120px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-1/3 -z-10 size-[24rem] rounded-full bg-tertiary/30 blur-[120px]" />
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]"
        />
        {children}
    </section>
);

export interface EyebrowProps {
    icon?: React.ReactNode;
    children: React.ReactNode;
    /** "dark" for use inside a CinematicPanel, "theme" for regular page surfaces. */
    tone?: "dark" | "theme";
    className?: string;
}

export const Eyebrow: React.FC<EyebrowProps> = ({ icon, children, tone = "theme", className }) => (
    <span
        className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold backdrop-blur",
            tone === "dark"
                ? "border-white/15 bg-white/5 text-white/85"
                : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant",
            className,
        )}
    >
        {icon}
        {children}
    </span>
);

export interface SectionHeadingProps {
    id?: string;
    eyebrow: React.ReactNode;
    eyebrowIcon?: React.ReactNode;
    title: React.ReactNode;
    description?: string;
    action?: React.ReactNode;
    tone?: "dark" | "theme";
    className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
    id,
    eyebrow,
    eyebrowIcon,
    title,
    description,
    action,
    tone = "theme",
    className,
}) => (
    <div className={cn("flex flex-col justify-between gap-5 sm:flex-row sm:items-end", className)}>
        <div className="max-w-2xl">
            <Eyebrow icon={eyebrowIcon} tone={tone}>
                {eyebrow}
            </Eyebrow>
            <h2
                id={id}
                className={cn(
                    "mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl",
                    tone === "dark" ? "text-white" : "text-on-surface",
                )}
            >
                {title}
            </h2>
            {description && (
                <p className={cn("mt-3 text-base leading-relaxed sm:text-lg", tone === "dark" ? "text-white/65" : "text-on-surface-variant")}>
                    {description}
                </p>
            )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
);

/** Brand gradient used on highlighted headline phrases. */
export const GRADIENT_TEXT = "bg-gradient-to-r from-primary-container via-amber-300 to-secondary-container bg-clip-text text-transparent";

/** Same gradient tuned for light page surfaces, where pastel stops would wash out. */
export const GRADIENT_TEXT_THEME = "bg-gradient-to-r from-primary via-amber-500 to-secondary bg-clip-text text-transparent";

/** Content width used across the full-bleed landing page. */
export const LANDING_CONTAINER = "mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10";
