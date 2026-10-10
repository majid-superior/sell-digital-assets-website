import { apiClient, ApiError } from "../api.ts";
import { COLOR_HEX_MAP } from "../../theme/tokens/colors.ts";

export interface ThemePalette {
  primary?: string;
  primaryContainer?: string;
  onPrimary?: string;
  onPrimaryContainer?: string;
  primaryFixed?: string;
  primaryFixedDim?: string;
  onPrimaryFixed?: string;
  onPrimaryFixedVariant?: string;
  secondary?: string;
  secondaryContainer?: string;
  onSecondary?: string;
  onSecondaryContainer?: string;
  secondaryFixed?: string;
  secondaryFixedDim?: string;
  onSecondaryFixed?: string;
  onSecondaryFixedVariant?: string;
  tertiary?: string;
  tertiaryContainer?: string;
  onTertiary?: string;
  onTertiaryContainer?: string;
  tertiaryFixed?: string;
  tertiaryFixedDim?: string;
  onTertiaryFixed?: string;
  onTertiaryFixedVariant?: string;
  background?: string;
  onBackground?: string;
  surface?: string;
  surfaceDim?: string;
  surfaceBright?: string;
  surfaceContainerLowest?: string;
  surfaceContainerLow?: string;
  surfaceContainer?: string;
  surfaceContainerHigh?: string;
  surfaceContainerHighest?: string;
  surfaceVariant?: string;
  onSurface?: string;
  onSurfaceVariant?: string;
  outline?: string;
  outlineVariant?: string;
  inverseSurface?: string;
  inverseOnSurface?: string;
  inversePrimary?: string;
  error?: string;
  errorContainer?: string;
  onError?: string;
  onErrorContainer?: string;
  [key: string]: string | undefined;
}

export interface ColorHexMap {
  light: Record<string, string>;
  dark: Record<string, string>;
  [key: string]: unknown;
}

export interface ActiveThemeData {
  id: number | string;
  name: string;
  slug: string;
  mode?: string;
  borderRadius?: string;
  isActive: boolean;
  colorHexMap: ColorHexMap;
  colorTokens?: Record<string, string>;
  typography?: Record<string, unknown>;
  updatedAt?: string;
  etag?: string;
}

export type ActiveThemeResponse = ActiveThemeData;

export interface ThemeApiResponse {
  success: boolean;
  data: ActiveThemeData;
  message?: string;
}

export interface UpdateThemePayload {
  color_hex_map?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  } | Record<string, string>;
  color_tokens?: Record<string, string>;
  name?: string;
  mode?: string;
  border_radius?: string;
  typography?: Record<string, unknown>;
}

export class ThemeServiceError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = "ThemeServiceError";
    this.status = status;
    this.details = details;
  }
}

let cachedTheme: ActiveThemeData | null = null;
const STORAGE_KEY_CSS = "theme_css";
const STORAGE_KEY_ACTIVE = "sda_active_theme";
const STORAGE_KEY_ETAG = "theme_etag";

function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Robust response normalizer: guarantees that unwrapping API response payloads
 * (whether raw, wrapped in { success: true, data: { ... } }, or flat/nested)
 * NEVER throws 'Cannot read properties of undefined (reading 'colorHexMap')'.
 */
export function unwrapThemeResponse(res: unknown): ActiveThemeData {
  const fallback: ActiveThemeData = {
    id: 1,
    name: "Default Theme",
    slug: "default",
    mode: "dark",
    borderRadius: "rounded-lg",
    isActive: true,
    colorHexMap: {
      light: { ...COLOR_HEX_MAP.light },
      dark: { ...COLOR_HEX_MAP.dark },
    },
    colorTokens: {},
  };

  if (!res || typeof res !== "object") {
    return fallback;
  }

  const obj = res as Record<string, unknown>;
  const raw = (obj.data && typeof obj.data === "object" ? obj.data : obj) as Record<string, unknown>;

  const rawMap = (raw.colorHexMap || raw.color_hex_map || {}) as Record<string, unknown>;

  const hasNestedLight = rawMap.light && typeof rawMap.light === "object";
  const hasNestedDark = rawMap.dark && typeof rawMap.dark === "object";

  let lightMap: Record<string, string> = {};
  let darkMap: Record<string, string> = {};

  if (hasNestedLight || hasNestedDark) {
    lightMap = (hasNestedLight ? rawMap.light : {}) as Record<string, string>;
    darkMap = (hasNestedDark ? rawMap.dark : {}) as Record<string, string>;
  } else {
    // If rawMap is a flat dictionary of color variables (e.g. { primary: "#b388ff", ... })
    const flatColors: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawMap)) {
      if (typeof val === "string" && key !== "light" && key !== "dark") {
        flatColors[key] = val;
      }
    }
    lightMap = flatColors;
    darkMap = flatColors;
  }

  const mergedLight: Record<string, string> = {
    ...COLOR_HEX_MAP.light,
    ...lightMap,
  };
  const mergedDark: Record<string, string> = {
    ...COLOR_HEX_MAP.dark,
    ...darkMap,
  };

  return {
    id: typeof raw.id === "number" || typeof raw.id === "string" ? raw.id : 1,
    name: typeof raw.name === "string" ? raw.name : "Active Theme",
    slug: typeof raw.slug === "string" ? raw.slug : "active-theme",
    mode: typeof raw.mode === "string" ? raw.mode : "dark",
    borderRadius:
      typeof raw.borderRadius === "string"
        ? raw.borderRadius
        : typeof raw.border_radius === "string"
        ? raw.border_radius
        : "rounded-lg",
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    colorHexMap: {
      light: mergedLight,
      dark: mergedDark,
    },
    colorTokens: (raw.colorTokens || raw.color_tokens || {}) as Record<string, string>,
    typography: (raw.typography || {}) as Record<string, unknown>,
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : typeof raw.updated_at === "string"
        ? raw.updated_at
        : undefined,
    etag: typeof raw.etag === "string" ? raw.etag : undefined,
  };
}

/**
 * Compiles color hex map tokens into standard CSS variables with !important
 * to reliably override default Tailwind v3/v4 @theme fallback rules.
 */
export function compilePaletteToCss(colorHexMap: ColorHexMap): string {
  const light = colorHexMap.light || {};
  const dark = colorHexMap.dark || {};

  const lightLines: string[] = [];
  for (const [key, val] of Object.entries(light)) {
    if (val && typeof val === "string") {
      const kebab = camelToKebab(key);
      lightLines.push(`  --color-${kebab}: ${val} !important;`);
    }
  }

  const darkLines: string[] = [];
  for (const [key, val] of Object.entries(dark)) {
    if (val && typeof val === "string") {
      const kebab = camelToKebab(key);
      darkLines.push(`  --color-${kebab}: ${val} !important;`);
    }
  }

  return `/* Dynamic Theme CSS Variables injected from database */
:root {
${lightLines.join("\n")}
}

.dark,
[data-theme="dark"] {
${darkLines.join("\n")}
}
`;
}

/**
 * Applies dynamic color CSS variables into document head so all Tailwind @theme tokens re-render in real time.
 * Synchronously writes to localStorage for 0ms initial paints on next visits.
 */
export function applyThemeToDom(colorHexMap?: ColorHexMap | null): string {
  if (typeof document === "undefined" || !colorHexMap) return "";

  const css = compilePaletteToCss(colorHexMap);

  let styleTag = document.getElementById("dynamic-theme-vars") as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "dynamic-theme-vars";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = css;

  try {
    localStorage.setItem(STORAGE_KEY_CSS, css);
  } catch {
    // Ignore storage errors in private browsing modes
  }

  return css;
}

/**
 * Backward compatibility alias for applyThemeToDom
 */
export function applyThemeCss(css: string): void {
  if (typeof document === "undefined" || !css) return;

  let styleEl = document.getElementById("dynamic-theme-vars") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-theme-vars";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;

  try {
    localStorage.setItem(STORAGE_KEY_CSS, css);
  } catch {
    // Ignore storage errors
  }
}

export const themeService = {
  /**
   * Fast bootstrap called at application launch (main.tsx).
   * Reads from localStorage cache if available for instant 0ms paint, then silently syncs with PostgreSQL.
   */
  initThemeBootstrap(): void {
    if (typeof window === "undefined") return;

    try {
      // 1. Immediately apply cached CSS variables for 0ms first frame paint
      const cachedCss = localStorage.getItem(STORAGE_KEY_CSS);
      if (cachedCss) {
        applyThemeCss(cachedCss);
      }

      // 2. Preload in-memory cached theme entity from localStorage
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        const normalized = unwrapThemeResponse(parsed);
        cachedTheme = normalized;
        applyThemeToDom(normalized.colorHexMap);
      }
    } catch {
      // Ignore storage parse errors
    }

    // 3. Silent background SWR sync with PostgreSQL database
    this.getActiveTheme({ silent: true }).catch(() => {
      // Handled silently
    });
  },

  /**
   * Returns current in-memory cached theme for 0ms delay during route changes.
   */
  getCachedTheme(): ActiveThemeData | null {
    return cachedTheme;
  },

  /**
   * Clears in-memory theme cache and localStorage.
   */
  clearCache(): void {
    cachedTheme = null;
    try {
      localStorage.removeItem(STORAGE_KEY_ACTIVE);
      localStorage.removeItem(STORAGE_KEY_CSS);
      localStorage.removeItem(STORAGE_KEY_ETAG);
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Fetches active theme from backend PostgreSQL database and applies to DOM.
   * Leverages SWR and ETag validation.
   */
  async getActiveTheme(options?: {
    silent?: boolean;
    signal?: AbortSignal;
  }): Promise<ActiveThemeData> {
    try {
      const storedEtag = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_ETAG) : null;
      const headers: Record<string, string> = {};
      if (storedEtag) {
        headers["If-None-Match"] = storedEtag;
      }

      // Request active theme with fallbacks across endpoints
      const res = await apiClient
        .get<unknown>("/api/theme/active", {
          signal: options?.signal,
          headers,
        })
        .catch(async (err: unknown) => {
          if (err instanceof ApiError && (err.status === 404 || err.status === 0)) {
            return apiClient.get<unknown>("/api/theme", {
              signal: options?.signal,
              headers,
            });
          }
          throw err;
        })
        .catch(async () => {
          return apiClient.get<unknown>("/theme/active", {
            signal: options?.signal,
            headers,
          });
        })
        .catch(async () => {
          return apiClient.get<unknown>("/theme", {
            signal: options?.signal,
            headers,
          });
        });

      const themeData = unwrapThemeResponse(res);
      cachedTheme = themeData;

      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(themeData));
        if (themeData.etag) {
          localStorage.setItem(STORAGE_KEY_ETAG, themeData.etag);
        }
      } catch {
        // Ignore storage access errors
      }

      applyThemeToDom(themeData.colorHexMap);
      return themeData;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
      if (cachedTheme) return cachedTheme;

      // Fallback to default design tokens if API is unreachable
      const fallback: ActiveThemeData = {
        id: 1,
        name: "Default Theme",
        slug: "default",
        mode: "dark",
        borderRadius: "rounded-lg",
        isActive: true,
        colorHexMap: {
          light: { ...COLOR_HEX_MAP.light },
          dark: { ...COLOR_HEX_MAP.dark },
        },
      };
      cachedTheme = fallback;
      applyThemeToDom(fallback.colorHexMap);
      return fallback;
    }
  },

  /**
   * Updates active theme colors directly in PostgreSQL database and re-applies to DOM.
   */
  async updateActiveTheme(
    payload: UpdateThemePayload,
    options?: { signal?: AbortSignal }
  ): Promise<ActiveThemeData> {
    try {
      const res = await apiClient.put<unknown>("/api/theme", payload, {
        signal: options?.signal,
      });

      const updated = unwrapThemeResponse(res);
      cachedTheme = updated;

      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(updated));
        if (updated.etag) {
          localStorage.setItem(STORAGE_KEY_ETAG, updated.etag);
        }
      } catch {
        // Ignore storage errors
      }

      applyThemeToDom(updated.colorHexMap);
      return updated;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw new ThemeServiceError(err.message, err.status, err.data);
      }
      throw err;
    }
  },

  /**
   * Backward compatibility alias for syncThemeFromBackend
   */
  async syncThemeFromBackend(): Promise<ActiveThemeData> {
    return this.getActiveTheme();
  },
};

export const websiteThemeService = themeService;
export default themeService;
