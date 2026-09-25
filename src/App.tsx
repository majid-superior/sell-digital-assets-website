// src/App.tsx
import React from "react";
import { AppRoutes } from "@/routes/AppRoutes.tsx";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/useTheme.ts";

export default function App(): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        closeButton
        toastOptions={{
          className: "font-sans rounded-2xl shadow-lg border border-outline-variant/30",
        }}
      />
    </>
  );
}
