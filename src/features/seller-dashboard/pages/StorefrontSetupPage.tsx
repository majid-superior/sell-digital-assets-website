// src/features/seller-dashboard/pages/StorefrontSetupPage.tsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ENV } from "../../../config/env.ts";
import { Icons } from "../../../lib/icons/index.ts";
import { Skeleton } from "../../../components/ui/index.ts";
import { useStorefrontSetup } from "../hooks/useStorefrontSetup.ts";
import { StorefrontSetupForm } from "../components/StorefrontSetupForm.tsx";
import {
  cancelClearStorefrontDraft,
  scheduleClearStorefrontDraft,
} from "../utils/storefrontDraft.ts";

export const StorefrontSetupPage: React.FC = () => {
  useEffect(() => {
    cancelClearStorefrontDraft();
    return () => {
      scheduleClearStorefrontDraft();
    };
  }, []);

  const {
    config,
    publishedAssets,
    isLoading,
    isSaving,
    saveStorefront,
  } = useStorefrontSetup();

  const isStorefrontLive = Boolean(
    config.url && config.url.trim() !== "" && config.isVisible
  );

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6" aria-busy="true">
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-6 space-y-3">
          <Skeleton className="h-7 w-56 rounded-lg" />
          <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-6 md:p-8 space-y-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header & Live Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-headline-md text-on-surface">Setup Storefront</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-badge-caption uppercase ${
                isStorefrontLive
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container-highest text-on-surface-variant"
              }`}
            >
              {isStorefrontLive ? "Live & Visible" : "Not Published"}
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Configure your custom seller URL, banner, title, description, and featured asset.
          </p>
        </div>

        {isStorefrontLive && (
          <Link
            to={`/${config.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-label-lg hover:bg-surface-container-highest transition-colors duration-150 shrink-0"
          >
            <Icons.ExternalLink size={16} />
            <span className="truncate">{ENV.APP_HOST}/{config.url}</span>
          </Link>
        )}
      </div>

      {/* Setup Form */}
      <StorefrontSetupForm
        initialData={config}
        publishedAssets={publishedAssets}
        isSaving={isSaving}
        onSubmit={saveStorefront}
      />
    </div>
  );
};

export default StorefrontSetupPage;

