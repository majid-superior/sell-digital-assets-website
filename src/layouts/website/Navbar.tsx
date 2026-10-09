import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";
import { cn } from "@/components/ui/index.ts";

export interface NavLinkItem {
    label: string;
    path: string;
    icon?: IconComponent;
    badge?: string;
}

/** "theme" follows light/dark mode; "dark" is for sitting on top of dark, cinematic surfaces. */
export type NavbarTone = "theme" | "dark";

export interface NavbarProps {
    brandName?: string;
    brandSubtitle?: string;
    navItems?: NavLinkItem[];
    showSearch?: boolean;
    tone?: NavbarTone;
    /** Stretch to the full viewport width instead of the default 7xl container. */
    fullWidth?: boolean;
    className?: string;
}

const DEFAULT_NAV_ITEMS: NavLinkItem[] = [
    { label: "Photos", path: "/explore?type=photos", icon: Icons.Explore },
    { label: "Videos", path: "/explore?type=videos", icon: Icons.Performance },
    { label: "Collections", path: "/categories", icon: Icons.Categories },
    { label: "Featured", path: "/featured", icon: Icons.Magic, badge: "Hot" },
];

const TONE_CLASSES: Record<NavbarTone, {
    brand: string;
    link: string;
    linkActive: string;
    search: string;
    searchIcon: string;
    iconButton: string;
    ghost: string;
    divider: string;
    drawer: string;
    drawerLink: string;
    muted: string;
    strong: string;
}> = {
    theme: {
        brand: "text-on-surface",
        link: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/70",
        linkActive: "text-on-surface bg-surface-container-high",
        search: "bg-surface-container-low border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:bg-surface",
        searchIcon: "text-on-surface-variant/70",
        iconButton: "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
        ghost: "text-on-surface hover:bg-surface-container-high",
        divider: "bg-outline-variant/40",
        drawer: "border-outline-variant/30 bg-surface/95",
        drawerLink: "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
        muted: "text-on-surface-variant",
        strong: "text-on-surface",
    },
    dark: {
        brand: "text-white",
        link: "text-white/70 hover:text-white hover:bg-white/10",
        linkActive: "text-white bg-white/15",
        search: "bg-white/10 border-white/15 text-white placeholder:text-white/50 focus:border-white/40 focus:bg-white/15",
        searchIcon: "text-white/60",
        iconButton: "text-white/75 hover:bg-white/10 hover:text-white",
        ghost: "text-white hover:bg-white/10",
        divider: "bg-white/15",
        drawer: "border-white/10 bg-neutral-950/95 text-white",
        drawerLink: "text-white/75 hover:bg-white/10 hover:text-white",
        muted: "text-white/60",
        strong: "text-white",
    },
};

export const Navbar: React.FC<NavbarProps> = ({
    brandName = "AssetDrop",
    navItems = DEFAULT_NAV_ITEMS,
    showSearch = true,
    tone = "theme",
    fullWidth = false,
    className = "",
}) => {
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const t = TONE_CLASSES[tone];

    const closeMobileMenu = () => setMobileMenuOpen(false);
    const isActivePath = (path: string) =>
        path.includes("?") ? `${location.pathname}${location.search}` === path : location.pathname === path;

    // Close mobile menu on Escape key press; return focus to trigger button
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && mobileMenuOpen) {
                setMobileMenuOpen(false);
                menuButtonRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mobileMenuOpen]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            closeMobileMenu();
            void navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <nav
            role="navigation"
            aria-label="Main Navigation"
            className={`w-full ${className}`}
        >
            <div
                className={cn(
                    "mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem]",
                    fullWidth ? "max-w-screen-2xl lg:px-10" : "max-w-7xl lg:px-8",
                )}
            >
                {/* Left: Brand Logo + Desktop Nav */}
                <div className="flex min-w-0 items-center gap-8">
                    <Link
                        to="/"
                        className={cn(
                            "flex shrink-0 items-center gap-2.5 rounded-lg text-lg font-bold tracking-tight transition-opacity hover:opacity-90 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary sm:text-xl",
                            t.brand,
                        )}
                    >
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/25">
                            <Icons.Brand size={20} />
                        </div>
                        <span className="flex items-center">
                            {brandName.replace("Drop", "")}
                            <span className="font-extrabold text-primary-container">Drop</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {navItems.map(({ label, path, badge }) => (
                            <Link
                                key={path}
                                to={path}
                                aria-current={isActivePath(path) ? "page" : undefined}
                                className={cn(
                                    "relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                                    isActivePath(path) ? t.linkActive : t.link,
                                )}
                            >
                                <span>{label}</span>
                                {badge && (
                                    <span className="rounded-full bg-primary px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-on-primary">
                                        {badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Center: Search Input (Desktop md+) */}
                {showSearch && (
                    <form
                        role="search"
                        onSubmit={handleSearchSubmit}
                        className="relative hidden max-w-xs flex-1 items-center md:flex xl:max-w-md"
                    >
                        <div className={cn("pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5", t.searchIcon)}>
                            <Icons.Search size={16} />
                        </div>
                        <label htmlFor="navbar-search" className="sr-only">
                            Search photos and videos
                        </label>
                        <input
                            id="navbar-search"
                            type="search"
                            placeholder="Search photos & videos…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full rounded-full border py-2 pl-10 pr-4 text-sm backdrop-blur transition-all focus:outline-hidden focus:ring-2 focus:ring-primary/30",
                                t.search,
                            )}
                        />
                    </form>
                )}

                {/* Right: Actions */}
                <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                        to="/signup"
                        className={cn("hidden rounded-full px-3.5 py-2 text-sm font-medium transition-colors xl:inline-flex", t.ghost)}
                    >
                        Sell your work
                    </Link>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                        className={cn("cursor-pointer rounded-full p-2 transition-colors", t.iconButton)}
                    >
                        {theme === "dark" ? <Icons.ThemeLight size={19} /> : <Icons.ThemeDark size={19} />}
                    </button>

                    <span aria-hidden="true" className={cn("mx-1 hidden h-6 w-px sm:block", t.divider)} />

                    {/* Auth Status & CTA */}
                    {isAuthenticated && user ? (
                        <div className="hidden items-center gap-2 sm:flex">
                            <span className={cn("text-xs font-medium", t.muted)}>
                                Hi, <strong className={t.strong}>{user.displayName || user.username || "User"}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => signOut()}
                                className={cn("cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:text-error sm:text-sm", t.iconButton)}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link
                                to="/signin"
                                className={cn("hidden items-center justify-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:inline-flex", t.ghost)}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/signup"
                                className="hidden items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-lg shadow-primary/25 transition-all hover:brightness-110 active:scale-95 sm:inline-flex"
                            >
                                Get Started
                                <Icons.Next size={14} />
                            </Link>
                        </>
                    )}

                    {/* Mobile Menu Toggle Button */}
                    <button
                        ref={menuButtonRef}
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-drawer"
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        className={cn("cursor-pointer rounded-full p-2 transition-colors lg:hidden", t.iconButton)}
                    >
                        {mobileMenuOpen ? <Icons.Close size={22} /> : <Icons.Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu Drawer */}
            {mobileMenuOpen && (
                <div
                    id="mobile-nav-drawer"
                    ref={mobileMenuRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                    className={cn("space-y-3 border-t px-4 pb-6 pt-3 backdrop-blur-xl lg:hidden", t.drawer)}
                >
                    {showSearch && (
                        <form role="search" onSubmit={handleSearchSubmit} className="relative w-full">
                            <div className={cn("pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5", t.searchIcon)}>
                                <Icons.Search size={16} />
                            </div>
                            <label htmlFor="mobile-navbar-search" className="sr-only">
                                Search photos and videos
                            </label>
                            <input
                                id="mobile-navbar-search"
                                type="search"
                                placeholder="Search photos & videos…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={cn("w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-hidden", t.search)}
                            />
                        </form>
                    )}

                    {/* py-3 keeps each touch target at least 44px tall */}
                    <div className="flex flex-col space-y-1">
                        {navItems.map(({ label, path, icon: Icon, badge }) => (
                            <Link
                                key={path}
                                to={path}
                                onClick={closeMobileMenu}
                                aria-current={isActivePath(path) ? "page" : undefined}
                                className={cn(
                                    "flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                                    isActivePath(path) ? t.linkActive : t.drawerLink,
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    {Icon && <Icon size={18} />}
                                    <span>{label}</span>
                                </div>
                                {badge && (
                                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase text-on-primary">
                                        {badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                        <Link
                            to="/signup"
                            onClick={closeMobileMenu}
                            className={cn("flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors", t.drawerLink)}
                        >
                            <Icons.Sell size={18} />
                            <span>Sell your work</span>
                        </Link>
                    </div>

                    {/* Mobile Auth Actions — full-width buttons for touch friendliness */}
                    <div className={cn("flex flex-col gap-2 border-t pt-3", tone === "dark" ? "border-white/10" : "border-outline-variant/30")}>
                        {isAuthenticated && user ? (
                            <>
                                <div className={cn("px-1 text-xs", t.muted)}>
                                    Signed in as <strong className={t.strong}>{user.email}</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        signOut();
                                    }}
                                    className="w-full cursor-pointer rounded-xl py-2.5 text-center text-sm font-medium text-error transition-colors hover:bg-error/10"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/signin"
                                    onClick={closeMobileMenu}
                                    className={cn("w-full rounded-xl py-3 text-center text-sm font-medium transition-colors", t.ghost)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={closeMobileMenu}
                                    className="w-full rounded-xl bg-primary py-3 text-center text-sm font-semibold text-on-primary shadow-lg shadow-primary/25 transition hover:brightness-110"
                                >
                                    Create Account
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
