// src/utils/slugValidator.ts
export const RESERVED_STOREFRONT_URLS = new Set([
  "about",
  "admin",
  "api",
  "api-docs",
  "asset",
  "assets",
  "auth",
  "buyer",
  "careers",
  "cart",
  "catalog",
  "categories",
  "checkout",
  "community",
  "contact",
  "creator-guidelines",
  "dashboard",
  "disputes",
  "docs",
  "explore",
  "featured",
  "help",
  "licenses",
  "login",
  "logout",
  "orders",
  "payouts",
  "pricing",
  "privacy",
  "profile",
  "register",
  "search",
  "security",
  "seller",
  "seller-handbook",
  "server",
  "settings",
  "signin",
  "signup",
  "standards",
  "storefront",
  "support",
  "terms",
]);

export const normalizeStorefrontUrl = (value: string): string =>
  value.trim().toLowerCase();

export const isValidStorefrontUrl = (value: string): boolean => {
  const normalized = normalizeStorefrontUrl(value);
  if (!normalized) return false;
  const validFormat = /^[a-z0-9][a-z0-9_-]{2,29}$/.test(normalized);
  return validFormat && !RESERVED_STOREFRONT_URLS.has(normalized);
};

