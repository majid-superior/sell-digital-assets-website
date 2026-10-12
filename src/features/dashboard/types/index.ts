// src/features/dashboard/types/index.ts
import type { UserRole } from "@/types/user.ts";

export type NavBadgeVariant = "primary" | "secondary" | "success" | "warning";

export interface DashboardNavItem {
    id: string;
    label: string;
    path: string;
    icon: string;
    badge?: string;
    badgeVariant?: NavBadgeVariant;
    roles?: UserRole[];
    exact?: boolean;
    children?: DashboardNavItem[];
}

export interface DashboardNavSection {
    id: string;
    title?: string;
    items: DashboardNavItem[];
}

export interface DashboardNavigationResponse {
    sections: DashboardNavSection[];
}

export interface BreadcrumbTrailItem {
    label: string;
    path: string;
}
