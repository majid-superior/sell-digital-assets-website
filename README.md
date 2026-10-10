<p align="center">
  <img src="public/logo.png" alt="AssetDrop Logo" width="96" height="96" style="border-radius: 20px;" />
</p>

# AssetDrop — Sell Digital Assets Marketplace

A modern, high-performance digital goods marketplace platform built for creators, designers, and developers. Engineered with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, **React Router v7**, and **TanStack React Query v5**.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/typescript-6.0-blue?style=flat-square)
![React](https://img.shields.io/badge/react-19.3-61dafb?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/tailwind-v4.3-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Architecture & Core Capabilities

- **Blazing Fast Performance**: Bootstrapped with Vite 8 and React 19, delivering instant Hot Module Replacement (HMR) and optimized route chunks.
- **Zero-FOUC Dynamic Theme Engine**: Synchronous inline head evaluation prevents Flash of Unstyled Theme on initial paint; dynamic `ThemeProvider` and `themeService` synchronize with backend theme endpoints (`/api/theme/active`), injecting CSS variables into the document root.
- **Tailwind CSS v4 Design Token System**: Material 3-inspired dynamic color palette with semantic tokens (surface containers, primary containers, contrast on-surface, and typography scales).
- **Tree-Shakeable SVG Iconography**: Zero-runtime font overhead powered by `lucide-react` through `@/lib/icons`.
- **Decoupled Interceptor Pipeline**:
  - `requestInterceptor.ts`: Automatic Bearer token synchronization across `localStorage` / `sessionStorage` and parameter serialization.
  - `responseInterceptor.ts`: Global 401 unauthorized dispatch via custom window events and structured `ApiError` typing.
- **Catalog Exploration & Discovery**:
  - **Landing Showcase (`/`)**: Dynamic hero banner, value proposition highlights, and featured collection showcases.
  - **Catalog Exploration (`/explore`, `/categories`, `/featured`)**: Instant full-text search, categories taxonomy filtering, and sorting.
  - **Asset Detail Showcase (`/asset/:slug`)**: Product preview gallery, specifications, and licensing tier selector.
- **Authentication & Credential Security**:
  - **Sign In (`/signin`)**: Secure authentication with "Remember Me" dual-storage strategy (`localStorage` for persistent sessions vs `sessionStorage` for single sessions).
  - **Sign Up (`/signup`)**: Real-time **Zod** schema validation with interactive password strength meter.
- **Robust Error & Status Fallbacks**:
  - Dedicated `/server` page for maintenance and backend outage handling.
  - Accessible 404 error page (`ErrorPage`) for unmatched routes.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Core Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Language** | [TypeScript 6](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS Variables (`@theme`) |
| **Routing** | [React Router v7](https://reactrouter.com/) (Code-split with `<Suspense>`) |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) |
| **Form & Schema Engine** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Icons** | [Lucide React](https://lucide.dev/) (Tree-shakeable SVGs) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Linting & A11y** | [ESLint 9](https://eslint.org/) + `typescript-eslint` + `eslint-plugin-jsx-a11y` |

---

## Directory Structure

```text
sell-digital-assets-website/
├── public/                     # Static assets (favicons, manifest, logo.png)
├── src/
│   ├── assets/                 # Local WOFF2 fonts and graphics
│   ├── components/             # Reusable UI primitives (Button, Input, Card, Modal, AssetCard, Spinner)
│   ├── config/                 # Environment configuration (env.ts)
│   ├── context/                # Theme and Authentication context contracts
│   ├── features/               # Feature-sliced domain modules
│   │   ├── auth/               # Sign-in and sign-up mutations, Zod schemas, and types
│   │   └── website/            # HeroSection, FeatureHighlights, ExplorePage, AssetDetailPage
│   ├── hooks/                  # Custom React hooks (useTheme, useAuth, useDebounce, useLocalStorage)
│   ├── layouts/website/        # Shell layouts (Index, Page, Header, Navbar, Body, Footer, pages/)
│   ├── lib/
│   │   ├── icons/              # Unified semantic and brand SVG icon library
│   │   ├── queryClient.ts      # TanStack Query client configuration
│   │   └── utils.ts            # Utility functions (cn class merger)
│   ├── provider/               # Context providers (ThemeProvider, AuthProvider)
│   ├── routes/                 # Routing pipeline (AppRoutes.tsx, ProtectedRoute.tsx)
│   ├── services/               # HTTP client & API service layer
│   │   ├── api.ts              # Fetch client with AbortController timeout management
│   │   ├── queryKeys.ts        # TanStack Query cache key definitions
│   │   ├── interceptors/       # Request and response interceptor pipeline
│   │   └── v1/                 # Domain API services (assetService.ts, authService.ts, themeService.ts)
│   ├── theme/                  # Theme system, styles (fonts, reset, theme) & tokens
│   ├── types/                  # Domain TypeScript interfaces (asset.ts, user.ts)
│   ├── utils/                  # Currency, date, and file formatting utilities
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Client application bootstrap
├── .env.example                # Sample environment variables template
├── eslint.config.js            # Flat ESLint configuration with JSX A11y
├── package.json                # Project dependencies and npm scripts
├── tsconfig.app.json           # Application TypeScript compiler config
├── vercel.json                 # Vercel deployment & SPA rewrites
└── vite.config.ts              # Vite bundler configuration & dev proxy (Port 5173)
```

---

## Routing Topology

| Path | Layout | Description |
| :--- | :--- | :--- |
| `/` | `Index` | Marketplace Landing Showcase (Hero, Value highlights, Curated items) |
| `/explore` | `Page` | Live catalog exploration with full-text search, categories, and sorting |
| `/categories` | `Page` | Category-filtered asset catalog view |
| `/featured` | `Page` | Curated featured digital assets showcase |
| `/asset/:slug` | `Page` | Asset detail view with previews, author information, and licensing tiers |
| `/signin` | Standalone | Authentication sign-in with Remember Me preference |
| `/signup` | Standalone | User registration with Zod validation and password strength meter |
| `/server` | Standalone | Server error and maintenance state view |
| `*` | Standalone | 404 Not Found error fallback |

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or later (tested on Node v22.x)
- **Package Manager**: `npm` (v10+ recommended)
- **Backend API**: Running on `http://localhost:5000` (`sell-digital-assets-api`)

### Installation

```powershell
npm install
```

### Environment Configuration

Create a `.env` file in the root based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
API_BASE_URL=http://localhost:5000
```

### Development Server

Start the local Vite development server:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite dev server with instant Hot Module Replacement (HMR). |
| `npm run build` | Runs TypeScript type-checking (`tsc -b`) and produces a minified production bundle in `dist/`. |
| `npm run lint` | Lints all `.ts`, `.tsx`, and `.js` files with ESLint and JSX accessibility rules. |
| `npm run preview` | Serves the production build locally to test performance and caching. |

---

## Deployment on Vercel

1. Push your code to GitHub.
2. Log in to [vercel.com](https://vercel.com) and import the repository (`sell-digital-assets-website`).
3. Vercel automatically detects the framework presets via `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, set:
   - `VITE_API_BASE_URL` = URL of your deployed backend API (e.g. `https://api.assetdrop.com`).
5. Click **Deploy**.

> [!IMPORTANT]
> **Backend CORS Configuration:** Ensure the production website domain (e.g. `https://assetdrop.com`) is included in your backend's `ALLOWED_ORIGINS` environment variable in `sell-digital-assets-api`.

---

## License

This project is licensed under the MIT License.
