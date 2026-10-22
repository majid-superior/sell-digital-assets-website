// src/hooks/useBanners.ts
import { useQuery } from "@tanstack/react-query";
import { bannerService } from "@/services/v1/bannerService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { PublicBanner } from "@/types/banner.ts";

/**
 * Loads active, schedule-eligible promotional banners from the backend API.
 */
export function useBanners(enabled: boolean = true) {
  const { data, isLoading, isError, refetch } = useQuery<PublicBanner[]>({
    queryKey: queryKeys.banners.active(),
    queryFn: ({ signal }) => bannerService.getActiveBanners(signal),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
    enabled,
  });

  return {
    banners: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}

export default useBanners;

