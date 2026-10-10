import { useQuery } from "@tanstack/react-query";
import { categoryService } from "@/services/v1/categoryService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { CategoryNode } from "@/types/category.ts";

/**
 * Loads the active category tree from the backend (cached for 10 minutes).
 */
export function useCategories() {
    const { data, isLoading, isError, refetch } = useQuery<CategoryNode[]>({
        queryKey: queryKeys.categories.tree(),
        queryFn: ({ signal }) => categoryService.getCategoryTree(signal),
        staleTime: 1000 * 60 * 10,
    });

    return {
        categories: data ?? [],
        isLoading,
        isError,
        refetch,
    };
}

export default useCategories;

