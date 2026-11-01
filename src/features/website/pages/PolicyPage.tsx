// src/features/website/pages/PolicyPage.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Card, Badge, Button } from "@/components/ui/index.ts";
import {
  getTelemetryConsent,
  setTelemetryConsent,
  type ConsentStatus,
} from "@/services/telemetry/telemetryStorage.ts";

export const PolicyPage: React.FC = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(() =>
    getTelemetryConsent()
  );

  useEffect(() => {
    const handleConsentChange = (e: CustomEvent<ConsentStatus>) => {
      setConsentStatus(e.detail);
    };

    window.addEventListener(
      "telemetry:consent_changed",
      handleConsentChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "telemetry:consent_changed",
        handleConsentChange as EventListener
      );
    };
  }, []);

  const handleToggleConsent = (status: "granted" | "denied") => {
    setTelemetryConsent(status);
    setConsentStatus(status);
    if (status === "granted") {
      toast.success("Preferences Saved", {
        description: "Analytics telemetry enabled. Thank you for helping us improve our catalog.",
      });
    } else {
      toast.info("Preferences Saved", {
        description: "Non-essential behavioral telemetry paused. Only strictly essential session cookies are active.",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary" size="sm">
            <Icons.Security size={13} className="mr-1" /> Legal &amp; Compliance
          </Badge>
          <Badge variant="outline" size="sm">
            GDPR &amp; CCPA Compliant
          </Badge>
          <span className="text-xs text-on-surface-variant font-mono">
            Updated November 2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-on-surface">
          Privacy &amp; Data Protection Policy
        </h1>
        <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-3xl">
          We believe in complete transparency and privacy by design. This policy explains
          how our digital asset marketplace collects, safeguards, and utilizes user
          information, download records, and first-party behavioral telemetry.
        </p>
      </div>

      {/* Interactive Privacy Preferences Box */}
      <Card className="p-6 sm:p-8 rounded-3xl bg-surface-container/40 border border-outline-variant/30 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Icons.Shield size={18} className="text-primary" />
              <h2 className="text-base font-bold text-on-surface">
                Your Live Telemetry &amp; Cookie Preferences
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Manage how your session attention, dwell time, and search preferences are tracked.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={consentStatus === "granted" ? "primary" : "outline"}
              size="sm"
              onClick={() => handleToggleConsent("granted")}
              className="cursor-pointer text-xs font-semibold"
            >
              <Icons.Check size={14} className="mr-1" /> All Telemetry Enabled
            </Button>
            <Button
              type="button"
              variant={consentStatus === "denied" ? "secondary" : "outline"}
              size="sm"
              onClick={() => handleToggleConsent("denied")}
              className="cursor-pointer text-xs font-semibold"
            >
              Essential Only
            </Button>
          </div>
        </div>

        <div className="pt-2 text-xs text-on-surface-variant border-t border-outline-variant/20 flex items-center justify-between">
          <span>
            Current Status:{" "}
            <strong className="text-on-surface uppercase">
              {consentStatus === "granted"
                ? "Full First-Party Analytics Allowed"
                : consentStatus === "denied"
                ? "Essential Cookies Only (Tracking Blocked)"
                : "Pending User Consent"}
            </strong>
          </span>
          <span className="text-[11px] text-on-surface-variant/70">
            Zero third-party tracking cookies are ever used.
          </span>
        </div>
      </Card>

      {/* Detailed Policy Sections */}
      <div className="space-y-8 text-on-surface">
        {/* Section 1: Scope */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            1. Scope &amp; Marketplace Role
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            This Privacy Policy applies to the digital assets marketplace platform, public creator
            storefronts, client APIs, and admin consoles (collectively, the &ldquo;Platform&rdquo;). The
            Platform serves as a digital goods distribution channel connecting independent creators,
            software engineers, and graphic artists (&ldquo;Sellers&rdquo;) with registered licensees and
            enterprise purchasers (&ldquo;Buyers&rdquo;).
          </p>
        </section>

        {/* Section 2: Data Collection */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            2. Categories of Information We Collect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <Card className="p-5 rounded-2xl bg-surface border border-outline-variant/30 space-y-2">
              <h3 className="font-bold text-sm text-primary flex items-center gap-1.5">
                <Icons.Users size={16} /> User Account Records
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                When you create an account, we collect your display name, email address, password hash (salted using bcrypt), role (Buyer, Seller, or Manager), and multi-factor authentication tokens.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface border border-outline-variant/30 space-y-2">
              <h3 className="font-bold text-sm text-secondary flex items-center gap-1.5">
                <Icons.Download size={16} /> Licenses &amp; Fulfillment
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                When an order completes, we record transaction identifiers, cryptographic license keys, tier selections (Standard, Commercial, Enterprise), and deliverable audit logs including file checksums and download timestamps.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface border border-outline-variant/30 space-y-2">
              <h3 className="font-bold text-sm text-success flex items-center gap-1.5">
                <Icons.Eye size={16} /> Attention &amp; Dwell Telemetry
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                Using browser Page Visibility APIs, we measure active reading time spent on catalog entries, scroll progress percentages, and section interactions to help creators optimize product listings.
              </p>
            </Card>

            <Card className="p-5 rounded-2xl bg-surface border border-outline-variant/30 space-y-2">
              <h3 className="font-bold text-sm text-warning flex items-center gap-1.5">
                <Icons.Search size={16} /> Search &amp; Category Demand
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                We log keyword search queries and category browsing paths to calculate demand-to-supply balance metrics, revealing which digital asset types developers are actively seeking.
              </p>
            </Card>
          </div>
        </section>

        {/* Section 3: Zero Third-Party Ad Brokers */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            3. Strict Zero Third-Party Advertising Policy
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Unlike many online services, <strong>we do not install external tracking pixels, ad retargeting tags, or third-party behavioral analytics trackers</strong> (such as Google Analytics, Meta Pixel, or data brokers).
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            All telemetry is ingested directly through our first-party backend endpoint (<code className="text-xs bg-surface-container px-1.5 py-0.5 rounded">/api/v1/analytics/events/batch</code>) and stored exclusively in our managed PostgreSQL database. Your browsing habits are never sold, shared, or repurposed.
          </p>
        </section>

        {/* Section 4: Cookies & Storage Disclosures */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            4. Cookie &amp; Browser Storage Disclosures
          </h2>
          <div className="overflow-x-auto w-full overscroll-x-contain">
            <table className="w-full text-left text-xs border-collapse min-w-140">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container/50 uppercase tracking-wider text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-4">Storage Key</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Purpose &amp; Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface-variant">
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-on-surface">as_auth_token</td>
                  <td className="py-2.5 px-3">LocalStorage / Session</td>
                  <td className="py-2.5 px-4"><Badge variant="default" size="sm">Strictly Essential</Badge></td>
                  <td className="py-2.5 px-4">JWT bearer token authorizing your authenticated requests and download links.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-on-surface">sda_sid</td>
                  <td className="py-2.5 px-3">SessionStorage</td>
                  <td className="py-2.5 px-4"><Badge variant="default" size="sm">Strictly Essential</Badge></td>
                  <td className="py-2.5 px-4">Rotates session identifiers after 30 minutes of inactivity to prevent session fixation.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-on-surface">sda_vid</td>
                  <td className="py-2.5 px-3">LocalStorage</td>
                  <td className="py-2.5 px-4"><Badge variant="primary" size="sm">Analytics (Optional)</Badge></td>
                  <td className="py-2.5 px-4">Pseudonymous RFC 4122 UUID distinguishing repeat visitors from new visitors.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-mono font-semibold text-on-surface">sda_telemetry_consent</td>
                  <td className="py-2.5 px-3">LocalStorage</td>
                  <td className="py-2.5 px-4"><Badge variant="outline" size="sm">Consent Memory</Badge></td>
                  <td className="py-2.5 px-4">Records whether you accepted or declined optional behavioral telemetry.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Anti-Piracy & Security Protection */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            5. Anti-Piracy &amp; Download Auditing
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            To protect creators from automated scraping, credential dumps, and unauthorized redistributions, our file delivery engine generates short-lived, cryptographically signed download URLs valid for 15 minutes.
          </p>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Download access audits record transferring IP addresses and user IDs to detect anomaly bursts (such as rapid multi-file download spikes or multi-IP license key sharing).
          </p>
        </section>

        {/* Section 6: Data Rights */}
        <section className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            6. Your Rights under GDPR, UK DPA &amp; CCPA/CPRA
          </h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-on-surface-variant">
            <li><strong>Right of Access &amp; Portability</strong>: You may request an export of all account details and digital licenses linked to your identity.</li>
            <li><strong>Right to Rectification</strong>: You can update your profile name, password, or creator storefront details anytime via your dashboard.</li>
            <li><strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;)</strong>: You may delete your account. Note that financial purchase ledgers and active software license grants are retained as required by tax and contract law.</li>
            <li><strong>Right to Withdraw Consent</strong>: You can disable behavioral telemetry at any moment using the preference toggle above.</li>
          </ul>
        </section>

        {/* Section 7: Contact */}
        <section className="space-y-3 pt-4 border-t border-outline-variant/20">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            7. Contacting Compliance
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            If you have questions regarding this privacy policy or wish to exercise your data rights, please contact our Data Protection and Compliance team at{" "}
            <a href="mailto:privacy@selldigitalassets.com" className="text-primary hover:underline font-semibold">
              privacy@selldigitalassets.com
            </a>.
          </p>
        </section>
      </div>

      {/* Footer Navigation Back to Store */}
      <div className="pt-6 border-t border-outline-variant/30 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
        >
          <Icons.Back size={14} />
          <span>Return to Marketplace</span>
        </Link>
        <Link
          to="/terms"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
        >
          <span>Read Terms of Service</span>
          <Icons.ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default PolicyPage;

