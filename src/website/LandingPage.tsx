// src/website/LandingPage.tsx
import React from "react";
import { PromoBar } from "./PromoBar.tsx";
import { HeroSearch } from "./HeroSearch.tsx";
import { CuratedTabs } from "./CuratedTabs.tsx";
import { ValueShowcase } from "./ValueShowcase.tsx";
import { PlanCallout } from "./PlanCallout.tsx";
import { KeywordGrid } from "./KeywordGrid.tsx";
import { CategoryGrid } from "./CategoryGrid.tsx";
import { FaqSection } from "./FaqSection.tsx";
import { SeoDirectory } from "./SeoDirectory.tsx";
import { BottomBanner } from "./BottomBanner.tsx";

export const LandingPage: React.FC = () => {
  return (
    <div className="w-full flex flex-col bg-background text-on-surface transition-colors duration-200">
      {/* 1. Dynamic database-driven promotional announcement bar */}
      <PromoBar />

      {/* Main Container for sections 2-10 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-10 lg:space-y-12 pb-16 sm:pb-24">
        {/* 2. Hero and primary search section */}
        <HeroSearch />

        {/* 3. Curated collections carousel */}
        <CuratedTabs />

        {/* 4. Two-column value showcase with Before/After AI presentation */}
        <ValueShowcase />

        {/* 5. Mid-page conversion callout */}
        <PlanCallout />

        {/* 6. Thematic keyword grid */}
        <KeywordGrid />

        {/* 7. Popular categories thumbnail grid (12 categories) */}
        <CategoryGrid />

        {/* 8. FAQ accordion */}
        <FaqSection />

        {/* 9. Multi-column SEO directory */}
        <SeoDirectory />

        {/* 10. Bottom gradient banner */}
        <BottomBanner />
      </div>
    </div>
  );
};

export default LandingPage;

