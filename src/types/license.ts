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

