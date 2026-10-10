# Frontend Engineering Guidelines & Architecture Standards

> **Applies to**: `sell-digital-assets-website` and all client marketplace modules.  
> **Scope**: UI rendering, data loading patterns, state management, theming synchronization, routing, and error handling.  
> **Target Audience**: AI Agents and Frontend Engineers.

---

## 1. Core Principles

1. **Live Backend Integration Principle**:
   - Authentication (`/auth/signin`, `/auth/signup`, `/auth/me`, `/auth/refresh`), digital asset queries, and theme synchronization must communicate directly with the live backend REST API (`c:\GH\sell-digital-assets-api`).
   - Never store business entities in `localStorage` or `sessionStorage` as a pseudo-database. Only authentication tokens, refresh tokens, and user session profiles may be persisted in browser storage.

2. **Zero Layout Shift (CLS = 0)**:
   - Pages must never "jump", "expand", or "zoom" when transitioning between loading and loaded states.
   - During catalog data fetching or route transitions, render geometric skeleton placeholders (`<Skeleton />`, `<Spinner />`) matching the exact line heights and card dimensions of the final content.

3. **Dynamic Theming & Zero-FOUC Guarantee**:
   - **Theme Synchronization**: The active palette and CSS custom properties are loaded dynamically from `/api/theme/active` via `src/services/v1/themeService.ts` and synced with Material 3 design tokens.
   - **Flash Prevention**: An inline script in `index.html` synchronously evaluates dark mode preferences prior to DOM paint, preventing Flash of Unstyled Theme.
   - **Design Tokens**: Styled using **Tailwind CSS v4** with CSS variables (`@theme` in `src/theme/styles/theme.css`).

4. **Robust Notification & Error Policy**:
   - Authentication errors and API failures must be presented cleanly using **Sonner** toast notifications (`toast.error(...)`) or dedicated error fallback layouts (`/server`, `ErrorPage`).
   - Never render raw unhandled stack traces or unformatted error payloads in client views.

---

## 2. Authentication & Session Strategy

- **Dual Storage Handling**:
  - **Remember Me Checked**: Access tokens and user profiles are stored in `localStorage` for multi-session persistence.
  - **Remember Me Unchecked**: Credentials are saved in `sessionStorage` for single-session tab security.
- **Request Interception**:
  - `src/services/interceptors/requestInterceptor.ts` automatically attaches the active Bearer token and formats query parameters.
- **Response Interception & Session Expiration**:
  - `src/services/interceptors/responseInterceptor.ts` intercepts HTTP `401 Unauthorized` responses and dispatches an `auth:unauthorized` custom event, triggering automatic logout or refresh flows.

---

## 3. Routing & Component Architecture

- **React Router v7**: All routing is declared in `src/routes/AppRoutes.tsx` using code-splitting with `React.lazy()` and `<Suspense>`.
- **Layout Topologies**:
  - **Index Shell** (`src/layouts/website/index.tsx`): Features the full Header, sticky Navbar, Body container, and Footer for `/`.
  - **Page Shell** (`src/layouts/website/page.tsx`): Shared layout for catalog explore (`/explore`, `/categories`, `/featured`) and asset detail showcases (`/asset/:slug`).
  - **Standalone Auth Layouts**: Dedicated focused flows for `/signin` and `/signup`.
  - **System Fallbacks**: `/server` for server error states and `*` (`ErrorPage`) for 404 handling.

---

## 4. Verification Checklist for AI Agents

Before declaring any website frontend task complete, verify:
1. `npx tsc -b` passes with **0 errors**.
2. `npm run lint` passes with **0 warnings and 0 errors**.
3. All interactive forms validate inputs with Zod schemas and React Hook Form.
4. Active theme colors and dark mode toggle operate seamlessly without layout shifts.
5. Tree-shakeable SVG icons from `@/lib/icons` are used instead of heavy icon fonts.

