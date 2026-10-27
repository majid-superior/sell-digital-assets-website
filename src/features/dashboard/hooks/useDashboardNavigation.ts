// src/features/dashboard/hooks/useDashboardNavigation.ts
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { dashboardNavigationService } from "../services/dashboardNavigationService.ts";
import type { DashboardNavigationResponse } from "../types/index.ts";

export const useDashboardNavigation = () => {
    const { user } = useAuth();
    const role = user?.role || "buyer";
    const permissionsKey = Array.isArray(user?.permissions) ? user.permissions.join(",") : "";

    return useQuery<DashboardNavigationResponse>({
        queryKey: [...queryKeys.dashboard.navigation(role, user?.id), permissionsKey],
        queryFn: () => dashboardNavigationService.getNavigation(role, user?.permissions),
        staleTime: 5 * 60 * 1000,
    });
};

export default useDashboardNavigation;

