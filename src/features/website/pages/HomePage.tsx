// src/features/website/pages/HomePage.tsx
import React from "react";
import { PromoBar } from "../components/landing/PromoBar.tsx";
import { HeroSection } from "../components/landing/HeroSection.tsx";
import { CategoryRow } from "../components/landing/CategoryRow.tsx";
import { CuratedTabs } from "../components/landing/CuratedTabs.tsx";
import { PlanCallout } from "../components/landing/PlanCallout.tsx";
import { KeywordGrid } from "../components/landing/KeywordGrid.tsx";
import { CategoryGrid } from "../components/landing/CategoryGrid.tsx";
import { FaqSection } from "../components/landing/FaqSection.tsx";
import { BottomBanner } from "../components/landing/BottomBanner.tsx";

export const HomePage: React.FC = () => {
  return (
    <div className="w-full flex flex-col bg-background text-on-surface transition-colors duration-200">
      {/* 1. Dynamic database-driven promotional announcement bar */}
      <PromoBar />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 sm:space-y-10 lg:space-y-12 pb-16 sm:pb-24">
        {/* 2. HeroSection with 15-image animated slider showcase */}
        <HeroSection />

        {/* 3. Category Spotlight: Dynamic random category best sellers */}
        <CategoryRow />

        {/* 4. Curated collections carousel */}
        <CuratedTabs />

        {/* 5. Mid-page conversion callout */}
        <PlanCallout />

        {/* 6. Thematic keyword grid */}
        <KeywordGrid />

        {/* 7. Popular categories thumbnail grid (12 categories) */}
        <CategoryGrid />

        {/* 8. FAQ accordion */}
        <FaqSection />

        {/* 9. Bottom gradient banner */}
        <BottomBanner />
      </div>
    </div>
  );
};

export const LandingPage = HomePage;
export default HomePage;

