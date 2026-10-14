// src/types/license.ts

export interface LicenseEntity {
  id: string;
  license_key: string;
  asset_id: string;
  buyer_id: string;
  tier: "personal" | "commercial" | "extended";
  status: "active" | "suspended" | "revoked";
  max_activations: number;
  activations_count: number;
  issued_at: string;
  expires_at?: string | null;
}

export interface LicenseVerificationResult {
  isValid: boolean;
  licenseKey: string;
  status: string;
  tier: string;
  reason?: string;
  asset?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  issuedAt?: string;
  expiresAt?: string | null;
  seats: {
    maxActivations: number;
    activeCount: number;
    remaining: number;
  };
  isDomainActivated: boolean;
  activeDomains: string[];
}

export interface LicenseActivationResult {
  success: boolean;
  message: string;
  domain?: string;
  activeCount?: number;
  maxActivations?: number;
  activatedAt?: string;
}

export interface LicenseActivationItem {
  id: string;
  domain_or_machine_id: string;
  activated_at: string;
}

export interface LicenseFileItem {
  id: string;
  version: string;
  file_name: string;
  file_size_bytes?: number;
}

export interface BuyerLicenseItem {
  id: string;
  license_key: string;
  asset_id: string;
  buyer_id: string;
  tier: "personal" | "commercial" | "extended";
  status: "active" | "suspended" | "revoked" | "expired";
  max_activations: number;
  activation_count?: number;
  issued_at: string;
  expires_at?: string | null;
  asset?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  activations?: LicenseActivationItem[];
  files?: LicenseFileItem[];
}

