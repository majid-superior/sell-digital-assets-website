// src/website/BottomBanner.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/index.ts";

export const BottomBanner: React.FC = () => {
  return (
    <section className="my-10 sm:my-16 lg:my-20">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-primary-container/25 via-surface-container-high to-tertiary-container/25 border border-outline-variant/40 shadow-xl p-8 sm:p-14 lg:p-16 text-center">
        {/* Ambient Decorative Lighting */}
        <div
          aria-hidden="true"
          className="absolute -top-20 left-1/4 w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 right-1/4 w-72 h-72 rounded-full bg-tertiary/20 blur-3xl pointer-events-none"
        />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Icons.Magic size={14} />
            <span>Royalty-Free Commercial License</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface text-balance">
            Ready to elevate your projects with world-class stock assets?
          </h2>

          <p className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-2xl mx-auto text-balance leading-relaxed">
            Join over 2 million creative directors, developers, and global brands creating with our curated stock assets, vectors, and AI models.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/signup">
              <Button
                variant="primary"
                size="lg"
                className="rounded-full px-8 font-bold shadow-md text-sm sm:text-base"
              >
                Get 10 Free Assets Now
              </Button>
            </Link>

            <Link to="/explore">
              <Button
                variant="outline"
                size="lg"
                rightIcon={<Icons.Next size={16} />}
                className="rounded-full px-8 text-sm sm:text-base"
              >
                Explore Complete Catalog
              </Button>
            </Link>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <Icons.Check size={14} className="text-primary shrink-0" />
              <span>No credit card required for trial</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Icons.Check size={14} className="text-primary shrink-0" />
              <span>Cancel or rollover anytime</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Icons.Check size={14} className="text-primary shrink-0" />
              <span>100% royalty-free perpetual commercial license</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BottomBanner;

