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
}

export interface DashboardNavSection {
    id: string;
    title?: string;
    items: DashboardNavItem[];
}

export interface DashboardNavigationResponse {
    sections: DashboardNavSection[];
}

export interface StatItem {
    id: string;
    label: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: string;
    description?: string;
}

export interface RecentActivityItem {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    amount?: string;
    status: "completed" | "pending" | "processing" | "refunded";
    downloadUrl?: string;
}

