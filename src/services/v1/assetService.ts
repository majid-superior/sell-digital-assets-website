// src/services/v1/assetService.ts
import { apiClient } from "@/services/api.ts";
import { resolveStorageUrl } from "@/utils/media.ts";
import type {
  DigitalAsset,
  AssetFile,
  AssetMedia,
  AssetListResponse,
  AssetStatus,
  TierType,
  MediaType,
} from "@/types/asset.ts";

export interface AssetFilterParams {
  category?: number | string;
  categorySlug?: string;
  search?: string;
  q?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: "popular" | "newest" | "price_asc" | "price_desc";
  limit?: number;
  page?: number;
  tags?: string[];
}

export interface SellerAssetQueryParams {
  status?: AssetStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SellerAssetStats {
  totalAssets: number;
  publishedAssets: number;
  pendingAssets?: number;
  needsUpdateAssets?: number;
  rejectedAssets?: number;
  draftAssets: number;
  archivedAssets: number;
  totalViews: number;
  totalDownloads: number;
}

export interface SellerAssetListResponse {
  items: DigitalAsset[];
  stats?: SellerAssetStats;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LicenseTierConfig {
  tier_type: TierType;
  name: string;
  default_price: number;
  description: string;
  license_terms_summary: string;
  max_activations: number;
  display_order: number;
  is_active: boolean;
}

export interface CreateAssetTierInput {
  tierType: TierType;
  price: number;
  licenseTermsSummary?: string;
}

export interface CreateAssetInput {
  categoryId: number;
  title: string;
  slug?: string;
  shortDescription: string;
  fullDescription?: string | null;
  tags?: string[];
  technicalSpecs?: Record<string, unknown>;
  tiers: CreateAssetTierInput[];
}

export interface UpdateAssetInput {
  categoryId?: number;
  title?: string;
  slug?: string;
  shortDescription?: string;
  fullDescription?: string | null;
  tags?: string[];
  technicalSpecs?: Record<string, unknown>;
  tiers?: CreateAssetTierInput[];
}

export interface PresignFileUploadPayload {
  fileName: string;
  contentType?: string;
  version?: string;
  fileSizeBytes?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  method: string;
  expiresInSeconds: number;
  previewUrl?: string;
}

export interface ConfirmFileUploadPayload {
  storageKey: string;
  fileName: string;
  version?: string;
  fileSizeBytes?: number;
  fileChecksumSha256?: string;
  manifestTree?: unknown[];
}

export interface PresignMediaUploadPayload {
  fileName: string;
  contentType: string;
  mediaType: MediaType;
  displayOrder?: number;
}

export interface ConfirmMediaUploadPayload {
  storageKey: string;
  mediaType: MediaType;
  displayOrder?: number;
}

export interface CategoryTaxonomyNode {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: number | null;
  children?: CategoryTaxonomyNode[];
  assetCount?: number;
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: SellerAssetStats;
}

class AssetService {
  /**
   * Fetch paginated and filtered digital asset catalog for public discovery.
   */
  async getAssets(params?: AssetFilterParams): Promise<AssetListResponse> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.category !== undefined) cleanParams.category = params.category;
      if (params.categorySlug) cleanParams.categorySlug = params.categorySlug;
      if (params.search) cleanParams.search = params.search;
      else if (params.q) cleanParams.search = params.q;
      if (params.priceMin !== undefined) cleanParams.priceMin = params.priceMin;
      if (params.priceMax !== undefined) cleanParams.priceMax = params.priceMax;
      if (params.sort) cleanParams.sort = params.sort;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.page !== undefined) cleanParams.page = params.page;
    }

    const res = await apiClient.get<ApiResponseEnvelope<DigitalAsset[]> | DigitalAsset[]>(
      "/api/v1/assets",
      { params: cleanParams }
    );

    if (Array.isArray(res)) {
      return {
        items: res,
        total: res.length,
        page: Number(params?.page || 1),
        limit: Number(params?.limit || 12),
        totalPages: 1,
      };
    }

    const envelope = res;
    const items = envelope.data || [];
    const pagination = envelope.pagination || {
      total: items.length,
      page: Number(params?.page || 1),
      limit: Number(params?.limit || 12),
      totalPages: 1,
    };

    return {
      items,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  /**
   * Retrieve single digital asset by unique URL slug.
   */
  async getAssetBySlug(slug: string): Promise<DigitalAsset> {
    const res = await apiClient.get<ApiResponseEnvelope<DigitalAsset> | DigitalAsset>(
      `/api/v1/assets/${encodeURIComponent(slug)}`
    );
    if ("data" in res && res.data) {
      return res.data;
    }
    return res as DigitalAsset;
  }

  /**
   * Retrieve single digital asset by ID or unique identifier.
   * Uses the authenticated seller endpoint first so draft, pending, needs_update, and rejected assets load in edit mode.
   */
  async getAssetById(id: string): Promise<DigitalAsset> {
    try {
      const sellerRes = await apiClient.get<ApiResponseEnvelope<DigitalAsset> | DigitalAsset>(
        `/api/v1/assets/seller/${encodeURIComponent(id)}`
      );
      if ("data" in sellerRes && sellerRes.data) {
        return sellerRes.data;
      }
      return sellerRes as DigitalAsset;
    } catch {
      const res = await apiClient.get<ApiResponseEnvelope<DigitalAsset> | DigitalAsset>(
        `/api/v1/assets/${encodeURIComponent(id)}`
      );
      if ("data" in res && res.data) {
        return res.data;
      }
      return res as DigitalAsset;
    }
  }

  /**
   * Retrieve category taxonomy hierarchy.
   */
  async getCategoryTaxonomy(): Promise<CategoryTaxonomyNode[]> {
    const res = await apiClient.get<ApiResponseEnvelope<CategoryTaxonomyNode[]> | CategoryTaxonomyNode[]>(
      "/api/v1/assets/categories"
    );
    if (!Array.isArray(res) && "data" in res && res.data) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  }

  /**
   * Retrieve curated featured assets for homepage showcase.
   */
  async getFeaturedAssets(): Promise<DigitalAsset[]> {
    const res = await apiClient.get<ApiResponseEnvelope<DigitalAsset[]> | DigitalAsset[]>(
      "/api/v1/assets/featured"
    );
    if (!Array.isArray(res) && "data" in res && res.data) {
      return res.data;
    }
    return Array.isArray(res) ? res : [];
  }

  /**
   * Get authenticated seller's assets and performance stats.
   */
  async getSellerAssets(params?: SellerAssetQueryParams): Promise<SellerAssetListResponse> {
    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      if (params.status) cleanParams.status = params.status;
      if (params.search) cleanParams.search = params.search;
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
    }

    const res = await apiClient.get<ApiResponseEnvelope<DigitalAsset[]>>(
      "/api/v1/assets/seller",
      { params: cleanParams }
    );

    const items = res.data || [];
    const pagination = res.pagination || {
      total: items.length,
      page: Number(params?.page || 1),
      limit: Number(params?.limit || 20),
      totalPages: 1,
    };

    return {
      items,
      stats: res.stats,
      pagination,
    };
  }

  /**
   * Create a new draft asset (Seller role required).
   */
  async createDraftAsset(data: CreateAssetInput): Promise<DigitalAsset> {
    const res = await apiClient.post<ApiResponseEnvelope<DigitalAsset>>(
      "/api/v1/assets/seller",
      data
    );
    return res.data || (res as unknown as DigitalAsset);
  }

  /**
   * Update existing asset details (Seller role required).
   */
  async updateAsset(id: string, data: UpdateAssetInput): Promise<DigitalAsset> {
    const res = await apiClient.patch<ApiResponseEnvelope<DigitalAsset>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}`,
      data
    );
    return res.data || (res as unknown as DigitalAsset);
  }

  /**
   * Transition asset status (draft ↔ pending ↔ archived) with optional seller reply/revision notes.
   */
  async updateAssetStatus(
    id: string,
    status: AssetStatus,
    feedback?: string
  ): Promise<DigitalAsset> {
    const payload: { status: AssetStatus; feedback?: string } = { status };
    if (feedback && feedback.trim()) {
      payload.feedback = feedback.trim();
    }
    const res = await apiClient.post<ApiResponseEnvelope<DigitalAsset>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}/status`,
      payload
    );
    return res.data || (res as unknown as DigitalAsset);
  }

  /**
   * Soft-delete and archive an asset.
   */
  async deleteAsset(id: string): Promise<{ id: string; deleted: boolean }> {
    const res = await apiClient.delete<ApiResponseEnvelope<{ id: string; deleted: boolean }>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}`
    );
    return res.data || (res as unknown as { id: string; deleted: boolean });
  }

  /**
   * Phase 1 Deliverable Upload: Request a time-limited signed URL for binary ZIP upload.
   */
  async presignFileUpload(
    id: string,
    payload: PresignFileUploadPayload
  ): Promise<PresignedUploadResult> {
    const res = await apiClient.post<ApiResponseEnvelope<PresignedUploadResult>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}/files/presign-upload`,
      payload
    );
    return res.data;
  }

  /**
   * Phase 2 Deliverable Upload: Stream binary file directly to storage endpoint with progress.
   */
  uploadBinary(
    uploadUrl: string,
    file: File | Blob,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const targetUrl = resolveStorageUrl(uploadUrl);
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", targetUrl);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          // Parse server response or provide clear, human-understandable status explanation
          let humanMessage = "";
          const text = xhr.responseText?.trim();
          if (text) {
            try {
              const parsed = JSON.parse(text) as Record<string, unknown>;
              if (typeof parsed.message === "string" && parsed.message.trim()) {
                humanMessage = parsed.message.trim();
              } else if (typeof parsed.error === "string" && parsed.error.trim()) {
                humanMessage = parsed.error.trim();
              }
            } catch {
              // Not JSON
            }

            if (!humanMessage) {
              const xmlMatch = text.match(/<Message>([^<]+)<\/Message>/i);
              if (xmlMatch?.[1]) {
                humanMessage = xmlMatch[1].trim();
              }
            }
          }

          if (!humanMessage) {
            switch (xhr.status) {
              case 413:
                humanMessage = "The file is too large and exceeds the storage upload limit (HTTP 413 Payload Too Large). Please choose a smaller file or compress it.";
                break;
              case 400:
                humanMessage = "The upload request was invalid or rejected by the storage server. Please verify the file format.";
                break;
              case 401:
                humanMessage = "Your session has expired. Please sign in again to upload files.";
                break;
              case 403:
                humanMessage = "Upload authorization token has expired or is invalid. Please refresh the page and try again.";
                break;
              case 404:
                humanMessage = "The upload storage endpoint was not found.";
                break;
              case 415:
                humanMessage = "The server rejected this file format as unsupported.";
                break;
              case 429:
                humanMessage = "Too many upload requests. Please wait a moment before trying again.";
                break;
              case 500:
              case 502:
              case 503:
              case 504:
                humanMessage = "The storage server encountered a temporary error. Please try uploading again in a few moments.";
                break;
              default:
                humanMessage = `Upload failed (Server responded with HTTP status ${xhr.status}${xhr.statusText ? `: ${xhr.statusText}` : ""}).`;
                break;
            }
          }

          reject(new Error(humanMessage));
        }
      };

      xhr.onerror = () =>
        reject(
          new Error(
            "Network connection error: Unable to connect to the upload storage server. Please check your internet connection."
          )
        );
      xhr.onabort = () => reject(new Error("File upload was cancelled."));

      xhr.send(file);
    });
  }

  /**
   * Phase 3 Deliverable Upload: Confirm upload completion and record asset file version.
   */
  async confirmFileUpload(
    id: string,
    payload: ConfirmFileUploadPayload
  ): Promise<AssetFile> {
    const res = await apiClient.post<ApiResponseEnvelope<AssetFile>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}/files/confirm`,
      payload
    );
    return res.data;
  }

  /**
   * Presign media upload (thumbnail, screenshot, preview video/audio).
   */
  async presignMediaUpload(
    id: string,
    payload: PresignMediaUploadPayload
  ): Promise<PresignedUploadResult> {
    const res = await apiClient.post<ApiResponseEnvelope<PresignedUploadResult>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}/media/presign-upload`,
      payload
    );
    return res.data;
  }

  /**
   * Confirm media upload and save showcase preview entry.
   */
  async confirmMediaUpload(
    id: string,
    payload: ConfirmMediaUploadPayload
  ): Promise<AssetMedia> {
    const res = await apiClient.post<ApiResponseEnvelope<AssetMedia>>(
      `/api/v1/assets/seller/${encodeURIComponent(id)}/media/confirm`,
      payload
    );
    return res.data;
  }

  /**
   * Delete uploaded media showcase item.
   */
  async deleteMedia(
    assetId: string,
    mediaId: string
  ): Promise<{ id: string; deleted: boolean }> {
    const res = await apiClient.delete<ApiResponseEnvelope<{ id: string; deleted: boolean }>>(
      `/api/v1/assets/seller/${encodeURIComponent(assetId)}/media/${encodeURIComponent(mediaId)}`
    );
    return res.data;
  }

  /**
   * Fetch default licensing tiers configured in the marketplace database.
   */
  async getLicenseTiers(): Promise<LicenseTierConfig[]> {
    const res = await apiClient.get<ApiResponseEnvelope<LicenseTierConfig[]>>(
      "/api/v1/licenses/tiers"
    );
    return res.data || [];
  }
}

export const assetService = new AssetService();
export default assetService;
