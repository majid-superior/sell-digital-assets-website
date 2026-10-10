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
        list: (filters: Record<string, string | number | boolean> = {}) =>
            [...queryKeys.assets.lists(), filters] as const,
        details: () => [...queryKeys.assets.all, "detail"] as const,
        detail: (idOrSlug: string) =>
            [...queryKeys.assets.details(), idOrSlug] as const,
        featured: () => [...queryKeys.assets.all, "featured"] as const,
        bySeller: (sellerId: string) =>
            [...queryKeys.assets.all, "seller", sellerId] as const,
    },
    categories: {
        all: ["categories"] as const,
        tree: () => [...queryKeys.categories.all, "tree"] as const,
    },
} as const;

export default queryKeys;
