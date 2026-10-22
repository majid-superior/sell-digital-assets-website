// src/services/queryKeys.ts

/**
 * Global Query Key Factory for TanStack React Query.
 * Provides consistent, type-safe query keys across the entire frontend.
 */
export const queryKeys = {
    auth: {
        all: ["auth"] as const,
        currentUser: () => [...queryKeys.auth.all, "currentUser"] as const,
        session: () => [...queryKeys.auth.all, "session"] as const,
    },
    assets: {
        all: ["assets"] as const,
        lists: () => [...queryKeys.assets.all, "list"] as const,
        list: (filters: Record<string, string | number | boolean | undefined> = {}) =>
            [...queryKeys.assets.lists(), filters] as const,
        details: () => [...queryKeys.assets.all, "detail"] as const,
        detail: (idOrSlug: string) =>
            [...queryKeys.assets.details(), idOrSlug] as const,
        featured: () => [...queryKeys.assets.all, "featured"] as const,
        bySeller: (sellerId: string) =>
            [...queryKeys.assets.all, "seller", sellerId] as const,
        sellerLists: () => [...queryKeys.assets.all, "seller-list"] as const,
        sellerList: (params: Record<string, string | number | boolean | undefined> = {}) =>
            [...queryKeys.assets.sellerLists(), params] as const,
        sellerDetails: () => [...queryKeys.assets.all, "seller-detail"] as const,
        sellerDetail: (id: string) =>
            [...queryKeys.assets.sellerDetails(), id] as const,
    },
    categories: {
        all: ["categories"] as const,
        tree: () => [...queryKeys.categories.all, "tree"] as const,
        adminTree: () => [...queryKeys.categories.all, "admin", "tree"] as const,
        taxonomy: () => [...queryKeys.categories.all, "taxonomy"] as const,
        detail: (id: string | number) => [...queryKeys.categories.all, "detail", String(id)] as const,
    },
    licenses: {
        all: ["licenses"] as const,
        buyer: () => [...queryKeys.licenses.all, "buyer"] as const,
        details: () => [...queryKeys.licenses.all, "detail"] as const,
        detail: (key: string) => [...queryKeys.licenses.details(), key] as const,
    },
    downloads: {
        all: ["downloads"] as const,
        history: () => [...queryKeys.downloads.all, "history"] as const,
    },
    dashboard: {
        all: ["dashboard"] as const,
        navigation: (role?: string, userId?: string) =>
            [...queryKeys.dashboard.all, "navigation", role ?? "user", userId ?? "me"] as const,
    },
    notifications: {
        all: ["notifications"] as const,
        list: (params: Record<string, string | number | boolean | undefined> = {}) =>
            [...queryKeys.notifications.all, "list", params] as const,
    },
    banners: {
        all: ["banners"] as const,
        active: () => [...queryKeys.banners.all, "active"] as const,
    },
} as const;

export default queryKeys;
