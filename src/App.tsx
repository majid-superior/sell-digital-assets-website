// src/App.tsx
import React from "react";
import { AppRoutes } from "@/routes/AppRoutes.tsx";
import { CookieConsentBanner } from "@/components/common/CookieConsentBanner.tsx";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme.ts";

export default function App(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <>
      <AppRoutes />
      <CookieConsentBanner />
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
        offset={{ bottom: 150, right: 30 }}
        toastOptions={{
          className:
            "font-sans rounded-2xl shadow-lg border border-outline-variant/30",
        }}
      />
    </>
  );
}
