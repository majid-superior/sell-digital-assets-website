import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  organizationService,
  type OrganizationInfo,
  defaultOrganization,
  STORAGE_KEY_ORGANIZATION_DATA,
} from "@/services/v1/organizationService.ts";

export const ORGANIZATION_QUERY_KEY = ["organization", "singleton"] as const;

export function useOrganization() {
  const queryClient = useQueryClient();

  const { data: organization = defaultOrganization, isLoading, refetch } = useQuery<OrganizationInfo>({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: () => organizationService.getOrganization(),
    placeholderData: () => organizationService.getCachedOrganization() || defaultOrganization,
    staleTime: 1000 * 30, // 30 seconds fresh cache
    refetchOnWindowFocus: true, // Always re-sync when user switches back from Admin tab
  });

  // Cross-tab and window focus event listener for immediate branding synchronization
  useEffect(() => {
    const handleSync = () => {
      void queryClient.invalidateQueries({ queryKey: ORGANIZATION_QUERY_KEY });
    };

    window.addEventListener("focus", handleSync);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ORGANIZATION_DATA) {
        handleSync();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [queryClient]);

  return {
    organization,
    isLoading,
    refetch,
  };
}

export default useOrganization;

