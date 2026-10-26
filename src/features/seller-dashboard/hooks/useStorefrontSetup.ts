// src/features/seller-dashboard/hooks/useStorefrontSetup.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ENV } from "../../../config/env.ts";
import { assetService } from "../../../services/v1/assetService.ts";
import { getHumanErrorMessage } from "../../../utils/errors.ts";
import type { DigitalAsset } from "../../../types/asset.ts";
import type { SellerStorefrontConfig, UpdateStorefrontPayload } from "../types.ts";

export const STOREFRONT_QUERY_KEY = ["seller", "storefront-config"] as const;

export const DEFAULT_STOREFRONT_CONFIG: SellerStorefrontConfig = Object.freeze({
  url: "",
  title: "",
  description: "",
  bannerUrl: "",
  featuredAssetId: "",
  isVisible: false,
});

const EMPTY_PUBLISHED_ASSETS: DigitalAsset[] = [];

export const useStorefrontSetup = () => {
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: STOREFRONT_QUERY_KEY,
    queryFn: assetService.getSellerStorefrontConfig,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const assetsQuery = useQuery({
    queryKey: ["seller", "assets", "published"],
    queryFn: assetService.getSellerPublishedAssets,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateStorefrontPayload) =>
      assetService.updateSellerStorefrontConfig(payload),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(STOREFRONT_QUERY_KEY, updatedConfig);
      if (updatedConfig.url) {
        void queryClient.invalidateQueries({
          queryKey: ["public-storefront", updatedConfig.url],
        });
      }
      toast.success("Storefront settings saved!", {
        description: updatedConfig.isVisible && updatedConfig.url
          ? `Your public storefront is now live at ${ENV.APP_BASE_URL}/${updatedConfig.url}.`
          : "Your custom storefront URL and settings have been updated.",
      });
    },
    onError: (err: unknown) => {
      toast.error("Failed to Save Storefront", {
        description: getHumanErrorMessage(
          err,
          "Unable to save your storefront configuration right now. Please try again."
        ),
      });
    },
  });

  return {
    config: configQuery.data ?? DEFAULT_STOREFRONT_CONFIG,
    publishedAssets: assetsQuery.data ?? EMPTY_PUBLISHED_ASSETS,
    isLoading: configQuery.isLoading && !configQuery.isFetched,
    isError: configQuery.isError,
    isSaving: saveMutation.isPending,
    saveSuccess: saveMutation.isSuccess,
    saveError: saveMutation.error,
    saveStorefront: saveMutation.mutateAsync,
  };
};

