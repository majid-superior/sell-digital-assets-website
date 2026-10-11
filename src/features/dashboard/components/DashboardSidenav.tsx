// src/features/dashboard/components/DashboardSidenav.tsx
import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Icons, type IconComponent } from "@/lib/icons/index.ts";
import { Badge, Skeleton } from "@/components/ui/index.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { useDashboardNavigation } from "../hooks/useDashboardNavigation.ts";
import type { DashboardNavItem } from "../types/index.ts";

export interface DashboardSidenavProps {
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

const resolveNavIcon = (iconName: string): IconComponent => {
    switch (iconName.toLowerCase()) {
        case "dashboard":
        case "layoutdashboard":
            return Icons.Dashboard;
        case "download":
        case "purchases":
            return Icons.Download;
        case "package":
        case "products":
            return Icons.Package;
        case "analytics":
        case "trendingup":
        case "sales":
            return Icons.Analytics;
        case "creditcard":
        case "payouts":
            return Icons.CreditCard;
        case "settings":
            return Icons.Settings;
        case "filetext":
        case "orders":
            return Icons.FileText;
        case "heart":
        case "wishlist":
            return Icons.Heart;
        default:
            return Icons.Categories;
    }
};

export const DashboardSidenav: React.FC<DashboardSidenavProps> = ({
    onClose,
    className = "",
}) => {
    const { user, signOut } = useAuth();
    const { data: navData, isLoading } = useDashboardNavigation();
    const location = useLocation();

    const roleLabel = user?.role === "seller" ? "Seller / Creator" : "Buyer / Collector";
    const roleBadgeVariant = user?.role === "seller" ? "primary" : "secondary";

    const userInitial = (user?.displayName || user?.name || user?.email || "U").charAt(0).toUpperCase();

    return (
        <aside
            aria-label="Dashboard Sidebar"
            className={`flex flex-col h-full bg-surface border-r border-outline-variant/30 text-on-surface transition-colors duration-200 ${className}`}
        >
            {/* 1. Header / Brand Bar */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/30 shrink-0">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
                >
                    <img
                        src="/logo.png"
                        alt="AssetDrop"
                        className="w-8 h-8 rounded-lg object-contain shadow-xs shrink-0"
                    />
                    <span className="flex items-center">
                        Asset<span className="text-primary font-extrabold">Drop</span>
                    </span>
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant">
                        Portal
                    </span>
                </Link>

                {/* Close Button for mobile drawer */}
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation sidebar"
                        className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        <Icons.Close size={20} />
                    </button>
                )}
            </div>

            {/* 2. User Info Card */}
            <div className="p-4 mx-3 my-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-primary/20">
                    {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                        <span>{userInitial}</span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-on-surface truncate">
                            {user?.displayName || user?.name || "User"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={roleBadgeVariant} size="sm" className="text-[10px] px-1.5 py-0">
                            {roleLabel}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* 3. Navigation Links List */}
            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
                {isLoading ? (
                    <div className="space-y-3 px-1 py-2">
                        <Skeleton className="h-3 w-20 mb-3" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-3 w-16 my-3" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                ) : (
                    navData?.sections.map((section) => (
                        <div key={section.id} className="space-y-1">
                            {section.title && (
                                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 mb-2">
                                    {section.title}
                                </p>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item: DashboardNavItem) => {
                                    const IconComp = resolveNavIcon(item.icon);
                                    const isActive = item.exact
                                        ? location.pathname === item.path
                                        : location.pathname.startsWith(item.path);

                                    return (
                                        <NavLink
                                            key={item.id}
                                            to={item.path}
                                            end={item.exact}
                                            onClick={onClose}
                                            className={({ isActive: navActive }) => {
                                                const active = item.exact ? navActive : isActive;
                                                return `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                                    active
                                                        ? "bg-primary text-on-primary shadow-xs font-semibold"
                                                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                                                }`;
                                            }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <IconComp
                                                    size={18}
                                                    className={`shrink-0 transition-transform group-hover:scale-105 ${
                                                        isActive ? "text-on-primary" : "text-on-surface-variant"
                                                    }`}
                                                />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                        isActive
                                                            ? "bg-on-primary text-primary"
                                                            : "bg-surface-container-highest text-on-surface"
                                                    }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </nav>

            {/* 4. Bottom Actions Bar */}
            <div className="p-3 border-t border-outline-variant/30 space-y-1 shrink-0">
                <Link
                    to="/explore"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                    <Icons.Explore size={16} className="text-on-surface-variant" />
                    <span>Browse Marketplace</span>
                </Link>
                <button
                    type="button"
                    onClick={() => {
                        if (onClose) onClose();
                        signOut();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
                >
                    <Icons.SignOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidenav;

