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
    id: "seller-products",
    label: "Products",
    path: "/dashboard/seller/products",
    icon: "Package",
    children: [
      {
        id: "seller-products-all",
        label: "All",
        path: "/dashboard/seller/products/all",
        icon: "Layers",
      },
      {
        id: "seller-products-upload",
        label: "Upload",
        path: "/dashboard/seller/products/upload/files",
        icon: "UploadCloud",
      },
      {
        id: "seller-products-bundles",
        label: "Bundles",
        path: "/dashboard/seller/products/bundles",
        icon: "Boxes",
      },
      {
        id: "seller-products-coupons",
        label: "Coupons",
        path: "/dashboard/seller/products/coupons",
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
  getNavigation(role?: string): DashboardNavigationResponse {
    const normalizedRole = role?.toLowerCase();
    const isSellerOrAdmin =
      normalizedRole === "seller" ||
      normalizedRole === "admin" ||
      normalizedRole === "superadmin";

    const items = isSellerOrAdmin ? SELLER_NAV_ITEMS : BUYER_NAV_ITEMS;
    const activeRole = isSellerOrAdmin ? "seller" : "buyer";

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
}

export const dashboardNavigationService = new DashboardNavigationService();
export default dashboardNavigationService;
