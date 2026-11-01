// src/hooks/useTelemetry.ts
import { useContext } from "react";
import { TelemetryContext } from "@/context/TelemetryContext.ts";
import type { TelemetryContextValue } from "@/services/telemetry/telemetryTypes.ts";

export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a <TelemetryProvider>");
  }
  return context;
}

