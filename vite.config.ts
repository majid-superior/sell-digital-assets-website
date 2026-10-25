import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type ViteDevServer, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

function heroDataSyncPlugin(): Plugin {
  return {
    name: "hero-data-sync-plugin",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === "/api/internal/update-hero-json" && req.method === "POST") {
          let body = "";
          req.on("data", (chunk: Buffer | string) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            void (async () => {
              try {
                const parsed: unknown = JSON.parse(body);
                if (typeof parsed !== "object" || parsed === null) {
                  throw new Error("Invalid payload: expected JSON object");
                }
                const targetPath = fileURLToPath(
                  new URL("./src/features/website/data/heroImages.json", import.meta.url),
                );
                await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
                await fs.promises.writeFile(targetPath, JSON.stringify(parsed, null, 2), "utf-8");
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 200;
                res.end(
                  JSON.stringify({
                    success: true,
                    message: "Hero images JSON updated successfully",
                  }),
                );
              } catch (err: unknown) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                const errorMessage =
                  err instanceof Error ? err.message : "Failed to update hero images JSON";
                res.end(
                  JSON.stringify({
                    success: false,
                    error: errorMessage,
                  }),
                );
              }
            })();
          });
          return;
        }
        next();
      });
    },
  };
}

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
    plugins: [react(), tailwindcss(), heroDataSyncPlugin(), htmlTemplatePlugin(orgTitle)],
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
