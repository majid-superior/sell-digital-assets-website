import { useQuery } from "@tanstack/react-query";
import { assetService, type CategoryTaxonomyNode } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";

/**
 * Loads the asset category taxonomy for marketplace filtering and seller product creation.
 * Uses queryKeys.categories.taxonomy() to prevent collisions with the hierarchical CategoryNode tree.
 */
export function useCategoryTaxonomy() {
    const { data, isLoading, isError, refetch } = useQuery<CategoryTaxonomyNode[]>({
        queryKey: queryKeys.categories.taxonomy(),
        queryFn: () => assetService.getCategoryTaxonomy(),
        staleTime: 1000 * 60 * 10,
    });

    return {
        categories: data ?? [],
        isLoading,
        isError,
        refetch,
    };
}

export default useCategoryTaxonomy;
