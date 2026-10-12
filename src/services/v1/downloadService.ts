// src/services/v1/downloadService.ts
import { apiClient } from "@/services/api.ts";

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
   * Trigger direct browser download stream using an anchor element.
   */
  downloadFile(downloadUrl: string, fileName?: string): void {
    const link = document.createElement("a");
    link.href = downloadUrl;
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

