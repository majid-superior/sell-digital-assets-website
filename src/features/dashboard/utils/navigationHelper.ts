// src/features/dashboard/utils/navigationHelper.ts
import type { DashboardNavItem, BreadcrumbTrailItem } from "../types/index.ts";
import type { User } from "@/types/user.ts";

export interface UserPortalAccess {
    hasBothRoles: boolean;
    canAccessSeller: boolean;
    canAccessBuyer: boolean;
    defaultPortal: "seller" | "buyer";
    primaryRole: string;
}

/**
 * Evaluates user permissions based on database role / roles array.
 * - hasBothRoles: true if user is an admin, or has both seller and buyer roles.
 * - If hasBothRoles is true, side navigation displays both portal switcher tabs.
 * - If hasBothRoles is false, the tabs are hidden and only the navigation for their role is rendered.
 */
export function getUserPortalAccess(user: User | null, currentPath = ""): UserPortalAccess {
    if (!user) {
        // Fallback for unauthenticated dev view: adapt based on current path preview
        const isSellerPath = currentPath.includes("/seller");
        return {
            hasBothRoles: false,
            canAccessSeller: isSellerPath,
            canAccessBuyer: !isSellerPath,
            defaultPortal: isSellerPath ? "seller" : "buyer",
            primaryRole: "guest",
        };
    }

    const rawRoles: string[] = [];
    if (user.role) {
        rawRoles.push(String(user.role).toLowerCase().trim());
    }
    if (Array.isArray(user.roles)) {
        user.roles.forEach((r) => {
            if (r) rawRoles.push(String(r).toLowerCase().trim());
        });
    }

    const rolesSet = new Set(rawRoles);

    // Database role IDs: 1 = admin, 2 = seller, 3 = buyer/customer, 4 = store_manager, 5 = content_uploader, 6 = analyst
    const isAdmin = rolesSet.has("admin") || user.role_id === 1;
    const isStoreTeam =
        rolesSet.has("store_manager") ||
        rolesSet.has("content_uploader") ||
        rolesSet.has("analyst") ||
        [4, 5, 6].includes(user.role_id || 0) ||
        Boolean(user.parent_seller_id);
    const isSeller =
        isAdmin ||
        rolesSet.has("seller") ||
        user.role_id === 2 ||
        Boolean(user.sellerProfile) ||
        isStoreTeam;

    // Unified Marketplace Principle:
    // Every authenticated user has Buyer capabilities (they can purchase assets, download deliverables, and manage keys).
    // Sellers and Admins have both capabilities (selling & buying), enabling the Dual-Portal Switcher.
    const canAccessBuyer = true;
    const canAccessSeller = isAdmin || isSeller;
    const hasBothRoles = canAccessSeller && canAccessBuyer;

    let defaultPortal: "seller" | "buyer" = "buyer";
    if (canAccessSeller) {
        defaultPortal = "seller";
    } else {
        defaultPortal = "buyer";
    }

    return {
        hasBothRoles,
        canAccessSeller,
        canAccessBuyer,
        defaultPortal,
        primaryRole: user.role || (canAccessSeller ? "seller" : "buyer"),
    };
}

export function findNavTrail(
    items: DashboardNavItem[],
    pathname: string,
    ancestors: { label: string; path: string; id: string }[] = []
): { item: DashboardNavItem; breadcrumbs: BreadcrumbTrailItem[]; parentIds: string[] } | null {
    for (const item of items) {
        const currentTrail = [...ancestors, { label: item.label, path: item.path, id: item.id }];

        if (item.children && item.children.length > 0) {
            const childResult = findNavTrail(item.children, pathname, currentTrail);
            if (childResult) {
                return childResult;
            }
        }

        if (item.path === pathname) {
            return {
                item,
                breadcrumbs: currentTrail.map((b) => ({ label: b.label, path: b.path })),
                parentIds: ancestors.map((a) => a.id),
            };
        }
    }
    return null;
}
