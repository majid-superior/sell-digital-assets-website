// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.ts";
import { Spinner } from "@/components/ui/Spinner.tsx";
import type { UserRole } from "@/types/user.ts";

export interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    redirectPath?: string;
    children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    redirectPath = "/signin",
    children,
}) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
                <Spinner size="lg" aria-label="Authenticating session" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const normalizedUserRole = String(user.role || "").toLowerCase();
        const userRolesList = Array.isArray(user.roles)
            ? user.roles.map((r) => String(r).toLowerCase())
            : [normalizedUserRole];

        const isSellerProtected = allowedRoles.some((r) => {
            const lower = String(r).toLowerCase();
            return lower === "seller" || lower === "analyst" || lower === "store_manager" || lower === "content_uploader";
        });
        const isStoreTeamMember = Boolean(user.parent_seller_id);

        const isRoleAllowed =
            allowedRoles.some((role) => {
                const lower = String(role).toLowerCase();
                return lower === normalizedUserRole || userRolesList.includes(lower);
            }) ||
            (isSellerProtected && isStoreTeamMember);

        if (!isRoleAllowed) {
            // If role not authorized, redirect to home
            return <Navigate to="/" replace />;
        }
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
