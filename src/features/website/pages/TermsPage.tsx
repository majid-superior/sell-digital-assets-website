// src/features/website/pages/TermsPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Card, Badge } from "@/components/ui/index.ts";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="sm">
            <Icons.FileText size={13} className="mr-1" /> Legal Contract
          </Badge>
          <Badge variant="outline" size="sm">
            Digital Asset Licensing
          </Badge>
          <span className="text-xs text-on-surface-variant font-mono">
            Updated November 2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface">
          Terms of Service &amp; Licensing Conditions
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-3xl">
          These Terms of Service govern your access to our marketplace, purchases of digital assets,
          signed deliverable downloads, and creator storefront operations. Please review them carefully.
        </p>
      </div>

      {/* Quick Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-surface-container/30 border border-outline-variant/30 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icons.Check size={16} />
          </div>
          <h3 className="font-bold text-sm text-on-surface">Verified Ownership</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Creators warrant 100% intellectual property ownership or authorized sub-licensing of all assets.
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface-container/30 border border-outline-variant/30 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
            <Icons.Security size={16} />
          </div>
          <h3 className="font-bold text-sm text-on-surface">Secure signed downloads</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Download tokens expire after 15 minutes to safeguard deliverables against unauthorized sharing.
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-surface-container/30 border border-outline-variant/30 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
            <Icons.Wallet size={16} />
          </div>
          <h3 className="font-bold text-sm text-on-surface">Transparent Licensing</h3>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Standard, Commercial, and Extended Enterprise tiers grant clear, perpetual end-use permissions.
          </p>
        </Card>
      </div>

      {/* Terms Sections */}
      <div className="space-y-8 text-on-surface">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            1. Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            By creating an account, browsing public creator storefronts, purchasing digital licenses,
            or uploading digital deliverables to the platform, you agree to be legally bound by these
            Terms of Service and our Privacy Policy. If you do not agree with any provision, you must
            discontinue using the marketplace immediately.
          </p>
        </section>

        {/* Section 2: Account & Roles */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            2. User Accounts &amp; Team Roles
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            You must be at least 18 years old or the legal age of majority in your jurisdiction to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all actions taken under your account.
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Sellers may invite team members with specific roles (e.g. <em>Store Manager</em>, <em>Content Uploader</em>, or <em>Analyst</em>). Store owners remain strictly accountable for all activities conducted by authorized sub-accounts.
          </p>
        </section>

        {/* Section 3: Licensing Models */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            3. Digital Asset Licensing Tiers
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            All items sold on the platform are licensed, not sold. Ownership of the underlying copyright remains with the original creator. When a Buyer completes an order, they receive a non-exclusive license key based on the purchased tier:
          </p>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
              <span className="font-bold text-sm text-primary block mb-1">Standard License</span>
              <p className="text-on-surface-variant leading-relaxed">
                Permits usage in one personal or non-commercial project. Redistribution, sublicensing, or inclusion in digital products for resale is strictly prohibited.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
              <span className="font-bold text-sm text-secondary block mb-1">Commercial License</span>
              <p className="text-on-surface-variant leading-relaxed">
                Permits usage in unlimited commercial projects for one business entity, including client deliverables and marketing materials. Does not allow resale as a standalone competing asset.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface">
              <span className="font-bold text-sm text-warning block mb-1">Extended Enterprise License</span>
              <p className="text-on-surface-variant leading-relaxed">
                Grants multi-seat developer access, permission to embed the asset within software applications (SaaS), mobile apps, or games distributed to end users, without attribution requirements.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Digital Deliverables & Refunds */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            4. Digital Delivery &amp; Refund Policy
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Upon verified payment or test license authorization, digital files become immediately available for download via secure signed links.
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            <strong>Refund Restrictions</strong>: Because digital deliverables (code packages, design files, 3D meshes) cannot be returned once delivered, sales are generally non-refundable once download links are accessed. Refunds or store credit are granted exclusively if:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-on-surface-variant">
            <li>The digital archive is corrupt, incomplete, or technically inaccessible and the seller fails to provide a fix within 72 hours.</li>
            <li>The deliverable materially contradicts the specifications shown on the asset detail page.</li>
            <li>A duplicate charge occurred due to payment gateway error.</li>
          </ul>
        </section>

        {/* Section 5: Creator Warranties & Payouts */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            5. Creator Obligations &amp; Revenue Payouts
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Creators guarantee that all uploaded deliverables: (i) are 100% their original creation or properly licensed; (ii) do not contain malware, trojans, backdoors, or malicious scripts; and (iii) do not infringe any third-party trademarks, copyrights, or privacy rights.
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Platform fee splits and payout schedules are executed according to the creator tier agreed upon in the seller onboarding agreement. Payouts are subject to standard fraud holds (up to 14 days) to protect buyers against unauthorized chargebacks.
          </p>
        </section>

        {/* Section 6: Prohibited Uses & Scraping */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            6. Prohibited Conduct &amp; Automated Scraping
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            You agree not to: (a) engage in automated data harvesting, web scraping, or brute-force crawling of seller storefronts; (b) share single-user download links across public distribution sites; (c) attempt to reverse engineer license key verification algorithms; or (d) manipulate category demand metrics through artificial dwell time generation or spoofed requests.
          </p>
        </section>

        {/* Section 7: DMCA Copyright Notice */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            7. DMCA &amp; Intellectual Property Claims
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            We promptly investigate notices of alleged copyright infringement under the Digital Millennium Copyright Act. If you believe your copyrighted work has been uploaded without authorization, submit a notice containing: (1) identification of the copyrighted work; (2) the exact marketplace URL of the infringing asset; and (3) your contact details to{" "}
            <a href="mailto:dmca@selldigitalassets.com" className="text-primary hover:underline font-semibold">
              dmca@selldigitalassets.com
            </a>.
          </p>
        </section>

        {/* Section 8: Termination & Liability */}
        <section className="space-y-3 pt-4 border-t border-outline-variant/20">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            8. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            To the maximum extent permitted by applicable law, the Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind. Under no circumstances will the platform operators be liable for indirect, incidental, or consequential damages resulting from digital asset use or inability to download.
          </p>
        </section>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
        >
          <Icons.Back size={14} />
          <span>Return to Marketplace</span>
        </Link>
        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
        >
          <span>Read Privacy Policy</span>
          <Icons.ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default TermsPage;

