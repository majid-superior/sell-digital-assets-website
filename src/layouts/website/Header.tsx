// src/layouts/website/Header.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, type NavbarProps } from "./Navbar.tsx";
import { Icons } from "@/lib/icons/index.ts";
import { Badge } from "@/components/ui/index.ts";

export interface AnnouncementConfig {
    badge?: string;
    text: string;
    linkText?: string;
    linkHref?: string;
}

export interface HeaderProps {
    sticky?: boolean;
    /**
     * "solid" — theme-aware glass bar in normal flow.
     * "overlay" — fixed and transparent over a dark hero, turning to dark glass once the page scrolls.
     */
    variant?: "solid" | "overlay";
    showAnnouncement?: boolean;
    announcement?: AnnouncementConfig;
    navbarProps?: NavbarProps;
    className?: string;
    children?: React.ReactNode;
}

const DEFAULT_ANNOUNCEMENT: AnnouncementConfig = {
    badge: "New Release",
    text: "Discover top curated 3D assets and UI kits for your next project.",
    linkText: "Explore Now",
    linkHref: "/explore",
};

export const Header: React.FC<HeaderProps> = ({
    sticky = true,
    variant = "solid",
    showAnnouncement = false,
    announcement = DEFAULT_ANNOUNCEMENT,
    navbarProps,
    className = "",
    children,
}) => {
    const [bannerVisible, setBannerVisible] = useState(showAnnouncement);
    const [scrolled, setScrolled] = useState(false);
    const isOverlay = variant === "overlay";

    useEffect(() => {
        if (!isOverlay) return;
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isOverlay]);

    const positionClass = isOverlay ? "fixed inset-x-0 top-0" : sticky ? "sticky top-0" : "relative";
    const surfaceClass = isOverlay
        ? scrolled
            ? "border-b border-white/10 bg-neutral-950/75 shadow-lg shadow-black/20 backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-black/50 to-transparent"
        : "border-b border-outline-variant/30 bg-surface/80 backdrop-blur-xl";

    return (
        <header
            className={`w-full z-50 transition-[background-color,border-color,box-shadow] duration-300 ${positionClass} ${surfaceClass} ${className}`}
        >
            {/* Top Announcement Bar */}
            {bannerVisible && (
                <aside
                    aria-label="Announcement"
                    className="w-full bg-primary-container text-on-primary-container py-2 px-4 text-xs font-medium border-b border-outline-variant/20 transition-all"
                >
                    <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
                        {/*
                            min-w-0 allows this flex child to shrink below its content width,
                            enabling text-wrap on very narrow screens (320–375px).
                            flex-wrap allows badge + text + link to stack when there is no room.
                        */}
                        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
                            {announcement.badge && (
                                <Badge variant="primary" size="sm" className="gap-1 shrink-0">
                                    <Icons.Magic size={12} />
                                    {announcement.badge}
                                </Badge>
                            )}
                            <span className="break-words">{announcement.text}</span>
                            {announcement.linkHref && (
                                <Link
                                    to={announcement.linkHref}
                                    className="inline-flex items-center gap-1 font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap"
                                >
                                    <span>{announcement.linkText || "Learn more"}</span>
                                    <Icons.Next size={13} />
                                </Link>
                            )}
                        </div>

                        {/* Close Banner Button — shrink-0 keeps it from being squeezed */}
                        <button
                            type="button"
                            onClick={() => setBannerVisible(false)}
                            aria-label="Dismiss announcement"
                            className="shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-on-primary-container"
                        >
                            <Icons.Close size={15} />
                        </button>
                    </div>
                </aside>
            )}

            {/* Navbar or Custom Content */}
            {children ? children : <Navbar tone={isOverlay ? "dark" : "theme"} {...navbarProps} />}
        </header>
    );
};

export default Header;
