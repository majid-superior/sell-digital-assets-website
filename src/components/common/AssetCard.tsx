import React, { useState } from "react";
import { Link } from "react-router-dom";
import type { DigitalAsset } from "@/types/asset.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { resolveMediaUrl } from "@/utils/media.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Card, Badge } from "@/components/ui/index.ts";

interface AssetCardProps {
  asset: DigitalAsset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const seller = asset.seller || asset.sellerProfile;
  const sellerName = seller?.storeName || (asset.seller && "name" in asset.seller ? asset.seller.name : "Verified Creator");

  // Determine thumbnail from media array or legacy thumbnailUrl property
  const thumbnailMedia =
    asset.media?.find((m) => m.media_type === "thumbnail") ||
    asset.media?.find((m) => Boolean(m.url)) ||
    asset.media?.[0];
  const rawThumbnailUrl = asset.preview_url || thumbnailMedia?.url || asset.thumbnailUrl;
  const thumbnailUrl = resolveMediaUrl(rawThumbnailUrl);
  const [hasImageError, setHasImageError] = useState(false);

  // Resolve category name safely
  const categoryName = asset.category?.name || "Asset";

  // Calculate starting price
  const startingPrice = asset.min_price ?? (asset.tiers && asset.tiers.length > 0 ? asset.tiers[0].price : 0);
  const displayPrice = formatCurrency(startingPrice, asset.currency);

  const ratingVal = asset.ratingAverage ?? 5.0;
  const reviewsCount = asset.reviewsCount ?? 0;
  const descriptionText = asset.short_description || asset.description || "";

  return (
    <Card className="group flex flex-col overflow-hidden hover:border-outline-variant/70 hover:shadow-lg transition-all duration-300">
      {/* Thumbnail or Fallback Media Canvas */}
      <Link
        to={`/asset/${asset.slug}`}
        className="relative aspect-16/10 overflow-hidden bg-surface-container-high block group-hover:opacity-95"
      >
        {thumbnailUrl && !hasImageError ? (
          <img
            src={thumbnailUrl}
            alt={asset.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-surface-container-high to-surface-container text-on-surface-variant p-4">
            <div className="w-12 h-12 rounded-2xl bg-surface/60 backdrop-blur-xs flex items-center justify-center mb-2 shadow-xs border border-outline-variant/30">
              <Icons.Package size={24} className="text-primary" />
            </div>
            <span className="text-[11px] font-mono tracking-wider text-on-surface-variant uppercase">
              {categoryName}
            </span>
          </div>
        )}

        {/* Category Pill */}
        <Badge
          variant="outline"
          size="sm"
          className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider bg-surface/90 text-on-surface backdrop-blur-md shadow-xs border-transparent"
        >
          {categoryName}
        </Badge>
      </Link>

      {/* Content */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="space-y-2">
          {/* Seller Line */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            {seller && "avatarUrl" in seller && seller.avatarUrl ? (
              <img
                src={seller.avatarUrl}
                alt={sellerName}
                loading="lazy"
                decoding="async"
                width={20}
                height={20}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                {sellerName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium truncate">{sellerName}</span>
            {seller && "verified" in seller && seller.verified && (
              <Icons.Verified size={14} className="text-secondary shrink-0" />
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            <Link to={`/asset/${asset.slug}`}>{asset.title}</Link>
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {descriptionText}
          </p>

          {/* Tags */}
          {asset.tags && asset.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {asset.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono text-on-surface-variant/80 bg-surface-container px-1.5 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Rating & Price */}
        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <Icons.Rating size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-on-surface">
              {ratingVal.toFixed(1)}
            </span>
            <span className="text-on-surface-variant text-[11px]">
              ({reviewsCount})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] block text-on-surface-variant leading-none">Starting at</span>
              <span className="text-lg font-extrabold text-on-surface">
                {displayPrice}
              </span>
            </div>
            <Link
              to={`/asset/${asset.slug}`}
              className="min-h-11 min-w-11 p-0 rounded-xl flex items-center justify-center cursor-pointer bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-xs"
              title="View asset details"
              aria-label={`View ${asset.title}`}
            >
              <Icons.Eye size={18} />
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AssetCard;
