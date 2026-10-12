// src/services/v1/licenseService.ts
import { apiClient } from "@/services/api.ts";
import type {
  LicenseEntity,
  LicenseVerificationResult,
  LicenseActivationResult,
} from "@/types/license.ts";
import type { TierType } from "@/types/asset.ts";

export interface VerifyLicensePayload {
  licenseKey: string;
  domainOrMachineId?: string;
}

export interface ActivateLicensePayload {
  licenseKey: string;
  domainOrMachineId: string;
}

export interface IssueLicensePayload {
  assetId: string;
  buyerId: string;
  tier: TierType;
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

class LicenseService {
  /**
   * Verify license validity, expiration, tier restrictions, and active domain/seat counts.
   */
  async verifyLicense(
    licenseKey: string,
    domainOrMachineId?: string
  ): Promise<LicenseVerificationResult> {
    const res = await apiClient.post<ApiResponseEnvelope<LicenseVerificationResult>>(
      "/api/v1/licenses/verify",
      {
        licenseKey: licenseKey.trim(),
        domainOrMachineId: domainOrMachineId?.trim() || undefined,
      }
    );
    return res.data;
  }

  /**
   * Bind domain, client IP, or machine ID to an active license seat.
   */
  async activateLicense(
    licenseKey: string,
    domainOrMachineId: string
  ): Promise<LicenseActivationResult> {
    const res = await apiClient.post<ApiResponseEnvelope<LicenseActivationResult>>(
      "/api/v1/licenses/activate",
      {
        licenseKey: licenseKey.trim(),
        domainOrMachineId: domainOrMachineId.trim(),
      }
    );
    return res.data;
  }

  /**
   * Issue a cryptographic license key (useful for checkout fulfillment or testing).
   */
  async issueTestLicense(
    assetId: string,
    buyerId: string,
    tier: TierType = "personal"
  ): Promise<LicenseEntity> {
    const res = await apiClient.post<ApiResponseEnvelope<LicenseEntity>>(
      "/api/v1/licenses/issue",
      {
        assetId,
        buyerId,
        tier,
      }
    );
    return res.data;
  }
}

export const licenseService = new LicenseService();
export default licenseService;

