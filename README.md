# AssetDrop - Sell Digital Assets Marketplace

A modern, high-performance digital goods marketplace platform built for independent designers, type foundries, and 3D creators. Engineered with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **Vitest**.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/tests-17%20passed-brightgreen?style=flat-square)
![Lint](https://img.shields.io/badge/eslint-0%20errors-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/typescript-6.0-blue?style=flat-square)
![React](https://img.shields.io/badge/react-19.3-61dafb?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/tailwind-v4.3-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Architecture & Remediated Capabilities

- **Blazing Fast Performance**: Bootstrapped with Vite 8 and React 19, delivering sub-second HMR and isolated route chunks between 1.5 kB and 13.8 kB.
- **Zero-FOUC Theme Engine**: Synchronous inline head evaluation prevents Flash of Unstyled Theme on initial paint; dynamic `ThemeProvider` and `useTheme` hook with automatic OS `prefers-color-scheme` synchronization.
- **Tailwind CSS v4 Design Token System**: Material 3-inspired dynamic color palette with comprehensive semantic tokens (surface containers, primary containers, on-surface contrast, and typography scales).
- **Tree-Shakeable SVG Iconography**: Zero-runtime font overhead powered by `lucide-react`, eliminating 490 KB of font bloat.
- **Decoupled Interceptor Pipeline**: Robust `requestInterceptor` (auto-token sync across localStorage/sessionStorage, param serialization) and `responseInterceptor` (global 401 unauth dispatch, structured `ApiError` typing).
- **Multi-Portal Architecture**:
  - **Public Marketplace**: Landing showcase, instant full-text search, multi-category exploration, and detailed asset previews.
  - **Checkout Flow**: Dynamic license tier selection (Personal, Commercial, Extended), interactive discount promo engine, and instant fulfillment.
  - **Buyer Portal**: Purchases library, instant ZIP asset downloads, license certificates, and account preferences.
  - **Creator Studio**: Asset publishing form with drag-and-drop bundle dropzone, listing catalog management, financial KPI analytics, and Stripe Connect payout triggers.
  - **Dispute Resolution**: Mediation center for buyer protection and claim filing.
- **Strict Quality Gates**: Type-aware ESLint flat configuration (`@typescript-eslint/recommendedTypeChecked`), Web Content Accessibility Guidelines (`eslint-plugin-jsx-a11y`), and strict TypeScript verification with **0 errors and 0 warnings**.
- **Automated Unit Test Suite**: Powered by **Vitest**, covering utility functions, request/response interceptors, and auth validation schemas.

---

## Tech Stack

| Layer                       | Technology                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------- |
| **Core Framework**          | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)                           |
| **Language**                | [TypeScript 6](https://www.typescriptlang.org/) (Strict Mode & Verbatim Module Syntax) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS Variables (`@theme`)              |
| **Form & Schema Engine**    | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)              |
| **State & Data Fetching**   | [TanStack React Query v5](https://tanstack.com/query)                                 |
| **Icons**                   | [Lucide React](https://lucide.dev/) (Tree-shakeable SVGs)                              |
| **Routing**                 | [React Router v7](https://reactrouter.com/) (Code-split with `<Suspense>`)            |
| **Test Runner**             | [Vitest](https://vitest.dev/)                                                          |
| **Linting & A11y**          | [ESLint 10](https://eslint.org/) + `typescript-eslint` + `eslint-plugin-jsx-a11y`      |

---

## Directory Structure

```text
sell-digital-assets-website/
├── public/                     # Static assets (favicons, icons)
├── src/
│   ├── assets/                 # Local WOFF2 fonts and branding images
│   ├── components/             # Reusable UI components (Button, Input, Card, Modal, AssetCard)
│   ├── config/                 # Environment variables and runtime configuration (env.ts)
│   ├── context/                # Theme and auth context contracts
│   ├── data/                   # Realistic mock datasets (mockAssets.ts)
│   ├── features/               # Feature-sliced domain modules
│   │   ├── auth/               # Sign-in, sign-up mutations, and Zod schemas
│   │   ├── buyer-dashboard/    # Purchases, downloads & settings
│   │   ├── checkout/           # Cart, license tiering, promos & instant fulfillment
│   │   ├── disputes/           # Buyer protection & resolution mediation
│   │   ├── seller-dashboard/   # Asset uploads, sales metrics & payouts
│   │   └── website/            # Landing page, catalog explore & asset details
│   ├── hooks/                  # Custom React hooks (useTheme, useAuth, useDebounce)
│   ├── layouts/                # Shell layouts (Index, Page, BuyerLayout, SellerLayout)
│   ├── lib/icons/              # Unified semantic and brand SVG icon library
│   ├── provider/               # Context providers (ThemeProvider, AuthProvider)
│   ├── routes/                 # Routing table & navigation guards (AppRoutes.tsx, ProtectedRoute.tsx)
│   ├── services/               # HTTP client & API service layer (api.ts, interceptors/, queryKeys.ts)
│   ├── theme/                  # Theme system, styles (fonts, reset, theme) & tokens
│   ├── types/                  # Domain TypeScript interfaces (asset, user, order)
│   └── utils/                  # Currency, date, and file formatting utilities
├── tests/                      # Automated Vitest unit test suite
├── eslint.config.js            # Type-aware flat ESLint config
├── package.json
├── tsconfig.app.json           # Application TypeScript compiler config
└── vite.config.ts              # Vite bundler configuration & code splitting
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or later (tested on Node v22.x)
- **Package Manager**: `npm` (v10+ recommended)

### Installation

```powershell
npm install --legacy-peer-deps
```

### Development Server

Start the local Vite development server:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command           | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`     | Starts the Vite dev server with instant Hot Module Replacement (HMR).                          |
| `npm run build`   | Runs TypeScript type-checking (`tsc -b`) and produces a minified production bundle in `dist/`. |
| `npm run lint`    | Lints all `.ts`, `.tsx`, and `.js` files with type-aware ESLint and JSX accessibility rules.   |
| `npm run test`    | Executes the automated Vitest test suite.                                                      |
| `npm run preview` | Serves the production build locally to test performance and caching.                           |

---

## Routing Topology

| Path | Layout | Description |
| :--- | :--- | :--- |
| `/` | `Index` | Marketplace Landing Showcase (Hero, Featured, Category highlights) |
| `/explore` | `Page` | Live catalog with full-text search, categories, and sorting |
| `/asset/:slug` | `Page` | Asset detail showcase, preview gallery, and licensing selector |
| `/checkout` | `Page` | Secure multi-tier checkout, discount promo codes, and order receipt |
| `/disputes` | `Page` | Resolution center & claim submission modal |
| `/signin` | Standalone | Authentication sign-in with remember-me support |
| `/signup` | Standalone | Real Zod-validated registration with password strength meter |
| `/buyer` | `BuyerLayout` | Buyer Purchases & Download library with KPI stats |
| `/buyer/settings` | `BuyerLayout` | Buyer account, currency, and notification preferences |
| `/seller` | `SellerLayout` | Creator Studio Overview with KPI summary cards |
| `/seller/assets` | `SellerLayout` | Active listings manager with unpublish/view actions |
| `/seller/new` | `SellerLayout` | Digital asset publishing studio with dropzone and tier calculator |
| `/seller/analytics` | `SellerLayout` | Revenue trends, conversion rate, and Stripe Connect payout triggers |

---

## License

This project is licensed under the MIT License.
