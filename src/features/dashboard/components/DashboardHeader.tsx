// src/features/dashboard/components/DashboardHeader.tsx
import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Badge, Button } from "@/components/ui/index.ts";
import { useTheme } from "@/hooks/useTheme.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import {
    notificationService,
    type UserNotification,
} from "@/services/v1/notificationService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { formatDate } from "@/utils/date.ts";
import { dashboardNavigationService } from "../services/dashboardNavigationService.ts";
import { findNavTrail } from "../utils/navigationHelper.ts";

export interface DashboardHeaderProps {
    onMenuClick: () => void;
    title?: string;
}

const getBreadcrumbTitle = (pathname: string): { portalLabel: string; pageTitle: string } => {
    const isSeller = pathname.includes("/seller");
    const portalLabel = isSeller ? "Seller Portal" : "Buyer Portal";
    const items = dashboardNavigationService.getNavigation(isSeller ? "seller" : "buyer").sections[0].items;

    const navInfo = findNavTrail(items, pathname);
    const pageTitle = navInfo?.item.label || (pathname === "/dashboard" ? "Portal Overview" : "Dashboard");

    return { portalLabel, pageTitle };
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    onMenuClick,
    title,
}) => {
    const { theme, toggleTheme } = useTheme();
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const { data: notifData, refetch: refetchNotifications } = useQuery({
        queryKey: queryKeys.notifications.list({ limit: 25 }),
        queryFn: () => notificationService.getNotifications({ page: 1, limit: 25 }),
        enabled: Boolean(user),
        refetchInterval: 25000,
    });

    const notifications = notifData?.items || [];
    const unreadCount = notifData?.unreadCount || 0;

    const markReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            toast.success("All notifications marked as read");
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
        onError: () => {
            toast.error("Failed to mark notifications as read");
        },
    });

    useEffect(() => {
        if (!isNotifOpen) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isNotifOpen]);

    const handleSignOut = () => {
        signOut("/");
        void navigate("/", { replace: true });
    };

    const handleNotificationClick = (item: UserNotification) => {
        if (!item.is_read) {
            markReadMutation.mutate(item.id);
        } else {
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        }

        setIsNotifOpen(false);
        const assetId = typeof item.data?.assetId === "string" ? item.data.assetId : null;
        if (assetId) {
            if (item.type === "asset_needs_update" || item.type === "asset_rejected") {
                void navigate(`/dashboard/seller/products/edit/${assetId}`);
            } else {
                void navigate("/dashboard/seller/products/all");
            }
        }
    };

    const renderNotifBadgeIcon = (type: string) => {
        switch (type) {
            case "asset_approved":
                return (
                    <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                        <Icons.Success size={16} />
                    </div>
                );
            case "asset_needs_update":
                return (
                    <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                        <Icons.AlertCircle size={16} />
                    </div>
                );
            case "asset_rejected":
                return (
                    <div className="w-8 h-8 rounded-lg bg-error/15 text-error flex items-center justify-center shrink-0">
                        <Icons.ServerError size={16} />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icons.Bell size={16} />
                    </div>
                );
        }
    };

    const { portalLabel, pageTitle } = getBreadcrumbTitle(location.pathname);
    const displayTitle = title || pageTitle;
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
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Link to="/" className="hover:text-primary transition-colors">
                            Home
                        </Link>
                        <span>/</span>
                        <span className="text-primary font-medium">{portalLabel}</span>
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

                {/* Notification Bell & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => {
                            const next = !isNotifOpen;
                            setIsNotifOpen(next);
                            if (next) {
                                void refetchNotifications();
                            }
                        }}
                        aria-label="Notifications"
                        className="relative p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        <Icons.Bell size={18} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center shadow-xs">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-outline-variant/40 bg-surface text-on-surface shadow-xl z-50 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/25 bg-surface-container-low">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-on-surface">
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <Badge variant="primary" size="sm">
                                            {unreadCount} unread
                                        </Badge>
                                    )}
                                </div>

                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAllReadMutation.mutate()}
                                        isLoading={markAllReadMutation.isPending}
                                        className="h-7 px-2 text-xs text-primary cursor-pointer"
                                    >
                                        Mark all read
                                    </Button>
                                )}
                            </div>

                            <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/20">
                                {notifications.length === 0 ? (
                                    <div className="py-10 px-4 text-center space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant">
                                            <Icons.Bell size={18} />
                                        </div>
                                        <p className="text-xs font-semibold text-on-surface">
                                            No notifications yet
                                        </p>
                                        <p className="text-[11px] text-on-surface-variant">
                                            Updates on your asset submissions and review feedback will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <button
                                            type="button"
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                                                !n.is_read
                                                    ? "bg-primary/5 hover:bg-primary/10"
                                                    : "hover:bg-surface-container-low"
                                            }`}
                                        >
                                            {renderNotifBadgeIcon(n.type)}

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <span
                                                        className={`text-xs truncate ${
                                                            !n.is_read
                                                                ? "font-bold text-on-surface"
                                                                : "font-semibold text-on-surface/90"
                                                        }`}
                                                    >
                                                        {n.title}
                                                    </span>
                                                    <span className="text-[10px] text-on-surface-variant shrink-0">
                                                        {formatDate(n.created_at)}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                                    {n.message}
                                                </p>

                                                {n.data?.assetId && (
                                                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                                                        <span>
                                                            {n.type === "asset_needs_update" || n.type === "asset_rejected"
                                                                ? "Edit & respond to feedback"
                                                                : "View in product catalog"}
                                                        </span>
                                                        <Icons.ChevronRight size={12} />
                                                    </div>
                                                )}
                                            </div>

                                            {!n.is_read && (
                                                <span
                                                    className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"
                                                    title="Unread"
                                                />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Toggle Button */}
                <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                >
                    {theme === "dark" ? <Icons.ThemeLight size={18} /> : <Icons.ThemeDark size={18} />}
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
                    <span className="hidden sm:inline-block text-xs font-medium text-on-surface max-w-30 truncate">
                        {user?.displayName || user?.name || "User"}
                    </span>
                    <button
                        type="button"
                        onClick={handleSignOut}
                        title="Sign Out"
                        aria-label="Sign Out"
                        className="px-2.5 py-1 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
