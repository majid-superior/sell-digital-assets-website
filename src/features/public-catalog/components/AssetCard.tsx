// src/features/public-catalog/components/AssetCard.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icons } from "../../../lib/icons/index.ts";
import { resolveMediaUrl } from "../../../utils/media.ts";
import type { DigitalAsset } from "../../../types/asset.ts";

export interface PublicAssetCardProps {
  id?: string;
  slug?: string;
  title: string;
  creator: string;
  imageUrl?: string;
  price: number;
  rating: number;
  reviewCount: number;
  asset?: DigitalAsset;
}

export const AssetCard: React.FC<PublicAssetCardProps> = ({
  id,
  slug,
  title,
  creator,
  imageUrl,
  price,
  rating,
  reviewCount,
  asset,
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const resolvedImage = resolveMediaUrl(
    imageUrl ||
      asset?.coverImageUrl ||
      asset?.preview_url ||
      asset?.thumbnail_url ||
      asset?.thumbnailUrl ||
      asset?.media?.[0]?.url
  );

  const targetHref = slug
    ? `/asset/${slug}`
    : asset?.slug
    ? `/asset/${asset.slug}`
    : id || asset?.id
    ? `/asset/${id || asset?.id}`
    : "/explore";

  const safePrice = Number.isFinite(price) ? price : 0;
  const safeRating = Number.isFinite(rating) ? rating : 5.0;
  const safeReviewCount = Number.isFinite(reviewCount) ? reviewCount : 0;

  return (
    <article className="group flex flex-col rounded-2xl bg-surface-container-lowest border border-outline-variant/40 overflow-hidden hover:border-outline-variant/80 transition-colors duration-150 shadow-xs">
      <Link
        to={targetHref}
        className="relative aspect-16/10 bg-surface-container-high block overflow-hidden"
      >
        {resolvedImage && !hasImageError ? (
          <img
            src={resolvedImage}
            alt={title}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
            <Icons.Package size={28} className="text-primary" />
          </div>
        )}
      </Link>

      <div className="p-3.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
        <div className="space-y-1.5 min-w-0">
          <p className="text-body-sm text-on-surface-variant truncate">{creator}</p>
          <h3 className="text-label-lg text-on-surface line-clamp-1 group-hover:text-primary transition-colors duration-150">
            <Link to={targetHref}>{title}</Link>
          </h3>
        </div>

        <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-body-sm text-on-surface">
            <Icons.Rating size={14} className="fill-amber-400 text-amber-400 shrink-0" />
            <span className="font-semibold">{safeRating.toFixed(1)}</span>
            <span className="text-on-surface-variant">({safeReviewCount})</span>
          </div>
          <span className="text-price-card text-on-surface">
            ${safePrice.toFixed(2)}
          </span>
        </div>
      </div>
    </article>
  );
};

export default AssetCard;

