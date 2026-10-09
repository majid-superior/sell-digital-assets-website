import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/features/website/components/HeroSection.tsx";
import { CollectionsGrid } from "@/features/website/components/CollectionsGrid.tsx";
import { VideoSpotlight } from "@/features/website/components/VideoSpotlight.tsx";
import { FeatureHighlights } from "@/features/website/components/FeatureHighlights.tsx";
import { CreatorCta } from "@/features/website/components/CreatorCta.tsx";
import { MediaTile } from "@/features/website/components/MediaTile.tsx";
import { GRADIENT_TEXT_THEME, LANDING_CONTAINER, SectionHeading } from "@/features/website/components/CinematicPanel.tsx";
import { SHOWCASE_GALLERY } from "@/features/website/components/landingMedia.ts";
import { AssetCard } from "@/components/common/AssetCard.tsx";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Spinner } from "@/components/ui/index.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export const HomePage: React.FC = () => {
  const { data: featuredAssets, isLoading } = useQuery<DigitalAsset[]>({
    queryKey: queryKeys.assets.featured(),
    queryFn: () => assetService.getFeaturedAssets(),
    staleTime: 1000 * 60 * 5,
  });

  const displayAssets: DigitalAsset[] = featuredAssets || [];

  return (
    <div className="w-full">
      <HeroSection />

      <div className={`${LANDING_CONTAINER} space-y-24 py-20 sm:space-y-32 sm:py-28`}>
        <CollectionsGrid />

        {/* Trending: live catalog when available, otherwise the showcase gallery */}
        <section aria-labelledby="featured-assets-heading" className="space-y-8">
          <SectionHeading
            id="featured-assets-heading"
            eyebrow="Trending this week"
            eyebrowIcon={<Icons.Magic size={14} className="text-primary" />}
            title={
              <>
                What creators are <span className={GRADIENT_TEXT_THEME}>downloading now</span>
              </>
            }
            description="The most-licensed photos and clips of the week, picked by our editors."
            action={
              <Link
                to="/explore"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                View all assets
                <Icons.Next size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" aria-label="Loading featured assets" />
            </div>
          ) : displayAssets.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
              {displayAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="columns-2 gap-3 sm:gap-4 lg:columns-3 [&>*]:mb-3 sm:[&>*]:mb-4">
              {SHOWCASE_GALLERY.map((item) => (
                <div key={item.id} className="break-inside-avoid">
                  <MediaTile item={item} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <VideoSpotlight />

      <div className={`${LANDING_CONTAINER} py-20 sm:py-28`}>
        <FeatureHighlights />
      </div>

      <CreatorCta />
    </div>
  );
};

export default HomePage;
