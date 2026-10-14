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

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // If role not authorized, redirect to home
        return <Navigate to="/" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
