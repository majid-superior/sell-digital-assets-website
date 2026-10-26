// src/layouts/SellerLayout.tsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icons, type IconComponent } from "../lib/icons/index.ts";

export interface SellerNavItem {
  label: string;
  path: string;
  icon: string;
}

const sellerNavItems: SellerNavItem[] = [
  { label: "Overview", path: "/seller/overview", icon: "dashboard" },
  { label: "Setup Storefront", path: "/seller/storefront", icon: "storefront" },
  { label: "Products", path: "/seller/products", icon: "inventory_2" },
  { label: "Upload", path: "/seller/products/new/files", icon: "cloud_upload" },
  { label: "Sales", path: "/seller/orders", icon: "receipt_long" },
  { label: "Reviews", path: "/seller/reviews", icon: "star" },
  { label: "Disputes", path: "/seller/disputes", icon: "gavel" },
  { label: "Payouts", path: "/seller/payouts", icon: "payments" },
  { label: "Analytics", path: "/seller/analytics", icon: "bar_chart" },
];

const resolveSellerNavIcon = (iconName: string): IconComponent => {
  switch (iconName) {
    case "dashboard":
      return Icons.LayoutDashboard;
    case "storefront":
      return Icons.Store;
    case "inventory_2":
      return Icons.Package;
    case "cloud_upload":
      return Icons.UploadCloud;
    case "receipt_long":
      return Icons.Receipt;
    case "star":
      return Icons.Star;
    case "gavel":
      return Icons.AlertCircle;
    case "payments":
      return Icons.Wallet;
    case "bar_chart":
      return Icons.BarChart3;
    default:
      return Icons.Package;
  }
};

export interface SellerLayoutProps {
  children?: React.ReactNode;
}

export const SellerLayout: React.FC<SellerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-dvh flex bg-background text-on-surface">
      <aside
        aria-label="Seller Navigation"
        className="w-60 shrink-0 border-r border-outline-variant/40 bg-surface-container-lowest p-4 flex flex-col gap-1"
      >
        <div className="px-3 py-2 mb-2 text-label-lg text-on-surface flex items-center gap-2">
          <Icons.Store size={18} className="text-primary" />
          <span>Seller Studio</span>
        </div>
        <nav className="space-y-1">
          {sellerNavItems.map((item) => {
            const IconComponent = resolveSellerNavIcon(item.icon);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-label-lg transition-colors duration-150 ${
                    isActive
                      ? "bg-primary-container text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`
                }
              >
                <IconComponent size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
};

export default SellerLayout;

