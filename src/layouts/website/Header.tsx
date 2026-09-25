// src/layouts/website/Header.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, type NavbarProps } from "./Navbar.tsx";
import { Icons } from "@/lib/icons/index.ts";
import { Badge } from "@majid-superior/sell-digital-assets-theme/components";

export interface AnnouncementConfig {
    badge?: string;
    text: string;
    linkText?: string;
    linkHref?: string;
}

export interface HeaderProps {
    sticky?: boolean;
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
    showAnnouncement = false,
    announcement = DEFAULT_ANNOUNCEMENT,
    navbarProps,
    className = "",
    children,
}) => {
    const [bannerVisible, setBannerVisible] = useState(showAnnouncement);

    return (
        <header
            className={`w-full z-50 transition-all ${sticky ? "sticky top-0" : "relative"
                } border-b border-outline-variant/30 bg-surface/85 backdrop-blur-md ${className}`}
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
            {children ? children : <Navbar {...navbarProps} />}
        </header>
    );
};

export default Header;
