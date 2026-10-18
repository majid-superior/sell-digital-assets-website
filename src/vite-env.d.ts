/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * The base URL for the backend API endpoints.
     * e.g. "https://api.yourdomain.com/api/v1" or "/api/v1"
     */
    readonly VITE_API_BASE_URL?: string;

    /**
     * The backend API server URL.
     * e.g. "http://localhost:5000" or "https://api.yourdomain.com"
     */
    readonly VITE_API_URL?: string;

    /**
     * Backend origin for the local dev server reverse proxy.
     * e.g. "http://localhost:5000"
     */
    readonly VITE_BACKEND_ORIGIN?: string;

    /**
     * Brand or organization title for the marketplace.
     */
    readonly VITE_APP_ORGANIZATION_TITLE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
