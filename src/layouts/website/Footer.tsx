// src/layouts/website/Footer.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge } from "@majid-superior/sell-digital-assets-theme/components";

export interface FooterLink {
    label: string;
    href: string;
    isExternal?: boolean;
    badge?: string;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export interface FooterProps {
    brandName?: string;
    brandTagline?: string;
    showNewsletter?: boolean;
    className?: string;
}

const DEFAULT_SECTIONS: FooterSection[] = [
    {
        title: "Marketplace",
        links: [
            { label: "All Assets", href: "/explore" },
            { label: "UI / UX Kits", href: "/explore?category=ui-kits" },
            { label: "3D Models", href: "/explore?category=3d-models" },
            { label: "Icons & Graphics", href: "/explore?category=graphics" },
            { label: "Featured Assets", href: "/featured", badge: "New" },
        ],
    },
    {
        title: "For Creators",
        links: [
            { label: "Start Selling", href: "/seller" },
            { label: "Creator Guidelines", href: "/creator-guidelines" },
            { label: "Fee Structure & Payouts", href: "/payouts" },
            { label: "Asset Quality Standards", href: "/standards" },
            { label: "Seller Handbook", href: "/seller-handbook" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "/docs" },
            { label: "Community", href: "/community" },
            { label: "Help Center", href: "/help" },
            { label: "Licensing Agreement", href: "/licenses" },
            { label: "API Reference", href: "/api-docs" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us", href: "/about" },
            { label: "Careers", href: "/careers" },
            { label: "Sign In", href: "/signin" },
            { label: "Sign Up", href: "/signup" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Security & Trust", href: "/security" },
        ],
    },
];

export const Footer: React.FC<FooterProps> = ({
    brandName = "AssetDrop",
    brandTagline = "The decentralized marketplace for high-performance UI kits, 3D graphics, code templates, and creative digital assets.",
    showNewsletter = true,
    className = "",
}) => {
    const [newsletterEmail, setNewsletterEmail] = useState("");
    const [subscribed, setSubscribed] = useState(false);

    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newsletterEmail.trim() && newsletterEmail.includes("@")) {
            setSubscribed(true);
            setNewsletterEmail("");
            toast.success("Subscribed to Weekly Drops!", {
                description: "Check your inbox soon for hand-picked templates and releases.",
            });
        }
    };

    return (
        <footer
            role="contentinfo"
            className={`border-t border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant transition-colors mt-auto ${className}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
                {/* Top Section: Brand + Newsletter */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-outline-variant/20">
                    {/* Brand Info */}
                    <div className="lg:col-span-5 space-y-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2.5 font-bold text-xl tracking-tight text-on-surface hover:opacity-90 transition-opacity"
                        >
                            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                                <Icons.Brand size={20} />
                            </div>
                            <span>
                                {brandName.replace("Drop", "")}
                                <span className="text-primary-container font-extrabold">Drop</span>
                            </span>
                        </Link>

                        <p className="text-sm text-on-surface-variant max-w-md leading-relaxed">
                            {brandTagline}
                        </p>

                        {/* Social Links — flex-wrap handles very narrow screens gracefully */}
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="GitHub"
                                className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface transition-colors"
                            >
                                <Icons.Github size={18} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Twitter / X"
                                className="p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface transition-colors"
                            >
                                <Icons.Twitter size={18} />
                            </a>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant">
                                <Icons.Security size={16} className="text-primary" />
                                <span>Verified Creator Network</span>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter Subscription */}
                    {showNewsletter && (
                        <div className="lg:col-span-7 flex flex-col justify-center bg-surface-container-low/50 border border-outline-variant/30 rounded-2xl p-6 sm:p-7">
                            <h3 className="text-base font-semibold text-on-surface">
                                Subscribe to weekly asset drops
                            </h3>
                            <p className="text-xs sm:text-sm text-on-surface-variant mt-1 mb-4">
                                Hand-picked templates, discounts, and fresh weekly releases straight to your inbox.
                            </p>

                            {subscribed ? (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 text-primary text-sm font-medium">
                                    <Icons.Success size={18} />
                                    <span>Thank you for subscribing! Check your inbox soon.</span>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleNewsletterSubmit}
                                    className="flex flex-col sm:flex-row gap-2.5 max-w-lg"
                                >
                                    <input
                                        type="email"
                                        required
                                        placeholder="Enter your email address"
                                        value={newsletterEmail}
                                        onChange={(e) => setNewsletterEmail(e.target.value)}
                                        className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                    {/*
                                        w-full on mobile: in single-column layout the button
                                        should span the full width for a proper touch target.
                                        sm:w-auto: on sm+ it sits inline with the input.
                                    */}
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        className="w-full sm:w-auto"
                                        rightIcon={<Icons.Send size={15} />}
                                    >
                                        Subscribe
                                    </Button>
                                </form>
                            )}
                        </div>
                    )}
                </div>

                {/* Middle Section: Navigation Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
                    {DEFAULT_SECTIONS.map((section) => (
                        <div key={section.title} className="space-y-3.5">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface">
                                {section.title}
                            </h4>
                            <ul className="space-y-2.5 text-sm">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        {link.isExternal ? (
                                            <a
                                                href={link.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
                                            >
                                                {link.label}
                                            </a>
                                        ) : (
                                            <Link
                                                to={link.href}
                                                className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
                                            >
                                                <span>{link.label}</span>
                                                {link.badge && (
                                                    <Badge variant="primary" size="sm" className="text-[10px]">
                                                        {link.badge}
                                                    </Badge>
                                                )}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom Bar: Copyright and status */}
                <div className="pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
                    <p className="text-center sm:text-left">© {new Date().getFullYear()} {brandName} Marketplace. All rights reserved.</p>

                    {/*
                        justify-center on mobile so links are centred when stacked.
                        sm:justify-end on desktop to push links to the right.
                        min-w-max on each item prevents the separator dots from
                        orphaning on their own line at narrow widths.
                    */}
                    <div className="flex items-center justify-center sm:justify-end gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-max">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Systems Operational</span>
                        </div>
                        <span className="text-outline" aria-hidden="true">·</span>
                        <Link to="/privacy" className="min-w-max hover:text-on-surface transition-colors">
                            Privacy
                        </Link>
                        <Link to="/terms" className="min-w-max hover:text-on-surface transition-colors">
                            Terms
                        </Link>
                        <span className="text-outline" aria-hidden="true">·</span>
                        <span className="text-on-surface-variant/70 min-w-max">v0.1.0</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
