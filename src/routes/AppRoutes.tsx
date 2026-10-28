// src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/layouts/website/index.tsx";
import Page from "@/layouts/website/page.tsx";
import { SellerLayout } from "@/layouts/SellerLayout.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";

import ProtectedRoute from "@/routes/ProtectedRoute.tsx";
import { useAuth } from "@/hooks/useAuth.ts";
import { getUserPortalAccess } from "@/features/dashboard/utils/navigationHelper.ts";
import type { UserRole } from "@/types/user.ts";

const HomePage = lazy(() => import("@/features/website/pages/HomePage.tsx"));
const SignInPage = lazy(() => import("@/layouts/website/pages/signIn.tsx"));
const SignUpPage = lazy(() => import("@/layouts/website/pages/signUp.tsx"));
const ServerPage = lazy(() => import("@/layouts/website/pages/server.tsx"));
const ErrorPage = lazy(() => import("@/layouts/website/pages/error.tsx"));
const ExplorePage = lazy(() => import("@/features/website/pages/ExplorePage.tsx"));
const AssetDetailPage = lazy(() => import("@/features/website/pages/AssetDetailPage.tsx"));
const StaticInfoPage = lazy(() => import("@/features/website/pages/StaticInfoPage.tsx"));
const SellerStorefrontPage = lazy(
    () => import("@/features/public-catalog/pages/SellerStorefrontPage.tsx")
);

// Dashboard feature routes
const DashboardLayout = lazy(() => import("@/features/dashboard/layouts/DashboardLayout.tsx"));
const EmptyDashboardPage = lazy(() => import("@/features/dashboard/pages/EmptyDashboardPage.tsx"));

// Seller and Buyer Portal pages
const StorefrontSetupPage = lazy(
    () => import("@/features/seller-dashboard/pages/StorefrontSetupPage.tsx")
);
const SellerAssetsPage = lazy(() => import("@/features/dashboard/pages/seller/SellerAssetsPage.tsx"));
const SellerAssetWizardPage = lazy(() => import("@/features/dashboard/pages/seller/SellerAssetWizardPage.tsx"));
const RolesPage = lazy(() => import("@/features/dashboard/pages/seller/RolesPage.tsx"));
const PermissionsPage = lazy(() => import("@/features/dashboard/pages/seller/PermissionsPage.tsx"));
const MembersPage = lazy(() => import("@/features/dashboard/pages/seller/MembersPage.tsx"));
const SellerCouponsPage = lazy(() => import("@/features/dashboard/pages/seller/SellerCouponsPage.tsx").then(m => ({ default: m.SellerCouponsPage })));
const BuyerDownloadsPage = lazy(() => import("@/features/dashboard/pages/buyer/BuyerDownloadsPage.tsx"));
const BuyerLicensesPage = lazy(() => import("@/features/dashboard/pages/buyer/BuyerLicensesPage.tsx"));

export interface AppRoutesProps {
    isAuthenticated?: boolean;
    userRole?: UserRole | null;
}

const SELLER_ROLES: UserRole[] = [
    "seller",
    "admin",
    "SELLER",
    "ADMIN",
    "manager",
    "user",
    "store_manager",
    "content_uploader",
    "analyst",
    "MANAGER",
    "USER",
    "STORE_MANAGER",
    "CONTENT_UPLOADER",
    "ANALYST",
];

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

export const AppRoutes: React.FC<AppRoutesProps> = () => {
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

                        {/* Seller Portal Routes (Requires seller, admin, or store team member role) */}
                        <Route element={<ProtectedRoute allowedRoles={SELLER_ROLES} />}>
                            <Route path="seller" element={<Navigate to="/dashboard/seller/overview" replace />} />
                            <Route path="seller/overview" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Overview" />} />
                            <Route path="seller/storefront" element={<StorefrontSetupPage />} />
                            {/* Canonical Assets Routes */}
                            <Route path="seller/assets" element={<Navigate to="/dashboard/seller/assets/all" replace />} />
                            <Route path="seller/assets/all" element={<SellerAssetsPage />} />
                            <Route path="seller/assets/new" element={<SellerAssetWizardPage />} />
                            <Route path="seller/assets/upload" element={<Navigate to="/dashboard/seller/assets/upload/files" replace />} />
                            <Route path="seller/assets/upload/files" element={<SellerAssetWizardPage />} />
                            <Route path="seller/assets/edit/:id" element={<SellerAssetWizardPage />} />
                            <Route path="seller/assets/upload/licenses" element={<Navigate to="/dashboard/seller/assets/upload/files" replace />} />
                            <Route path="seller/assets/bundles" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Bundles" />} />
                            <Route path="seller/assets/coupons" element={<SellerCouponsPage />} />
                            <Route path="seller/coupons" element={<Navigate to="/dashboard/seller/assets/coupons" replace />} />

                            {/* Backward Compatibility Aliases for Products Routes */}
                            <Route path="seller/products" element={<Navigate to="/dashboard/seller/assets/all" replace />} />
                            <Route path="seller/products/all" element={<Navigate to="/dashboard/seller/assets/all" replace />} />
                            <Route path="seller/products/new" element={<Navigate to="/dashboard/seller/assets/new" replace />} />
                            <Route path="seller/products/upload" element={<Navigate to="/dashboard/seller/assets/upload/files" replace />} />
                            <Route path="seller/products/upload/files" element={<Navigate to="/dashboard/seller/assets/upload/files" replace />} />
                            <Route path="seller/products/edit/:id" element={<SellerAssetWizardPage />} />
                            <Route path="seller/products/upload/licenses" element={<Navigate to="/dashboard/seller/assets/upload/files" replace />} />
                            <Route path="seller/products/bundles" element={<Navigate to="/dashboard/seller/assets/bundles" replace />} />
                            <Route path="seller/products/coupons" element={<Navigate to="/dashboard/seller/assets/coupons" replace />} />

                            <Route path="seller/sales" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Sales" />} />
                            <Route path="seller/reviews" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Reviews" />} />
                            <Route path="seller/disputes" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Disputes" />} />
                            <Route path="seller/payouts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Payouts" />} />
                            <Route path="seller/analytics" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Analytics" />} />
                            {/* Canonical Users Routes: Roles, Permissions, Members */}
                            <Route path="seller/users" element={<Navigate to="/dashboard/seller/users/roles" replace />} />
                            <Route path="seller/users/roles" element={<RolesPage />} />
                            <Route path="seller/users/permissions" element={<PermissionsPage />} />
                            <Route path="seller/users/members" element={<MembersPage />} />
                            <Route path="seller/team" element={<Navigate to="/dashboard/seller/users/members" replace />} />
                            <Route path="seller/settings" element={<Navigate to="/dashboard/seller/settings/profile" replace />} />
                            <Route path="seller/settings/profile" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Profile" />} />
                            <Route path="seller/settings/alerts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Alerts" />} />
                            <Route path="seller/settings/payouts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Payouts" />} />
                            <Route path="overview" element={<Navigate to="/dashboard/seller/overview" replace />} />
                            <Route path="storefront" element={<Navigate to="/dashboard/seller/storefront" replace />} />
                            <Route path="assets" element={<Navigate to="/dashboard/seller/assets/all" replace />} />
                            <Route path="coupons" element={<Navigate to="/dashboard/seller/assets/coupons" replace />} />
                            <Route path="products" element={<Navigate to="/dashboard/seller/assets/all" replace />} />
                            <Route path="sales" element={<Navigate to="/dashboard/seller/sales" replace />} />
                            <Route path="users" element={<Navigate to="/dashboard/seller/users/roles" replace />} />
                            <Route path="team" element={<Navigate to="/dashboard/seller/users/members" replace />} />
                            <Route path="roles" element={<Navigate to="/dashboard/seller/users/roles" replace />} />
                            <Route path="permissions" element={<Navigate to="/dashboard/seller/users/permissions" replace />} />
                            <Route path="members" element={<Navigate to="/dashboard/seller/users/members" replace />} />
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

                    {/* Direct Seller Protected Routes (/seller/*) */}
                    <Route element={<ProtectedRoute allowedRoles={SELLER_ROLES} />}>
                        <Route path="/seller" element={<SellerLayout />}>
                            <Route index element={<Navigate replace to="overview" />} />
                            <Route path="overview" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Overview" />} />
                            <Route path="storefront" element={<StorefrontSetupPage />} />
                            <Route path="assets" element={<SellerAssetsPage />} />
                            <Route path="assets/new/files" element={<SellerAssetWizardPage />} />
                            <Route path="assets/coupons" element={<SellerCouponsPage />} />
                            <Route path="coupons" element={<Navigate to="/dashboard/seller/assets/coupons" replace />} />
                            <Route path="products" element={<Navigate to="/seller/assets" replace />} />
                            <Route path="products/new/files" element={<Navigate to="/seller/assets/new/files" replace />} />
                            <Route path="products/coupons" element={<Navigate to="/dashboard/seller/assets/coupons" replace />} />
                            <Route path="orders" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Sales" />} />
                            <Route path="reviews" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Reviews" />} />
                            <Route path="disputes" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Disputes" />} />
                            <Route path="payouts" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Payouts" />} />
                            <Route path="analytics" element={<EmptyDashboardPage portalName="Seller Portal" customTitle="Analytics" />} />
                            <Route path="users" element={<Navigate to="/seller/users/roles" replace />} />
                            <Route path="users/roles" element={<RolesPage />} />
                            <Route path="users/permissions" element={<PermissionsPage />} />
                            <Route path="users/members" element={<MembersPage />} />
                            <Route path="team" element={<Navigate to="/seller/users/members" replace />} />
                        </Route>
                    </Route>
                </Route>

                {/* Server Error page */}
                <Route path="/server" element={<ServerPage />} />

                {/* Website Pages share Page Layout (Header + Navbar + Footer) */}
                <Route element={<Page />}>
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/catalog" element={<ExplorePage />} />
                    <Route path="/categories" element={<ExplorePage />} />
                    <Route path="/featured" element={<ExplorePage />} />
                    <Route path="/asset/:slug" element={<AssetDetailPage />} />
                    <Route path="/assets/:slug" element={<AssetDetailPage />} />

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

                    {/* Custom Seller Storefront Route: selldigitalassets.com/seller01 */}
                    <Route path="/:sellerUrl" element={<SellerStorefrontPage />} />
                </Route>

                {/* 404 Not Found fallback */}
                <Route path="*" element={<ErrorPage />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
