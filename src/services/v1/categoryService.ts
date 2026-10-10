// src/services/v1/categoryService.ts
import { apiClient } from "@/services/api.ts";
import type { CategoryNode } from "@/types/category.ts";

interface CategoryTreeResponse {
    success?: boolean;
    data?: CategoryNode[];
}

/**
 * Keeps only active nodes and orders siblings by `display_order`, then name.
 * The backend already excludes inactive rows by default; this is a defensive guard.
 */
function normalizeTree(nodes: CategoryNode[] | undefined): CategoryNode[] {
    if (!Array.isArray(nodes)) return [];
    return nodes
        .filter((node) => node.is_active !== false)
        .map((node) => ({ ...node, children: normalizeTree(node.children) }))
        .sort(
            (a, b) =>
                (a.display_order ?? 0) - (b.display_order ?? 0) ||
                a.name.localeCompare(b.name)
        );
}

class CategoryService {
    /**
     * Fetch the hierarchical tree of active categories.
     */
    async getCategoryTree(signal?: AbortSignal): Promise<CategoryNode[]> {
        const response = await apiClient.get<CategoryTreeResponse | CategoryNode[]>(
            "/api/categories",
            { params: { tree: true }, signal }
        );
        const nodes = Array.isArray(response) ? response : response?.data;
        return normalizeTree(nodes);
    }
}

/**
 * Depth-first lookup of a category by slug, returning the node and its ancestor chain.
 */
export function findCategoryBySlug(
    nodes: CategoryNode[],
    slug: string,
    ancestors: CategoryNode[] = []
): { node: CategoryNode; ancestors: CategoryNode[] } | null {
    for (const node of nodes) {
        if (node.slug === slug) return { node, ancestors };
        const match = findCategoryBySlug(node.children, slug, [...ancestors, node]);
        if (match) return match;
    }
    return null;
}

export const categoryService = new CategoryService();
export default categoryService;

