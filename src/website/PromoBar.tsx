// src/website/PromoBar.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

export interface PromoBarProps {
  onDismiss?: () => void;
  className?: string;
}

export const PromoBar: React.FC<PromoBarProps> = ({ onDismiss, className = "" }) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <aside
      aria-label="Promotional Offer"
      className={`relative w-full overflow-hidden bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 dark:from-purple-950 dark:via-indigo-950 dark:to-purple-900 text-white transition-all shadow-xs ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        {/* Center: Offer details & CTA */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 dark:bg-white/10 text-white text-[11px] font-bold tracking-wide uppercase shadow-2xs backdrop-blur-xs">
            <Icons.Magic size={13} className="text-yellow-300 shrink-0" />
            <span>Special Offer</span>
          </span>

          <span className="font-semibold tracking-tight text-white/95">
            Get 10 free Adobe Stock assets
          </span>

          <span className="hidden md:inline text-white/70">•</span>

          <span className="hidden md:inline text-white/80 text-xs">
            Start your 30-day risk-free creative trial today.
          </span>

          <Link
            to="/signup"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-purple-900 hover:bg-white/90 active:scale-95 font-bold text-xs tracking-tight transition-all shadow-xs"
          >
            <span>Start now</span>
            <Icons.Next size={13} />
          </Link>
        </div>

        {/* Right: Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss offer banner"
          className="shrink-0 p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
        >
          <Icons.Close size={15} />
        </button>
      </div>
    </aside>
  );
};

export default PromoBar;

