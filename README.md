# AssetDrop - Sell Digital Assets Marketplace

A modern, high-performance digital goods marketplace platform built for independent designers, type foundries, and 3D creators. Engineered with **React 19**, **TypeScript**, **Vite 8**, and **Tailwind CSS v4**.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/typescript-6.0-blue?style=flat-square)
![React](https://img.shields.io/badge/react-19.2-61dafb?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/tailwind-v4.3-38bdf8?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Features

- **Blazing Fast Performance**: Bootstrapped with Vite 8 and React 19, delivering sub-second HMR and a production bundle of ~315 KB.
- **Zero-FOUC Theme Engine**: Synchronous inline head evaluation prevents Flash of Unstyled Theme on initial paint; dynamic `ThemeProvider` and `useTheme` hook with automatic OS `prefers-color-scheme` synchronization.
- **Tailwind CSS v4 Design Token System**: Material 3-inspired dynamic color palette with comprehensive semantic tokens (surface containers, primary containers, on-surface contrast, and typography scales).
- **Tree-Shakeable SVG Iconography**: Zero-runtime font overhead powered by `lucide-react`, eliminating 490 KB of font bloat.
- **Local Variable Typography**: Local WOFF2 font delivery for Plus Jakarta Sans with variable optical sizing and letter-spacing normalization.
- **Strict Quality Gates**: Type-aware ESLint flat configuration (`@typescript-eslint/recommendedTypeChecked`), Web Content Accessibility Guidelines (`eslint-plugin-jsx-a11y`), and strict TypeScript verification.
- **Interactive Catalog & Mock Data**: Pre-configured domain models for digital assets, orders, and creators, complete with responsive cards, instant category filtering, and real-time live search.

---

## Tech Stack

| Layer                       | Technology                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------- |
| **Core Framework**          | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)                           |
| **Language**                | [TypeScript 6](https://www.typescriptlang.org/) (Strict Mode & Verbatim Module Syntax) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) with CSS Variables (`@theme`)              |
| **Icons**                   | [Lucide React](https://lucide.dev/) (Tree-shakeable SVGs)                              |
| **Routing**                 | [React Router v7](https://reactrouter.com/)                                            |
| **Linting & A11y**          | [ESLint 10](https://eslint.org/) + `typescript-eslint` + `eslint-plugin-jsx-a11y`      |

---

## Directory Structure

```text
sell-digital-assets/
├── docs/
├── public/                     # Static assets (favicons, icons)
├── src/
│   ├── assets/                 # Local WOFF2 fonts and branding images
│   ├── components/
│   │   └── common/             # Reusable UI components (AssetCard, ThemeShowcase)
│   ├── context/                # Theme and app context contracts (themeContext.ts)
│   ├── data/                   # Realistic mock data (mockAssets.ts, creators)
│   ├── features/               # Feature-sliced domain modules
│   │   ├── auth/               # Authentication & session handling
│   │   ├── buyer-dashboard/    # Purchases, downloads & receipts
│   │   ├── checkout/           # Cart, license selection & payments
│   │   ├── public-catalog/     # HomePage, explore & product details
│   │   └── seller-dashboard/   # Asset uploads, sales metrics & payouts
│   ├── hooks/                  # Custom React hooks (useTheme, useDebounce)
│   ├── layouts/                # Shell layouts (PublicLayout, BuyerLayout, SellerLayout)
│   ├── provider/               # Context providers (ThemeProvider)
│   ├── routes/                 # Routing table & navigation guards (AppRoutes.tsx)
│   ├── services/               # HTTP client & API service layer (api.ts, queryKeys.ts)
│   ├── styles/                 # Tailwind entry, reset, fonts & token definitions
│   ├── types/                  # Domain TypeScript interfaces (asset, user, order)
│   └── utils/                  # Currency, date, and file formatting utilities
├── eslint.config.js            # Type-aware flat ESLint config
├── package.json
├── tsconfig.app.json           # Application TypeScript compiler config
└── vite.config.ts              # Vite bundler configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or later (tested on Node v22.x)
- **Package Manager**: `npm` (v10+ recommended)

### Installation

1. **Clone the repository:**

   ```powershell
   git clone https://github.com/majid-superior/sell-digital-assets.git
   cd sell-digital-assets
   ```

2. **Install dependencies:**
   ```powershell
   npm install
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
| `npm run preview` | Serves the production build locally to test performance and caching.                           |

---

## Design System & Themes

The application features a built-in Material 3 color system with full dark mode support:

- **Tokens**: Declared via CSS variables in `src/styles/theme.css` and mapped to Tailwind v4 `@theme`.
- **Theme Toggling**: Controlled via the custom `useTheme()` hook:

  ```tsx
  import { useTheme } from "@/hooks/useTheme.ts";

  const { theme, toggleTheme } = useTheme();
  ```

- **Zero FOUC**: An inline `<script>` in `index.html` inspects `localStorage` and system preferences before initial DOM render to apply `.dark` without any white flash.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
