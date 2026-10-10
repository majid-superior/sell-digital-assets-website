import { useQuery } from "@tanstack/react-query";
import { organizationService, type OrganizationInfo, defaultOrganization } from "@/services/v1/organizationService.ts";

export function useOrganization() {
  const { data: organization = organizationService.getCachedOrganization() || defaultOrganization, isLoading } = useQuery<OrganizationInfo>({
    queryKey: ["organization", "singleton"],
    queryFn: () => organizationService.getOrganization(),
    initialData: () => organizationService.getCachedOrganization() || defaultOrganization,
    staleTime: 1000 * 60 * 5,
  });

  return {
    organization,
    isLoading,
  };
}

export default useOrganization;

