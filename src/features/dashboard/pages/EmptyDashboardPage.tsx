// src/features/dashboard/pages/EmptyDashboardPage.tsx
import React from "react";
import { useLocation } from "react-router-dom";
import { SELLER_NAV_ITEMS, BUYER_NAV_ITEMS } from "../services/dashboardNavigationService.ts";
import { findNavTrail } from "../utils/navigationHelper.ts";

export interface EmptyDashboardPageProps {
    portalName?: "Seller Portal" | "Buyer Portal";
    customTitle?: string;
}

export const EmptyDashboardPage: React.FC<EmptyDashboardPageProps> = ({
    portalName,
    customTitle,
}) => {
    const location = useLocation();
    const pathname = location.pathname;

    const isSeller = pathname.includes("/seller");
    const inferredPortal = portalName || (isSeller ? "Seller Portal" : "Buyer Portal");
    const items = isSeller ? SELLER_NAV_ITEMS : BUYER_NAV_ITEMS;

    const navInfo = findNavTrail(items, pathname);
    const title = customTitle || navInfo?.item.label || "Page";
    const breadcrumbTrail = navInfo?.breadcrumbs || [];

    return (
        <div className="space-y-6 animate-fade-in w-full">
            {/* Header with Title and Breadcrumb */}
            <div className="pb-5 border-b border-outline-variant/30">
                <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
                    <span className="font-medium text-primary">{inferredPortal}</span>
                    {breadcrumbTrail.map((crumb, idx) => (
                        <React.Fragment key={`${crumb.path}-${idx}`}>
                            <span>/</span>
                            <span
                                className={
                                    idx === breadcrumbTrail.length - 1
                                        ? "text-on-surface font-semibold"
                                        : "text-on-surface-variant"
                                }
                            >
                                {crumb.label}
                            </span>
                        </React.Fragment>
                    ))}
                </nav>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                    {title}
                </h1>
                <p className="text-xs text-on-surface-variant font-mono mt-1">
                    Route: {pathname}
                </p>
            </div>

            {/* Completely Empty Canvas (No mock, dummy, or sample data) */}
            <div className="min-h-[420px] rounded-3xl border border-dashed border-outline-variant/40 bg-surface-container-low/40 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                </div>
                <h3 className="text-sm font-semibold text-on-surface">
                    {inferredPortal} — {breadcrumbTrail.map((b) => b.label).join(" › ") || title}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-sm mt-1">
                    This page is empty.
                </p>
            </div>
        </div>
    );
};

export default EmptyDashboardPage;

