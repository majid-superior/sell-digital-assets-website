import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { useOrganization } from "@/hooks/useOrganization.ts";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";
import { Badge } from "@/components/ui/index.ts";
import { CategoryMegaMenu, MobileCategoryMenu } from "./CategoryMegaMenu.tsx";

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

/**
 * Path that acts as a slot for the dynamic category mega menu.
 * Its contents are loaded live from `GET /api/categories?tree=true` (active categories only).
 */
const CATEGORIES_PATH = "/categories";

const DEFAULT_NAV_ITEMS: NavLinkItem[] = [
    { label: "Explore", path: "/explore", icon: Icons.Explore },
    { label: "Categories", path: CATEGORIES_PATH },
    { label: "Featured", path: "/featured", icon: Icons.Magic, badge: "Hot" },
];

export const Navbar: React.FC<NavbarProps> = ({
    brandName: customBrandName,
    navItems = DEFAULT_NAV_ITEMS,
    showSearch = true,
    className = "",
}) => {
    const { organization } = useOrganization();
    const brandName = customBrandName ?? organization?.shortName ?? organization?.name ?? "AssetDrop";
    const { theme, toggleTheme } = useTheme();
    const { isAuthenticated, user, signOut } = useAuth();
    const location = useLocation();
    const hasCategoryFilter = new URLSearchParams(location.search).has("category");
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    const closeMobileMenu = () => setMobileMenuOpen(false);

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
            className={`relative w-full ${className}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* Left: Brand Logo + Desktop Nav */}
                <div className="flex items-center gap-6 min-w-0">
                    <Link
                        to="/"
                        className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight text-on-surface hover:opacity-90 transition-opacity focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-lg shrink-0"
                    >
                        <img
                            src="/logo.png"
                            alt="AssetDrop"
                            className="w-9 h-9 rounded-xl object-contain shadow-xs shrink-0"
                        />
                        <span className="flex items-center">
                            {brandName.replace("Drop", "")}
                            <span className="text-primary font-extrabold">Drop</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden lg:flex items-center gap-1">
                        {navItems.map(({ label, path, icon: Icon, badge }) => {
                            if (path === CATEGORIES_PATH) {
                                return (
                                    <CategoryMegaMenu
                                        key={path}
                                        isRouteActive={location.pathname === CATEGORIES_PATH}
                                    />
                                );
                            }
                            const isActive = location.pathname === path && !hasCategoryFilter;
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
                                        <Badge variant="primary" size="sm" className="text-[10px]">
                                            {badge}
                                        </Badge>
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

                    {/* Auth Status & CTA */}
                    {isAuthenticated && user ? (
                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs text-on-surface-variant font-medium">
                                Hi, <strong className="text-on-surface">{user.displayName || user.username || "User"}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => signOut()}
                                className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Sign In — hidden on very small screens, shown sm+ */}
                            <Link
                                to="/signin"
                                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                                Sign In
                            </Link>

                            {/* Create Account CTA */}
                            <Link
                                to="/signup"
                                className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs"
                            >
                                Get Started
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
                            if (path === CATEGORIES_PATH) {
                                return <MobileCategoryMenu key={path} onNavigate={closeMobileMenu} />;
                            }
                            const isActive = location.pathname === path && !hasCategoryFilter;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={closeMobileMenu}
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
                        {isAuthenticated && user ? (
                            <>
                                <div className="px-1 text-xs text-on-surface-variant">
                                    Signed in as <strong className="text-on-surface">{user.email}</strong>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeMobileMenu();
                                        signOut();
                                    }}
                                    className="w-full py-2.5 text-center text-sm font-medium text-error hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/signin"
                                    onClick={closeMobileMenu}
                                    className="w-full py-3 text-center text-sm font-medium text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    onClick={closeMobileMenu}
                                    className="w-full py-3 text-center text-sm font-semibold rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity shadow-xs"
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
