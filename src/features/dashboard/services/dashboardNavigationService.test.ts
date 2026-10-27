// src/features/dashboard/services/dashboardNavigationService.test.ts
import { describe, it, expect } from "vitest";
import {
  dashboardNavigationService,
  SELLER_NAV_ITEMS,
} from "./dashboardNavigationService.ts";
import { findNavTrail } from "../utils/navigationHelper.ts";

describe("Dashboard Navigation Service - Seller Assets Rename", () => {
  it("defines Assets section instead of Products in SELLER_NAV_ITEMS", () => {
    const assetsSection = SELLER_NAV_ITEMS.find(
      (item) => item.id === "seller-assets",
    );
    expect(assetsSection).toBeDefined();
    expect(assetsSection?.label).toBe("Assets");
    expect(assetsSection?.path).toBe("/dashboard/seller/assets");

    // Ensure stale seller-products section does not exist
    const productsSection = SELLER_NAV_ITEMS.find(
      (item) => item.id === "seller-products",
    );
    expect(productsSection).toBeUndefined();
  });

  it("preserves all submenu items under Assets with updated routes and identifiers", () => {
    const assetsSection = SELLER_NAV_ITEMS.find(
      (item) => item.id === "seller-assets",
    );
    expect(assetsSection?.children).toBeDefined();
    expect(assetsSection?.children).toHaveLength(4);

    const [all, upload, bundles, coupons] = assetsSection!.children!;

    expect(all).toEqual({
      id: "seller-assets-all",
      label: "All",
      path: "/dashboard/seller/assets/all",
      icon: "Layers",
    });

    expect(upload).toEqual({
      id: "seller-assets-upload",
      label: "Upload",
      path: "/dashboard/seller/assets/upload/files",
      icon: "UploadCloud",
    });

    expect(bundles).toEqual({
      id: "seller-assets-bundles",
      label: "Bundles",
      path: "/dashboard/seller/assets/bundles",
      icon: "Boxes",
    });

    expect(coupons).toEqual({
      id: "seller-assets-coupons",
      label: "Coupons",
      path: "/dashboard/seller/assets/coupons",
      icon: "Tag",
    });
  });

  it("findNavTrail correctly locates the Assets trail for breadcrumb and active state", () => {
    const trail = findNavTrail(
      SELLER_NAV_ITEMS,
      "/dashboard/seller/assets/all",
    );
    expect(trail).not.toBeNull();
    expect(trail?.item.label).toBe("All");
    expect(trail?.breadcrumbs).toEqual([
      { label: "Assets", path: "/dashboard/seller/assets" },
      { label: "All", path: "/dashboard/seller/assets/all" },
    ]);
    expect(trail?.parentIds).toEqual(["seller-assets"]);
  });

  it("defines Users section in SELLER_NAV_ITEMS", () => {
    const usersSection = SELLER_NAV_ITEMS.find((item) => item.id === "seller-users");
    expect(usersSection).toBeDefined();
    expect(usersSection?.label).toBe("Users");
    expect(usersSection?.path).toBe("/dashboard/seller/users");
    expect(usersSection?.icon).toBe("Users");
  });

  it("getNavigation('seller') returns exactly 10 navigation sections including Assets and Users", () => {
    const nav = dashboardNavigationService.getNavigation("seller");
    expect(nav.sections).toHaveLength(1);
    expect(nav.sections[0].title).toBe("Seller Navigation");
    expect(nav.sections[0].items).toHaveLength(10);

    const labels = nav.sections[0].items.map((i) => i.label);
    expect(labels).toContain("Overview");
    expect(labels).toContain("Setup Store Front");
    expect(labels).toContain("Assets");
    expect(labels).toContain("Users");
    expect(labels).not.toContain("Products");
  });
});
