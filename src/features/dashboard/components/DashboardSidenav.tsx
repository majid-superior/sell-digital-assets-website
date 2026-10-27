import React, { useState, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { toast } from "sonner";
import { authService } from "@/services/v1/authService.ts";
import { dashboardNavigationService } from "../services/dashboardNavigationService.ts";
import { getUserPortalAccess } from "../utils/navigationHelper.ts";
import type { DashboardNavItem } from "../types/index.ts";

export interface DashboardSidenavProps {
    isOpen?: boolean;
    onClose?: () => void;
    className?: string;
}

const resolveIcon = (iconName: string): React.ComponentType<{ size?: number; className?: string }> => {
    switch (iconName) {
        case "LayoutDashboard":
            return Icons.LayoutDashboard;
        case "Store":
        case "storefront":
            return Icons.Store;
        case "Package":
            return Icons.Package;
        case "Layers":
            return Icons.Layers;
        case "UploadCloud":
            return Icons.UploadCloud;
        case "FileText":
            return Icons.FileText;
        case "Image":
            return Icons.Image;
        case "ShieldCheck":
            return Icons.ShieldCheck;
        case "Boxes":
            return Icons.Boxes;
        case "Tag":
            return Icons.Tag;
        case "TrendingUp":
            return Icons.TrendingUp;
        case "Star":
            return Icons.Star;
        case "Magic":
        case "Sparkles":
            return Icons.Sparkles;
        case "AlertCircle":
            return Icons.AlertCircle;
        case "Wallet":
            return Icons.Wallet;
        case "BarChart3":
            return Icons.BarChart3;
        case "Settings":
            return Icons.Settings;
        case "User":
            return Icons.User;
        case "Users":
        case "Team":
        case "group":
            return Icons.Users;
        case "Bell":
            return Icons.Bell;
        case "CreditCard":
            return Icons.CreditCard;
        case "Library":
            return Icons.Library;
        case "Download":
            return Icons.Download;
        case "KeyRound":
            return Icons.KeyRound;
        case "ShoppingBag":
            return Icons.ShoppingBag;
        case "Receipt":
            return Icons.Receipt;
        case "RotateCcw":
            return Icons.RotateCcw;
        case "Shield":
            return Icons.Shield;
        default:
            return Icons.Package;
    }
};

const SidenavIcon: React.FC<{ icon?: string; size?: number; className?: string }> = ({ icon, size = 15, className = "" }) =>
    React.createElement(resolveIcon(icon || ""), { size, className });

interface TreeRowProps {
    item: DashboardNavItem;
    depth?: number;
    expandedKeys: Record<string, boolean>;
    toggleExpanded: (id: string, currentExpanded: boolean) => void;
    onClose?: () => void;
}

const TreeRow: React.FC<TreeRowProps> = ({
    item,
    depth = 0,
    expandedKeys,
    toggleExpanded,
    onClose,
}) => {
    const location = useLocation();
    const hasChildren = Boolean(item.children && item.children.length > 0);

    const isChildActive = (children?: DashboardNavItem[]): boolean => {
        if (!children) return false;
        return children.some(
            (child) => location.pathname === child.path || isChildActive(child.children)
        );
    };

    const isActive = location.pathname === item.path;
    const hasActiveChild = hasChildren && isChildActive(item.children);
    const isExpanded = hasActiveChild
        ? (expandedKeys[item.id] ?? true)
        : Boolean(
            expandedKeys[item.id] ??
            (item.id === "seller-assets" && depth === 0 && !location.pathname.includes("/users") && !location.pathname.includes("/settings"))
        );

    const depthPadding = depth === 0 ? "pl-2.5" : depth === 1 ? "pl-5.5" : "pl-8.5";

    if (hasChildren) {
        return (
            <div className="w-full select-none space-y-0.5">
                <button
                    type="button"
                    onClick={() => toggleExpanded(item.id, isExpanded)}
                    className={`w-full flex items-center justify-between py-1.5 pr-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${depthPadding} ${
                        hasActiveChild
                            ? "bg-surface-container-high text-on-surface font-semibold"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <SidenavIcon
                            icon={item.icon}
                            size={15}
                            className={`shrink-0 ${hasActiveChild ? "text-primary" : "text-on-surface-variant"}`}
                        />
                        <span className="truncate">{item.label}</span>
                    </div>
                    <Icons.ChevronRight
                        size={13}
                        className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-on-surface" : ""
                        }`}
                    />
                </button>

                {isExpanded && (
                    <div className="relative space-y-0.5 mt-0.5">
                        <div
                            className="absolute top-1 bottom-1 w-px bg-outline-variant/30"
                            style={{ left: depth === 0 ? "16px" : depth === 1 ? "28px" : "40px" }}
                        />
                        {item.children!.map((child) => (
                            <TreeRow
                                key={child.id}
                                depth={depth + 1}
                                item={child}
                                expandedKeys={expandedKeys}
                                toggleExpanded={toggleExpanded}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.path}
            end={item.exact}
            onClick={onClose}
            className={({ isActive: navActive }) => {
                const active = item.exact ? navActive : isActive || navActive;
                return `flex items-center justify-between py-1.5 pr-2.5 rounded-lg text-xs font-medium transition-all ${depthPadding} ${
                    active
                        ? "bg-primary text-on-primary font-semibold shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`;
            }}
        >
            {({ isActive: navActive }) => {
                const active = item.exact ? navActive : isActive || navActive;
                return (
                    <div className="flex items-center gap-2 min-w-0">
                        <SidenavIcon
                            icon={item.icon}
                            size={15}
                            className={`shrink-0 ${active ? "text-on-primary" : "text-on-surface-variant"}`}
                        />
                        <span className="truncate">{item.label}</span>
                    </div>
                );
            }}
        </NavLink>
    );
};

export const DashboardSidenav: React.FC<DashboardSidenavProps> = ({
    onClose,
    className = "",
}) => {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Determine user portal capabilities based on database/auth roles
    const access = useMemo(() => getUserPortalAccess(user, location.pathname), [user, location.pathname]);

    // Derive portal mode based on route and permissions
    const portal: "seller" | "buyer" = useMemo(() => {
        if (!access.hasBothRoles) {
            return access.defaultPortal;
        }
        if (location.pathname.includes("/seller")) return "seller";
        if (location.pathname.includes("/buyer")) return "buyer";
        return access.defaultPortal;
    }, [access, location.pathname]);

    const [prevPath, setPrevPath] = useState(location.pathname);
    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

    if (prevPath !== location.pathname) {
        setPrevPath(location.pathname);
        setExpandedKeys({});
    }

    const toggleExpanded = (id: string, currentExpanded: boolean) => {
        setExpandedKeys((prev) => ({
            ...prev,
            [id]: !currentExpanded,
        }));
    };

    const currentItems = useMemo(
        () => dashboardNavigationService.getNavigation(portal, user?.permissions).sections[0].items,
        [portal, user?.permissions]
    );

    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleSwitchPortal = (newPortal: "seller" | "buyer") => {
        if (newPortal === "seller") {
            void navigate("/dashboard/seller/overview");
        } else {
            void navigate("/dashboard/buyer/library/downloads");
        }
        if (onClose) onClose();
    };

    const handleBecomeSeller = async () => {
        try {
            setIsUpgrading(true);
            toast.loading("Upgrading your account to Creator/Seller status...", { id: "upgrade-seller" });
            await authService.becomeSeller();
            toast.success("Welcome to the Seller Studio!", {
                id: "upgrade-seller",
                description: "Your account now has full Creator privileges. Start by publishing your first asset!",
            });
            if (onClose) onClose();
            // Full refresh to sync user session and navigation access
            window.location.href = "/dashboard/seller/assets/new";
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to upgrade account";
            toast.error("Upgrade Failed", { id: "upgrade-seller", description: msg });
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <aside
            aria-label="Portal Side Navigation"
            className={`flex flex-col h-full bg-surface border-r border-outline-variant/30 text-on-surface transition-colors duration-200 select-none ${className}`}
        >
            {/* 1. Header / Brand Bar */}
            <div className="h-13 px-3.5 flex items-center justify-between border-b border-outline-variant/30 shrink-0">
                <Link
                    to="/"
                    className="flex items-center gap-2 font-bold text-[15px] tracking-tight hover:opacity-90 transition-opacity"
                >
                    <img
                        src="/logo.png"
                        alt="AssetDrop"
                        className="w-7 h-7 rounded-lg object-contain shadow-xs shrink-0"
                    />
                    <span className="flex items-center leading-none">
                        Asset<span className="text-primary font-extrabold">Drop</span>
                    </span>
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                        Portal
                    </span>
                </Link>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation sidebar"
                        className="lg:hidden p-1 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        <Icons.Close size={18} />
                    </button>
                )}
            </div>

            {/* 2. Portal Header or Dual-Portal Switcher */}
            {access.hasBothRoles ? (
                <div className="p-2 border-b border-outline-variant/30 shrink-0">
                    <div className="grid grid-cols-2 p-0.5 rounded-xl bg-surface-container-low border border-outline-variant/30 gap-1">
                        <button
                            type="button"
                            onClick={() => handleSwitchPortal("seller")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                portal === "seller"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                            }`}
                        >
                            <Icons.Store size={13} />
                            <span>Seller Portal</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwitchPortal("buyer")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                portal === "buyer"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                            }`}
                        >
                            <Icons.ShoppingBag size={13} />
                            <span>Buyer Portal</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-3 py-2 border-b border-outline-variant/30 shrink-0 flex items-center justify-between bg-surface-container-low/40">
                    <div className="flex items-center gap-2">
                        {portal === "seller" ? (
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icons.Store size={13} />
                            </div>
                        ) : (
                            <div className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Icons.ShoppingBag size={13} />
                            </div>
                        )}
                        <span className="text-xs font-bold text-on-surface">
                            {portal === "seller" ? "Seller Portal" : "Buyer Portal"}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                        {portal}
                    </span>
                </div>
            )}

            {/* 3. Navigation Tree List */}
            <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 flex items-center justify-between">
                    <span>{portal === "seller" ? "Seller Navigation" : "Buyer Navigation"}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-semibold">
                        {currentItems.length} Sections
                    </span>
                </div>

                {currentItems.map((item) => (
                    <TreeRow
                        key={item.id}
                        item={item}
                        depth={0}
                        expandedKeys={expandedKeys}
                        toggleExpanded={toggleExpanded}
                        onClose={onClose}
                    />
                ))}
            </nav>

            {/* Upgrade to Seller Banner (Only shown if buyer and not yet seller) */}
            {!access.canAccessSeller && (
                <div className="p-2.5 mx-2 mb-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs shrink-0">
                    <div className="font-bold text-on-surface flex items-center gap-1.5">
                        <Icons.Store size={14} className="text-primary" />
                        <span>Start Selling</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                        List your digital templates, software, and assets to earn revenue.
                    </p>
                    <button
                        type="button"
                        onClick={handleBecomeSeller}
                        disabled={isUpgrading}
                        className="mt-2 w-full py-1.5 px-2.5 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs text-center"
                    >
                        {isUpgrading ? "Upgrading..." : "Become a Seller in 1 Click"}
                    </button>
                </div>
            )}

            {/* 4. Bottom Actions */}
            <div className="p-2 border-t border-outline-variant/30 space-y-0.5 shrink-0">
                <Link
                    to="/explore"
                    onClick={onClose}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                    <Icons.Compass size={15} />
                    <span>Browse Marketplace</span>
                </Link>

                <button
                    type="button"
                    onClick={() => {
                        if (onClose) onClose();
                        signOut("/");
                        void navigate("/", { replace: true });
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
                >
                    <Icons.LogOut size={15} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidenav;
