import React, { useState, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Layers,
    UploadCloud,
    FileText,
    Image as ImageIcon,
    ShieldCheck,
    Boxes,
    Tag,
    TrendingUp,
    Star,
    AlertCircle,
    Wallet,
    BarChart3,
    Settings,
    User,
    Bell,
    CreditCard,
    Library,
    Download,
    KeyRound,
    ShoppingBag,
    Receipt,
    RotateCcw,
    Shield,
    ChevronRight,
    Store,
    Compass,
    LogOut,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth.ts";
import {
    SELLER_NAV_ITEMS,
    BUYER_NAV_ITEMS,
} from "../services/dashboardNavigationService.ts";
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
            return LayoutDashboard;
        case "Package":
            return Package;
        case "Layers":
            return Layers;
        case "UploadCloud":
            return UploadCloud;
        case "FileText":
            return FileText;
        case "Image":
            return ImageIcon;
        case "ShieldCheck":
            return ShieldCheck;
        case "Boxes":
            return Boxes;
        case "Tag":
            return Tag;
        case "TrendingUp":
            return TrendingUp;
        case "Star":
            return Star;
        case "AlertCircle":
            return AlertCircle;
        case "Wallet":
            return Wallet;
        case "BarChart3":
            return BarChart3;
        case "Settings":
            return Settings;
        case "User":
            return User;
        case "Bell":
            return Bell;
        case "CreditCard":
            return CreditCard;
        case "Library":
            return Library;
        case "Download":
            return Download;
        case "KeyRound":
            return KeyRound;
        case "ShoppingBag":
            return ShoppingBag;
        case "Receipt":
            return Receipt;
        case "RotateCcw":
            return RotateCcw;
        case "Shield":
            return Shield;
        default:
            return Package;
    }
};

const SidenavIcon: React.FC<{ icon?: string; size?: number; className?: string }> = ({ icon, size = 16, className = "" }) =>
    React.createElement(resolveIcon(icon || ""), { size, className });

interface TreeRowProps {
    item: DashboardNavItem;
    depth?: number;
    expandedKeys: Record<string, boolean>;
    toggleExpanded: (id: string) => void;
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
    const isExpanded = Boolean(expandedKeys[item.id]);

    const isChildActive = (children?: DashboardNavItem[]): boolean => {
        if (!children) return false;
        return children.some(
            (child) => location.pathname === child.path || isChildActive(child.children)
        );
    };

    const isActive = location.pathname === item.path;
    const hasActiveChild = hasChildren && isChildActive(item.children);

    const depthPadding = depth === 0 ? "pl-3" : depth === 1 ? "pl-7" : "pl-11";

    if (hasChildren) {
        return (
            <div className="w-full select-none space-y-0.5">
                <button
                    type="button"
                    onClick={() => toggleExpanded(item.id)}
                    className={`w-full flex items-center justify-between py-2 pr-3 rounded-xl text-xs font-medium transition-colors cursor-pointer ${depthPadding} ${
                        hasActiveChild
                            ? "bg-surface-container-high text-on-surface font-semibold"
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                    }`}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <SidenavIcon
                            icon={item.icon}
                            size={16}
                            className={`shrink-0 ${hasActiveChild ? "text-primary" : "text-on-surface-variant"}`}
                        />
                        <span className="truncate">{item.label}</span>
                    </div>
                    <ChevronRight
                        size={14}
                        className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-on-surface" : ""
                        }`}
                    />
                </button>

                {isExpanded && (
                    <div className="relative space-y-0.5 mt-0.5">
                        <div
                            className="absolute top-1 bottom-1 w-px bg-outline-variant/30"
                            style={{ left: depth === 0 ? "19px" : depth === 1 ? "35px" : "51px" }}
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
                return `flex items-center justify-between py-2 pr-3 rounded-xl text-xs font-medium transition-all ${depthPadding} ${
                    active
                        ? "bg-primary text-on-primary font-semibold shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                }`;
            }}
        >
            {({ isActive: navActive }) => {
                const active = item.exact ? navActive : isActive || navActive;
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <SidenavIcon
                            icon={item.icon}
                            size={16}
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

    const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({
        "seller-products": true,
        "seller-products-upload": true,
        "seller-settings": true,
        "buyer-library": true,
        "buyer-settings": true,
    });

    const toggleExpanded = (id: string) => {
        setExpandedKeys((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const currentItems = portal === "seller" ? SELLER_NAV_ITEMS : BUYER_NAV_ITEMS;

    const handleSwitchPortal = (newPortal: "seller" | "buyer") => {
        if (newPortal === "seller") {
            void navigate("/dashboard/seller/overview");
        } else {
            void navigate("/dashboard/buyer/library/downloads");
        }
        if (onClose) onClose();
    };

    return (
        <aside
            aria-label="Portal Side Navigation"
            className={`flex flex-col h-full bg-surface border-r border-outline-variant/30 text-on-surface transition-colors duration-200 select-none ${className}`}
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

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation sidebar"
                        className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* 2. Portal Header or Dual-Portal Switcher */}
            {access.hasBothRoles ? (
                <div className="p-3 border-b border-outline-variant/30 shrink-0">
                    <div className="grid grid-cols-2 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/30 gap-1">
                        <button
                            type="button"
                            onClick={() => handleSwitchPortal("seller")}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                portal === "seller"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                            }`}
                        >
                            <Store size={14} />
                            <span>Seller Portal</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSwitchPortal("buyer")}
                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                portal === "buyer"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                            }`}
                        >
                            <ShoppingBag size={14} />
                            <span>Buyer Portal</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-4 py-3 border-b border-outline-variant/30 shrink-0 flex items-center justify-between bg-surface-container-low/40">
                    <div className="flex items-center gap-2">
                        {portal === "seller" ? (
                            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Store size={14} />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <ShoppingBag size={14} />
                            </div>
                        )}
                        <span className="text-xs font-bold text-on-surface">
                            {portal === "seller" ? "Seller Portal" : "Buyer Portal"}
                        </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant">
                        {portal}
                    </span>
                </div>
            )}

            {/* 3. Navigation Tree List */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 flex items-center justify-between">
                    <span>{portal === "seller" ? "Seller Navigation" : "Buyer Navigation"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
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

            {/* 4. Bottom Actions */}
            <div className="p-3 border-t border-outline-variant/30 space-y-1 shrink-0">
                <Link
                    to="/explore"
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                >
                    <Compass size={16} />
                    <span>Browse Marketplace</span>
                </Link>

                <button
                    type="button"
                    onClick={() => {
                        if (onClose) onClose();
                        signOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-error hover:bg-error/10 transition-colors cursor-pointer text-left"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default DashboardSidenav;
