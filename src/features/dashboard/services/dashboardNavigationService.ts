// src/features/dashboard/services/dashboardNavigationService.ts
import type {
  DashboardNavItem,
  DashboardNavigationResponse,
} from "../types/index.ts";

export const SELLER_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "seller-overview",
    label: "Overview",
    path: "/dashboard/seller/overview",
    icon: "LayoutDashboard",
    exact: true,
  },
  {
    id: "seller-storefront",
    label: "Setup Store Front",
    path: "/dashboard/seller/storefront",
    icon: "Store",
  },
  {
    id: "seller-assets",
    label: "Assets",
    path: "/dashboard/seller/assets",
    icon: "Package",
    children: [
      {
        id: "seller-assets-all",
        label: "All",
        path: "/dashboard/seller/assets/all",
        icon: "Layers",
      },
      {
        id: "seller-assets-upload",
        label: "Upload",
        path: "/dashboard/seller/assets/upload/files",
        icon: "UploadCloud",
      },
      {
        id: "seller-assets-bundles",
        label: "Bundles",
        path: "/dashboard/seller/assets/bundles",
        icon: "Boxes",
      },
      {
        id: "seller-assets-coupons",
        label: "Coupons",
        path: "/dashboard/seller/assets/coupons",
        icon: "Tag",
      },
    ],
  },
  {
    id: "seller-sales",
    label: "Sales",
    path: "/dashboard/seller/sales",
    icon: "TrendingUp",
  },
  {
    id: "seller-reviews",
    label: "Reviews",
    path: "/dashboard/seller/reviews",
    icon: "Star",
  },
  {
    id: "seller-disputes",
    label: "Disputes",
    path: "/dashboard/seller/disputes",
    icon: "AlertCircle",
  },
  {
    id: "seller-payouts",
    label: "Payouts",
    path: "/dashboard/seller/payouts",
    icon: "Wallet",
  },
  {
    id: "seller-analytics",
    label: "Analytics",
    path: "/dashboard/seller/analytics",
    icon: "BarChart3",
  },
  {
    id: "seller-users",
    label: "Users",
    path: "/dashboard/seller/users",
    icon: "Users",
    children: [
      {
        id: "seller-users-roles",
        label: "Roles",
        path: "/dashboard/seller/users/roles",
        icon: "Shield",
      },
      {
        id: "seller-users-permissions",
        label: "Permissions",
        path: "/dashboard/seller/users/permissions",
        icon: "KeyRound",
      },
      {
        id: "seller-users-members",
        label: "Members",
        path: "/dashboard/seller/users/members",
        icon: "Users",
      },
    ],
  },
  {
    id: "seller-settings",
    label: "Settings",
    path: "/dashboard/seller/settings",
    icon: "Settings",
    children: [
      {
        id: "seller-settings-profile",
        label: "Profile",
        path: "/dashboard/seller/settings/profile",
        icon: "User",
      },
      {
        id: "seller-settings-alerts",
        label: "Alerts",
        path: "/dashboard/seller/settings/alerts",
        icon: "Bell",
      },
      {
        id: "seller-settings-payouts",
        label: "Payouts",
        path: "/dashboard/seller/settings/payouts",
        icon: "CreditCard",
      },
    ],
  },
];

export const BUYER_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: "buyer-library",
    label: "Library",
    path: "/dashboard/buyer/library",
    icon: "Library",
    children: [
      {
        id: "buyer-library-downloads",
        label: "Downloads",
        path: "/dashboard/buyer/library/downloads",
        icon: "Download",
      },
      {
        id: "buyer-library-keys",
        label: "Keys",
        path: "/dashboard/buyer/library/keys",
        icon: "KeyRound",
      },
    ],
  },
  {
    id: "buyer-orders",
    label: "Orders",
    path: "/dashboard/buyer/orders",
    icon: "ShoppingBag",
  },
  {
    id: "buyer-invoices",
    label: "Invoices",
    path: "/dashboard/buyer/invoices",
    icon: "Receipt",
  },
  {
    id: "buyer-payments",
    label: "Payments",
    path: "/dashboard/buyer/payments",
    icon: "CreditCard",
  },
  {
    id: "buyer-reviews",
    label: "Reviews",
    path: "/dashboard/buyer/reviews",
    icon: "Star",
  },
  {
    id: "buyer-disputes",
    label: "Disputes",
    path: "/dashboard/buyer/disputes",
    icon: "AlertCircle",
  },
  {
    id: "buyer-refunds",
    label: "Refunds",
    path: "/dashboard/buyer/refunds",
    icon: "RotateCcw",
  },
  {
    id: "buyer-settings",
    label: "Settings",
    path: "/dashboard/buyer/settings",
    icon: "Settings",
    children: [
      {
        id: "buyer-settings-profile",
        label: "Profile",
        path: "/dashboard/buyer/settings/profile",
        icon: "User",
      },
      {
        id: "buyer-settings-security",
        label: "Security",
        path: "/dashboard/buyer/settings/security",
        icon: "Shield",
      },
      {
        id: "buyer-settings-alerts",
        label: "Alerts",
        path: "/dashboard/buyer/settings/alerts",
        icon: "Bell",
      },
    ],
  },
];

class DashboardNavigationService {
  getNavigation(role?: string, permissions?: string[]): DashboardNavigationResponse {
    const normalizedRole = role?.toLowerCase();
    const isSellerOrAdmin =
      normalizedRole === "seller" ||
      normalizedRole === "admin" ||
      normalizedRole === "superadmin";

    let items = isSellerOrAdmin ? SELLER_NAV_ITEMS : BUYER_NAV_ITEMS;
    const activeRole = isSellerOrAdmin ? "seller" : "buyer";

    // If permissions are specified for a seller team member and not unrestricted ('*')
    if (isSellerOrAdmin && Array.isArray(permissions) && !permissions.includes("*")) {
      const permsSet = new Set(permissions);
      items = this.filterSellerNavItems(SELLER_NAV_ITEMS, permsSet);
    }

    return {
      sections: [
        {
          id: activeRole,
          title:
            activeRole === "seller" ? "Seller Navigation" : "Buyer Navigation",
          items,
        },
      ],
    };
  }

  private filterSellerNavItems(items: DashboardNavItem[], perms: Set<string>): DashboardNavItem[] {
    const filtered: DashboardNavItem[] = [];

    for (const item of items) {
      if (item.id === "seller-overview") {
        if (perms.has("analytics:view") || perms.has("products:view") || perms.has("orders:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-storefront") {
        if (perms.has("storefront:view") || perms.has("storefront:edit")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-assets") {
        const allowedChildren = (item.children || []).filter((child) => {
          if (child.id === "seller-assets-all" || child.id === "seller-assets-bundles") {
            return perms.has("products:view");
          }
          if (child.id === "seller-assets-upload") {
            return perms.has("products:create");
          }
          if (child.id === "seller-assets-coupons") {
            return perms.has("coupons:view") || perms.has("coupons:manage");
          }
          return false;
        });

        if (allowedChildren.length > 0) {
          filtered.push({
            ...item,
            children: allowedChildren,
          });
        }
      } else if (item.id === "seller-sales") {
        if (perms.has("orders:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-reviews") {
        if (perms.has("products:view") || perms.has("orders:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-disputes") {
        if (perms.has("orders:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-payouts") {
        if (perms.has("financial:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-analytics") {
        if (perms.has("analytics:view")) {
          filtered.push(item);
        }
      } else if (item.id === "seller-users") {
        const allowedChildren = (item.children || []).filter((child) => {
          if (
            child.id === "seller-users-roles" ||
            child.id === "seller-users-permissions" ||
            child.id === "seller-users-members"
          ) {
            return perms.has("team:view") || perms.has("team:manage");
          }
          return false;
        });

        if (allowedChildren.length > 0) {
          filtered.push({
            ...item,
            children: allowedChildren,
          });
        }
      } else if (item.id === "seller-settings") {
        const allowedChildren = (item.children || []).filter((child) => {
          if (child.id === "seller-settings-profile" || child.id === "seller-settings-alerts") {
            return perms.has("settings:view") || perms.has("settings:edit");
          }
          if (child.id === "seller-settings-payouts") {
            return perms.has("financial:view");
          }
          return false;
        });

        if (allowedChildren.length > 0) {
          filtered.push({
            ...item,
            children: allowedChildren,
          });
        }
      }
    }

    return filtered;
  }
}

export const dashboardNavigationService = new DashboardNavigationService();
export default dashboardNavigationService;
