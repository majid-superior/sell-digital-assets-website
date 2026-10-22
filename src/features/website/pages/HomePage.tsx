// src/features/website/pages/HomePage.tsx
import React from "react";
import { PromoBar } from "../components/landing/PromoBar.tsx";
import { HeroSearch } from "../components/landing/HeroSearch.tsx";
import { CuratedTabs } from "../components/landing/CuratedTabs.tsx";
import { ValueShowcase } from "../components/landing/ValueShowcase.tsx";
import { PlanCallout } from "../components/landing/PlanCallout.tsx";
import { KeywordGrid } from "../components/landing/KeywordGrid.tsx";
import { CategoryGrid } from "../components/landing/CategoryGrid.tsx";
import { FaqSection } from "../components/landing/FaqSection.tsx";
import { SeoDirectory } from "../components/landing/SeoDirectory.tsx";
import { BottomBanner } from "../components/landing/BottomBanner.tsx";

export const HomePage: React.FC = () => {
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

export const LandingPage = HomePage;
export default HomePage;
