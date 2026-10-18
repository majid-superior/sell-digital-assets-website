// src/services/v1/downloadService.ts
import { apiClient } from "@/services/api.ts";
import { resolveStorageUrl } from "@/utils/media.ts";

export interface GenerateDownloadLinkPayload {
  buyerId?: string;
  licenseKey?: string;
  fileId?: string;
}

export interface DownloadLinkResult {
  downloadUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  version?: string;
  expiresInSeconds?: number;
  expiresAt?: string;
  verifiedLicenseKey?: string;
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

class DownloadService {
  /**
   * Request a time-limited signed direct download link for an asset deliverable.
   */
  async generateDownloadLink(
    assetId: string,
    payload?: GenerateDownloadLinkPayload
  ): Promise<DownloadLinkResult> {
    const res = await apiClient.post<ApiResponseEnvelope<DownloadLinkResult>>(
      `/api/v1/downloads/${encodeURIComponent(assetId)}/generate-link`,
      payload || {}
    );
    return res.data;
  }

  /**
   * Request an authenticated buyer download link from the private bucket (GET /api/assets/:id/download).
   * Verifies purchase ownership or admin privileges and generates a short-lived 60-second signed URL.
   */
  async downloadAsset(assetId: string): Promise<{ downloadUrl: string; fileName?: string }> {
    const res = await apiClient.get<ApiResponseEnvelope<{ downloadUrl: string; fileName?: string }> | { downloadUrl: string; fileName?: string }>(
      `/api/assets/${encodeURIComponent(assetId)}/download`
    );
    if ("data" in res && res.data && "downloadUrl" in res.data) {
      return res.data;
    }
    if ("downloadUrl" in res) {
      return res as { downloadUrl: string; fileName?: string };
    }
    throw new Error("Invalid response format received from download service");
  }

  /**
   * Trigger direct browser download stream using an anchor element.
   */
  downloadFile(downloadUrl: string, fileName?: string): void {
    const resolvedUrl = resolveStorageUrl(downloadUrl);
    const link = document.createElement("a");
    link.href = resolvedUrl;
    if (fileName) {
      link.setAttribute("download", fileName);
    }
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const downloadService = new DownloadService();
export default downloadService;

