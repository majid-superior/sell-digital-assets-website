import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { DigitalAsset } from "@/types/asset.ts";
import { MOCK_SELLERS } from "@/data/mockAssets.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Card, Badge, Button } from "@majid-superior/sell-digital-assets-theme/components";

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
    <Card className="group flex flex-col overflow-hidden hover:border-outline-variant/70 hover:shadow-lg transition-all duration-300">
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
        <Badge
          variant="outline"
          size="sm"
          className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider bg-surface/90 text-on-surface backdrop-blur-md shadow-xs border-transparent"
        >
          {categoryLabels[asset.category] || asset.category}
        </Badge>
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
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                toast.success("Added to Cart!", {
                  description: `${asset.title} (${formatCurrency(asset.priceCents, asset.currency)})`,
                });
              }}
              className="min-h-[44px] min-w-[44px] p-0 rounded-xl flex items-center justify-center"
              aria-label={`Add ${asset.title} to cart`}
            >
              <Icons.Cart size={16} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
