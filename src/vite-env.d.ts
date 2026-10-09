/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * The base URL for the backend API endpoints.
     * e.g. "https://api.yourdomain.com/api" or "/api" when using the Vite proxy
     */
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
