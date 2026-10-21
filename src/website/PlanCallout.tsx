// src/website/PlanCallout.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge } from "@/components/ui/index.ts";

export const PlanCallout: React.FC = () => {
  return (
    <section className="my-10 sm:my-16 lg:my-20">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-low border border-outline-variant/40 shadow-xl p-8 sm:p-12 lg:p-14">
        {/* Ambient Glows */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/15 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-tertiary/15 blur-3xl pointer-events-none"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column: Plan Benefits & Conversion CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-2">
              <Badge variant="primary" size="sm" className="gap-1.5">
                <Icons.Magic size={13} />
                <span>Plans for Teams &amp; Solo Creators</span>
              </Badge>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface text-balance">
                High-volume creative assets without subscription lock-in
              </h2>

              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed text-balance">
                Choose between flexible monthly credits, annual creative bundles, or pay-as-you-go licenses. Unused credits automatically roll over every billing cycle.
              </p>
            </div>

            {/* Quick perk badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Icons.Check size={14} />
                </div>
                <span>Rollover unused monthly credits</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Icons.Check size={14} />
                </div>
                <span>Unlimited team member pooling</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Icons.Check size={14} />
                </div>
                <span>$250K legal indemnification</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-on-surface">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Icons.Check size={14} />
                </div>
                <span>High-speed CDN ZIP delivery</span>
              </div>
            </div>

            {/* Conversion CTA Group */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link to="/signup">
                <Button variant="primary" size="lg" className="rounded-full px-8 font-bold shadow-md">
                  Explore Plans &amp; Pricing
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="rounded-full">
                  Learn About Enterprise
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D-Style Illustration & Isometric Token Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-square flex items-center justify-center">
              {/* Isometric Card 1 (Backdrop) */}
              <div className="absolute top-4 right-4 w-4/5 h-4/5 rounded-3xl bg-linear-to-tr from-primary/30 to-tertiary/20 backdrop-blur-xl border border-outline-variant/30 rotate-6 shadow-2xl transition-transform hover:rotate-3 duration-500" />

              {/* Isometric Card 2 (Middle) */}
              <div className="absolute top-10 left-6 w-4/5 h-4/5 rounded-3xl bg-surface/90 backdrop-blur-2xl border border-outline-variant/40 -rotate-3 shadow-xl p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-xs">
                      AD
                    </div>
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Enterprise Team</span>
                      <span className="text-[10px] text-on-surface-variant">Active Workspace</span>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Pro 2026</Badge>
                </div>

                <div className="space-y-3 py-4">
                  <div className="p-3 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-between">
                    <span className="text-xs font-medium text-on-surface-variant">Available Credits</span>
                    <span className="text-base font-extrabold text-primary">750 / 1,000</span>
                  </div>

                  <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-primary to-tertiary w-3/4 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                  <span className="text-on-surface-variant">4K Video &amp; 3D Ready</span>
                  <span className="text-primary font-bold">100% Cleared</span>
                </div>
              </div>

              {/* Floating 3D Token Orb */}
              <div className="absolute -bottom-2 right-2 p-4 rounded-2xl bg-primary text-on-primary shadow-2xl flex items-center gap-3 animate-bounce duration-1000">
                <Icons.Magic size={22} className="animate-spin duration-3000" />
                <div>
                  <span className="text-xs font-black block">10 Free Assets</span>
                  <span className="text-[10px] opacity-90">Instant Activation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanCallout;

