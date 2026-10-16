import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/features/website/components/HeroSection.tsx";
import { FeatureHighlights } from "@/features/website/components/FeatureHighlights.tsx";
import { AssetCard } from "@/components/common/AssetCard.tsx";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { Icons } from "@/lib/icons/index.ts";
import { EmptyState, Button, Card, Skeleton } from "@/components/ui/index.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export const HomePage: React.FC = () => {
  const { data: featuredAssets, isLoading } = useQuery<DigitalAsset[]>({
    queryKey: queryKeys.assets.featured(),
    queryFn: () => assetService.getFeaturedAssets(),
    staleTime: 1000 * 60 * 5,
  });

  const displayAssets: DigitalAsset[] = featuredAssets || [];

  return (
    <div className="space-y-16 sm:space-y-24 py-4 sm:py-8">
      {/* Hero Header Section */}
      <HeroSection />

      {/* Featured Curated Assets Catalog */}
      <section aria-labelledby="featured-assets-heading" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/20 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
              <Icons.Magic size={14} />
              <span>Curated Selection</span>
            </div>
            <h2
              id="featured-assets-heading"
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface"
            >
              Trending Digital Assets
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Top-rated design systems, variable fonts, and modular 3D assets crafted by world-class creators.
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:underline group shrink-0"
          >
            <span>View All Assets</span>
            <Icons.Next size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Assets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col overflow-hidden">
                <Skeleton className="aspect-16/10 w-full rounded-none" />
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton variant="circular" className="w-5 h-5" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-4/5" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-full" />
                      <Skeleton className="h-3.5 w-2/3" />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <Skeleton className="h-4 w-12 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                      <Skeleton className="h-4 w-10 rounded-md" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="w-11 h-11 rounded-xl" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : displayAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Icons.Categories size={36} />}
            title="No featured assets yet"
            description="Explore our complete marketplace catalog to discover available digital assets."
            action={
              <Link to="/explore">
                <Button variant="primary" size="md">
                  Explore Catalog
                </Button>
              </Link>
            }
          />
        )}
      </section>

      {/* Trust & Feature Highlights */}
      <FeatureHighlights />
    </div>
  );
};

export default HomePage;
