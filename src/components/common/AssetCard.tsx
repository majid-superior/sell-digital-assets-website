import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { DigitalAsset } from "@/types/asset.ts";
import { MOCK_SELLERS } from "@/data/mockAssets.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { Icons } from "@/lib/icons/index.ts";

interface AssetCardProps {
  asset: DigitalAsset;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const seller = MOCK_SELLERS[asset.sellerId];

  const categoryLabels: Record<string, string> = {
    ui_kit: "UI Kit",
    font: "Font",
    "3d_model": "3D Asset",
    icon_set: "Icon Set",
    template: "Template",
  };

  return (
    <article className="group flex flex-col rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden hover:border-outline-variant/70 hover:shadow-lg transition-all duration-300">
      {/* Thumbnail */}
      <Link
        to={`/asset/${asset.slug}`}
        className="relative aspect-16/10 overflow-hidden bg-surface-container-high block"
      >
        <img
          src={asset.thumbnailUrl}
          alt={asset.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-surface/90 text-on-surface backdrop-blur-md shadow-xs">
          {categoryLabels[asset.category] || asset.category}
        </span>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Seller Line */}
          {seller && (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <img
                src={seller.avatarUrl}
                alt={seller.storeName}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-medium truncate">{seller.storeName}</span>
              {seller.verified && (
                <Icons.Verified size={14} className="text-secondary shrink-0" />
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-base text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
            <Link to={`/asset/${asset.slug}`}>{asset.title}</Link>
          </h3>

          {/* Description Snippet */}
          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
            {asset.description}
          </p>
        </div>

        {/* Footer: Rating & Price */}
        <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <Icons.Rating size={14} className="fill-amber-400 text-amber-400" />
            <span className="font-bold text-on-surface">
              {asset.ratingAverage.toFixed(1)}
            </span>
            <span className="text-on-surface-variant text-[11px]">
              ({asset.reviewsCount})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-on-surface">
              {formatCurrency(asset.priceCents, asset.currency)}
            </span>
            <button
              type="button"
              onClick={() => {
                toast.success("Added to Cart!", {
                  description: `${asset.title} (${formatCurrency(asset.priceCents, asset.currency)})`,
                });
              }}
              // bg-primary + text-on-primary is the correct Material Design token pairing.
              // bg-primary-container + text-on-primary was incorrect and could fail contrast.
              // min-h/min-w ensures ≥44px touch target for accessibility compliance.
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center"
              aria-label={`Add ${asset.title} to cart`}
            >
              <Icons.Cart size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
