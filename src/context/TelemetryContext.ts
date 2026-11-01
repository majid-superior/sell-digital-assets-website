// src/context/TelemetryContext.ts
import { createContext } from "react";
import type { TelemetryContextValue } from "@/services/telemetry/telemetryTypes.ts";

export const TelemetryContext = createContext<TelemetryContextValue | null>(null);

