// src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/layouts/website/index.tsx";
import Page from "@/layouts/website/page.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";

import ProtectedRoute from "@/routes/ProtectedRoute.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { getUserPortalAccess } from "@/features/dashboard/utils/navigationHelper.ts";

const HomePage = lazy(() => import("@/features/website/pages/HomePage.tsx"));
const SignInPage = lazy(() => import("@/layouts/website/pages/signIn.tsx"));
const SignUpPage = lazy(() => import("@/layouts/website/pages/signUp.tsx"));
const ServerPage = lazy(() => import("@/layouts/website/pages/server.tsx"));
const ErrorPage = lazy(() => import("@/layouts/website/pages/error.tsx"));
const ExplorePage = lazy(() => import("@/features/website/pages/ExplorePage.tsx"));
const AssetDetailPage = lazy(() => import("@/features/website/pages/AssetDetailPage.tsx"));
const StaticInfoPage = lazy(() => import("@/features/website/pages/StaticInfoPage.tsx"));

// Dashboard feature routes
const DashboardLayout = lazy(() => import("@/features/dashboard/layouts/DashboardLayout.tsx"));
const EmptyDashboardPage = lazy(() => import("@/features/dashboard/pages/EmptyDashboardPage.tsx"));

// Seller and Buyer Portal pages
const SellerProductsPage = lazy(() => import("@/features/dashboard/pages/seller/SellerProductsPage.tsx"));
const SellerProductWizardPage = lazy(() => import("@/features/dashboard/pages/seller/SellerProductWizardPage.tsx"));
const BuyerDownloadsPage = lazy(() => import("@/features/dashboard/pages/buyer/BuyerDownloadsPage.tsx"));
const BuyerLicensesPage = lazy(() => import("@/features/dashboard/pages/buyer/BuyerLicensesPage.tsx"));

const DashboardIndexRedirect: React.FC = () => {
    const { user } = useAuth();
    const access = getUserPortalAccess(user);
    const targetPath = access.defaultPortal === "seller"
        ? "/dashboard/seller/overview"
        : "/dashboard/buyer/library/downloads";
    return <Navigate to={targetPath} replace />;
};

const RouteLoadingFallback = () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-background text-on-surface">
        <Spinner size="lg" />
    </div>
);

export const AppRoutes: React.FC = () => {
    return (
        <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                    {/* Home / Index — has its own full layout shell */}
                    <Route element={<Index />}>
                        <Route path="/" element={<HomePage />} />
                    </Route>

                    {/* Standalone Auth Pages — no header, no footer */}
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Authenticated Dashboard Routes (Both Seller & Buyer) */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<DashboardLayout />}>
                            <Route index element={<DashboardIndexRedirect />} />

                            {/* Seller Portal Routes (Requires seller or admin role) */}
                            <Route element={<ProtectedRoute allowedRoles={["seller", "admin"]} />}>
                                <Route path="seller" element={<Navigate to="/dashboard/seller/overview" replace />} />
                                <Route path="seller/overview" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Overview" />} />
                                <Route path="seller/products" element={<Navigate to="/dashboard/seller/products/all" replace />} />
                                <Route path="seller/products/all" element={<SellerProductsPage />} />
                                <Route path="seller/products/new" element={<SellerProductWizardPage />} />
                                <Route path="seller/products/upload" element={<Navigate to="/dashboard/seller/products/upload/files" replace />} />
                                <Route path="seller/products/upload/files" element={<SellerProductWizardPage />} />
                                <Route path="seller/products/edit/:id" element={<SellerProductWizardPage />} />
                                <Route path="seller/products/upload/licenses" element={<Navigate to="/dashboard/seller/products/upload/files" replace />} />
                                <Route path="seller/products/bundles" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Bundles" />} />
                                <Route path="seller/products/coupons" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Coupons" />} />
                                <Route path="seller/sales" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Sales" />} />
                                <Route path="seller/reviews" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Reviews" />} />
                                <Route path="seller/disputes" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Disputes" />} />
                                <Route path="seller/payouts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Payouts" />} />
                                <Route path="seller/analytics" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Analytics" />} />
                                <Route path="seller/settings" element={<Navigate to="/dashboard/seller/settings/profile" replace />} />
                                <Route path="seller/settings/profile" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Profile" />} />
                                <Route path="seller/settings/alerts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Alerts" />} />
                                <Route path="seller/settings/payouts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Payouts" />} />
                                <Route path="overview" element={<Navigate to="/dashboard/seller/overview" replace />} />
                                <Route path="products" element={<Navigate to="/dashboard/seller/products/all" replace />} />
                                <Route path="sales" element={<Navigate to="/dashboard/seller/sales" replace />} />
                                <Route path="settings" element={<Navigate to="/dashboard/seller/settings/profile" replace />} />
                            </Route>

                            {/* Buyer Portal Routes */}
                            <Route path="buyer" element={<Navigate to="/dashboard/buyer/library/downloads" replace />} />
                            <Route path="buyer/library" element={<Navigate to="/dashboard/buyer/library/downloads" replace />} />
                            <Route path="buyer/library/downloads" element={<BuyerDownloadsPage />} />
                            <Route path="buyer/library/keys" element={<BuyerLicensesPage />} />
                            <Route path="buyer/orders" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Orders" />} />
                            <Route path="buyer/invoices" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Invoices" />} />
                            <Route path="buyer/payments" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Payments" />} />
                            <Route path="buyer/reviews" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Reviews" />} />
                            <Route path="buyer/disputes" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Disputes" />} />
                            <Route path="buyer/refunds" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Refunds" />} />
                            <Route path="buyer/settings" element={<Navigate to="/dashboard/buyer/settings/profile" replace />} />
                            <Route path="buyer/settings/profile" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Profile" />} />
                            <Route path="buyer/settings/security" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Security" />} />
                            <Route path="buyer/settings/alerts" element={<EmptyDashboardPage portalName="Buyer Portal" customTitle="Alerts" />} />

                            {/* Direct Buyer Aliases */}
                            <Route path="purchases" element={<Navigate to="/dashboard/buyer/library/downloads" replace />} />
                            <Route path="orders" element={<Navigate to="/dashboard/buyer/orders" replace />} />
                        </Route>
                    </Route>

                    {/* Server Error page */}
                    <Route path="/server" element={<ServerPage />} />

                    {/* Website Pages share Page Layout (Header + Navbar + Footer) */}
                    <Route element={<Page />}>
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/categories" element={<ExplorePage />} />
                        <Route path="/featured" element={<ExplorePage />} />
                        <Route path="/asset/:slug" element={<AssetDetailPage />} />

                        {/* Legal & Informational Static Pages */}
                        <Route path="/terms" element={<StaticInfoPage title="Terms of Service" category="Legal" />} />
                        <Route path="/privacy" element={<StaticInfoPage title="Privacy Policy" category="Legal" />} />
                        <Route path="/licenses" element={<StaticInfoPage title="Licensing Agreement" category="Legal" />} />
                        <Route path="/security" element={<StaticInfoPage title="Security & Trust" category="Security" />} />
                        <Route path="/docs" element={<StaticInfoPage title="Documentation" category="Resources" />} />
                        <Route path="/help" element={<StaticInfoPage title="Help Center" category="Support" />} />
                        <Route path="/about" element={<StaticInfoPage title="About Us" category="Company" />} />
                        <Route path="/careers" element={<StaticInfoPage title="Careers" category="Company" />} />
                        <Route path="/community" element={<StaticInfoPage title="Creator Community" category="Community" />} />
                        <Route path="/creator-guidelines" element={<StaticInfoPage title="Creator Guidelines" category="Creators" />} />
                        <Route path="/payouts" element={<StaticInfoPage title="Fee Structure & Payouts" category="Creators" />} />
                        <Route path="/standards" element={<StaticInfoPage title="Asset Quality Standards" category="Creators" />} />
                        <Route path="/seller-handbook" element={<StaticInfoPage title="Seller Handbook" category="Creators" />} />
                        <Route path="/api-docs" element={<StaticInfoPage title="API Reference" category="Developers" />} />
                    </Route>

                    {/* 404 Not Found fallback */}
                    <Route path="*" element={<ErrorPage />} />
                </Routes>
            </Suspense>
    );
};

export default AppRoutes;
