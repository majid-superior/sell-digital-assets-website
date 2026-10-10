import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

function htmlTemplatePlugin(orgTitle = "AssetDrop") {
  return {
    name: "html-template-transform",
    transformIndexHtml(html: string) {
      const escape = (str: string) =>
        str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

      return html
        .replace(/\$\{escapeHtml\(organization\.title\)\}/g, escape(orgTitle))
        .replace(/\$\{escapeHtml\(organization\.name\)\}/g, escape(orgTitle))
        .replace(/\$\{escapeHtml\(organization\.shortName\)\}/g, escape(orgTitle))
        .replace(
          /\$\{escapeHtml\(organization\.description\)\}/g,
          escape("Curated digital assets marketplace and creator ecosystem."),
        )
        .replace(/\$\{escapeHtml\(organization\.favicon\.url\)\}/g, "/favicon.ico")
        .replace(/\$\{escapeHtml\(organization\.favicon\.type\)\}/g, "image/x-icon");
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const orgTitle =
    process.env.VITE_APP_ORGANIZATION_TITLE ||
    env.VITE_APP_ORGANIZATION_TITLE ||
    "AssetDrop";
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL ||
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_URL ||
    env.VITE_API_URL ||
    process.env.API_BASE_URL ||
    env.API_BASE_URL ||
    "";

  return {
    plugins: [react(), tailwindcss(), htmlTemplatePlugin(orgTitle)],
    define: {
      ...(apiBaseUrl && !apiBaseUrl.includes("yourdomain.com")
        ? {
            "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
            "import.meta.env.VITE_API_URL": JSON.stringify(apiBaseUrl),
          }
        : {}),
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: process.env.VITE_BACKEND_ORIGIN || "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("react-router-dom") || id.includes("/react/") || id.includes("/react-dom/")) {
                return "vendor-react";
              }
              if (id.includes("@tanstack")) {
                return "vendor-query";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
            }
          },
        },
      },
    },
  };
});
