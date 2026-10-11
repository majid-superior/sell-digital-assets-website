// src/features/dashboard/services/dashboardNavigationService.ts
import { apiClient } from "@/services/api.ts";
import type { DashboardNavigationResponse, DashboardNavSection } from "../types/index.ts";
import type { UserRole } from "@/types/user.ts";

/**
 * Fallback navigation schema tailored for Seller accounts.
 */
const SELLER_NAV_SECTIONS: DashboardNavSection[] = [
    {
        id: "main",
        title: "Store Management",
        items: [
            {
                id: "overview",
                label: "Overview",
                path: "/dashboard",
                icon: "Dashboard",
                exact: true,
            },
            {
                id: "products",
                label: "My Products",
                path: "/dashboard/products",
                icon: "Package",
                badge: "Active",
                badgeVariant: "primary",
            },
            {
                id: "sales",
                label: "Sales & Analytics",
                path: "/dashboard/sales",
                icon: "Analytics",
            },
            {
                id: "orders",
                label: "Customer Orders",
                path: "/dashboard/orders",
                icon: "FileText",
            },
        ],
    },
    {
        id: "preferences",
        title: "Account & Store",
        items: [
            {
                id: "settings",
                label: "Store Settings",
                path: "/dashboard/settings",
                icon: "Settings",
            },
        ],
    },
];

/**
 * Fallback navigation schema tailored for Buyer accounts.
 */
const BUYER_NAV_SECTIONS: DashboardNavSection[] = [
    {
        id: "main",
        title: "My Library",
        items: [
            {
                id: "overview",
                label: "Overview",
                path: "/dashboard",
                icon: "Dashboard",
                exact: true,
            },
            {
                id: "purchases",
                label: "Purchases & Downloads",
                path: "/dashboard/purchases",
                icon: "Download",
                badge: "Library",
                badgeVariant: "success",
            },
            {
                id: "orders",
                label: "Orders & Invoices",
                path: "/dashboard/orders",
                icon: "FileText",
            },
        ],
    },
    {
        id: "preferences",
        title: "Account",
        items: [
            {
                id: "settings",
                label: "Account Settings",
                path: "/dashboard/settings",
                icon: "Settings",
            },
        ],
    },
];

class DashboardNavigationService {
    /**
     * Fetch navigation items from backend endpoint /api/v1/navigation/dashboard.
     * Gracefully falls back to role-tailored defaults if backend route is not yet deployed.
     */
    async getNavigation(role: UserRole = "buyer"): Promise<DashboardNavigationResponse> {
        try {
            const response = await apiClient.get<DashboardNavigationResponse>("/api/v1/navigation/dashboard");
            if (response && Array.isArray(response.sections) && response.sections.length > 0) {
                return response;
            }
        } catch {
            // Backend endpoint not deployed yet; use role-tailored fallback
        }

        const sections = role === "seller" ? SELLER_NAV_SECTIONS : BUYER_NAV_SECTIONS;
        return { sections };
    }
}

export const dashboardNavigationService = new DashboardNavigationService();
export default dashboardNavigationService;

