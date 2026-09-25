/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * The base URL for the backend API endpoints.
     * e.g. "https://api.yourdomain.com/api/v1" or "http://localhost:5000/api/v1"
     */
    readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
