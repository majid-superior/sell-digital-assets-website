// src/features/dashboard/components/DashboardHeader.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { useTheme } from "@/hooks/useTheme.ts";
import { useAuth } from "@/hooks/useAuth.ts";

export interface DashboardHeaderProps {
    onMenuClick: () => void;
    title?: string;
}

const getBreadcrumbTitle = (pathname: string, userRole?: string): string => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
        return userRole === "seller" ? "Seller Dashboard" : "Buyer Dashboard";
    }
    if (pathname.includes("/purchases")) return "My Purchases & Downloads";
    if (pathname.includes("/products")) return "My Digital Products";
    if (pathname.includes("/sales")) return "Sales & Financial Analytics";
    if (pathname.includes("/orders")) return "Orders & Invoices";
    if (pathname.includes("/settings")) return "Account & Store Settings";
    return "Dashboard";
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    onMenuClick,
    title,
}) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const location = useLocation();

    const displayTitle = title || getBreadcrumbTitle(location.pathname, user?.role);
    const userInitial = (user?.displayName || user?.name || user?.email || "U").charAt(0).toUpperCase();

    return (
        <header className="sticky top-0 z-30 h-16 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
            {/* Left: Hamburger (mobile) + Page Title / Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Open sidebar menu"
                    className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                >
                    <Icons.Menu size={22} />
                </button>

                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <Link to="/" className="hover:text-primary transition-colors">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-on-surface font-medium truncate">Dashboard</span>
                    </div>
                    <h1 className="text-base sm:text-lg font-bold text-on-surface truncate">
                        {displayTitle}
                    </h1>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {/* Back to Marketplace Link */}
                <Link
                    to="/explore"
                    className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-all border border-outline-variant/30"
                >
                    <Icons.Explore size={14} />
                    <span>Marketplace</span>
                </Link>

                {/* Theme Toggle Button */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                >
                    {theme === "dark" ? <Icons.ThemeLight size={18} /> : <Icons.ThemeDark size={18} />}
                </button>

                {/* Notifications Icon */}
                <button
                    type="button"
                    aria-label="Notifications"
                    className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                >
                    <Icons.Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                </button>

                {/* User Avatar Chip */}
                <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-primary/20">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{userInitial}</span>
                        )}
                    </div>
                    <span className="hidden sm:inline-block text-xs font-medium text-on-surface max-w-[120px] truncate">
                        {user?.displayName || user?.name || "User"}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;

