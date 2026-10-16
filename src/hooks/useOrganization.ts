import { useQuery } from "@tanstack/react-query";
import { organizationService, type OrganizationInfo, defaultOrganization } from "@/services/v1/organizationService.ts";

export const ORGANIZATION_QUERY_KEY = ["organization", "singleton"] as const;

export function useOrganization() {
  const { data: organization = defaultOrganization, isLoading } = useQuery<OrganizationInfo>({
    queryKey: ORGANIZATION_QUERY_KEY,
    queryFn: () => organizationService.getOrganization(),
    placeholderData: () => organizationService.getCachedOrganization() || defaultOrganization,
    staleTime: 1000 * 60 * 5,
  });

  return {
    organization,
    isLoading,
  };
}

export default useOrganization;

