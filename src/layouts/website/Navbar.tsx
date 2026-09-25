// src/layouts/website/Navbar.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme.ts";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";

export interface NavLinkItem {
    label: string;
    path: string;
    icon?: IconComponent;
    badge?: string;
}

export interface NavbarProps {
    brandName?: string;
    brandSubtitle?: string;
    navItems?: NavLinkItem[];
    showSearch?: boolean;
    className?: string;
}

const DEFAULT_NAV_ITEMS: NavLinkItem[] = [
    { label: "Explore", path: "/explore", icon: Icons.Explore },
    { label: "Categories", path: "/categories", icon: Icons.Categories },
    { label: "Featured", path: "/featured", icon: Icons.Magic, badge: "Hot" },
    { label: "Sell Assets", path: "/seller", icon: Icons.Sell },
];

export const Navbar: React.FC<NavbarProps> = ({
    brandName = "AssetDrop",
    navItems = DEFAULT_NAV_ITEMS,
    showSearch = true,
    className = "",
}) => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    // Close mobile menu on route change
    const [prevPath, setPrevPath] = useState(location.pathname);
    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        setMobileMenuOpen(false);
    }

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
            window.location.href = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <nav
            role="navigation"
            aria-label="Main Navigation"
            className={`w-full ${className}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* Left: Brand Logo + Desktop Nav */}
                <div className="flex items-center gap-6 min-w-0">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-on-surface hover:opacity-90 transition-opacity focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg shrink-0"
                    >
                        <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                            <Icons.Brand size={20} />
                        </div>
                        <span className="flex items-center">
                            {brandName.replace("Drop", "")}
                            <span className="text-primary-container font-extrabold">Drop</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map(({ label, path, icon: Icon, badge }) => {
                            const isActive = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative ${isActive
                                        ? "bg-surface-container-high text-primary"
                                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                        }`}
                                >
                                    {Icon && <Icon size={16} />}
                                    <span>{label}</span>
                                    {badge && (
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Center: Search Input (Desktop md+) */}
                {showSearch && (
                    <form
                        onSubmit={handleSearchSubmit}
                        className="hidden md:flex items-center flex-1 max-w-xs xl:max-w-sm relative"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                            <Icons.Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search assets, 3D, code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </form>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        {theme === "dark" ? <Icons.ThemeLight size={19} /> : <Icons.ThemeDark size={19} />}
                    </button>

                    {/* Cart Indicator */}
                    <Link
                        to="/checkout"
                        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors relative"
                        aria-label="Shopping Cart"
                    >
                        <Icons.Cart size={19} />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
                    </Link>

                    {/* Sign In — hidden on very small screens, shown sm+ */}
                    <Link
                        to="/signin"
                        className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                        Sign In
                    </Link>

                    {/* Start Selling CTA — hidden on very small screens */}
                    <Link
                        to="/seller"
                        className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs"
                    >
                        Start Selling
                    </Link>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        ref={menuButtonRef}
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="mobile-nav-drawer"
                        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                        className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        {mobileMenuOpen ? <Icons.Close size={22} /> : <Icons.Menu size={22} />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Menu Drawer
                role="dialog" + aria-modal so screen-readers treat this as a modal panel.
                id matches aria-controls on the trigger button above.
            */}
            {mobileMenuOpen && (
                <div
                    id="mobile-nav-drawer"
                    ref={mobileMenuRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                    className="lg:hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3"
                >
                    {/* Mobile Search — w-full prevents any overflow on 320px */}
                    {showSearch && (
                        <form onSubmit={handleSearchSubmit} className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                                <Icons.Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search digital assets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
                            />
                        </form>
                    )}

                    {/* Navigation Items
                        py-3 ensures minimum 44px touch target height (12px × 2 = 24px padding + ~20px text = 44px).
                    */}
                    <div className="flex flex-col space-y-1">
                        {navItems.map(({ label, path, icon: Icon, badge }) => {
                            const isActive = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? "bg-surface-container-high text-primary font-semibold"
                                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        {Icon && <Icon size={18} />}
                                        <span>{label}</span>
                                    </div>
                                    {badge && (
                                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            {badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Auth Actions — full-width buttons for touch friendliness */}
                    <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
                        <Link
                            to="/signin"
                            className="w-full py-3 text-center text-sm font-medium text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="w-full py-3 text-center text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-xs"
                        >
                            Create Account
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
