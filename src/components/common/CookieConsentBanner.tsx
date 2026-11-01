// src/components/common/CookieConsentBanner.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import {
  getTelemetryConsent,
  setTelemetryConsent,
  type ConsentStatus,
} from "@/services/telemetry/telemetryStorage.ts";

export const CookieConsentBanner: React.FC = () => {
  const [consent, setConsent] = useState<ConsentStatus>(() => getTelemetryConsent());
  const [isDelayedMount, setIsDelayedMount] = useState<boolean>(false);

  useEffect(() => {
    if (consent !== "pending") return;
    const timer = setTimeout(() => {
      setIsDelayedMount(true);
    }, 750);
    return () => clearTimeout(timer);
  }, [consent]);

  useEffect(() => {
    const handleConsentChange = (e: CustomEvent<ConsentStatus>) => {
      setConsent(e.detail);
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

  const handleAcceptAll = () => {
    setTelemetryConsent("granted");
    setConsent("granted");
  };

  const handleEssentialOnly = () => {
    setTelemetryConsent("denied");
    setConsent("denied");
  };

  if (consent !== "pending" || !isDelayedMount) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Privacy and Cookie Preferences"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-surface/95 backdrop-blur-md border border-outline-variant/40 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
          <Icons.Security size={20} />
        </div>

        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-on-surface">
              Privacy &amp; Analytics Choices
            </h3>
            <button
              type="button"
              onClick={handleEssentialOnly}
              aria-label="Dismiss and use essential only"
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
            >
              <Icons.Close size={16} />
            </button>
          </div>

          <p className="text-xs text-on-surface-variant leading-relaxed">
            We use essential storage for authentication and digital file downloads, and optional
            telemetry to measure asset dwell times and category demand. We never sell your data
            to third-party ad networks.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            <Link
              to="/privacy"
              className="text-primary hover:underline font-semibold"
            >
              Privacy Policy
            </Link>
            <span className="text-outline-variant/60" aria-hidden="true">&bull;</span>
            <Link
              to="/terms"
              className="text-primary hover:underline font-semibold"
            >
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAcceptAll}
              className="flex-1 cursor-pointer font-bold text-xs"
            >
              Accept All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEssentialOnly}
              className="flex-1 cursor-pointer font-medium text-xs border-outline-variant/40"
            >
              Essential Only
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

