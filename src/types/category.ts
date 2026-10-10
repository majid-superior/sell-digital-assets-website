// src/types/category.ts

/**
 * Category node as returned by `GET /api/categories?tree=true`.
 * Mirrors the backend `CategoryTreeNode` (snake_case fields from PostgreSQL).
 */
export interface CategoryNode {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    depth: number;
    path?: string;
    description?: string | null;
    display_order: number;
    is_active: boolean;
    metadata?: Record<string, unknown> | null;
    parent_name?: string | null;
    parent_slug?: string | null;
    children: CategoryNode[];
}

