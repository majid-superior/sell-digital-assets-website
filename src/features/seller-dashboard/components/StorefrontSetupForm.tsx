// src/features/seller-dashboard/components/StorefrontSetupForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Icons } from "../../../lib/icons/index.ts";
import { formatBytes } from "../../../utils/file.ts";
import type { DigitalAsset } from "../../../types/asset.ts";
import type { SellerStorefrontConfig, UpdateStorefrontPayload } from "../types.ts";
import {
  RESERVED_STOREFRONT_URLS,
  normalizeStorefrontUrl,
} from "../../../utils/slugValidator.ts";
import {
  BannerCropModal,
  BANNER_TARGET_WIDTH,
  BANNER_TARGET_HEIGHT,
} from "./BannerCropModal.tsx";

const MAX_BANNER_BYTES = 3 * 1024 * 1024; // 3 MB
const ALLOWED_BANNER_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

const storefrontSchema = z.object({
  url: z
    .string()
    .trim()
    .min(3, "Custom URL must be at least 3 characters (e.g., seller01)")
    .max(30, "Custom URL cannot exceed 30 characters")
    .regex(
      /^[a-z0-9][a-z0-9_-]*$/i,
      "Only letters, numbers, hyphens (-), and underscores (_) are allowed"
    )
    .refine(
      (val) => !RESERVED_STOREFRONT_URLS.has(normalizeStorefrontUrl(val)),
      "This URL name is reserved by the system. Please choose another."
    ),
  title: z
    .string()
    .trim()
    .min(3, "Storefront title must be at least 3 characters")
    .max(80, "Storefront title cannot exceed 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Provide a short description (at least 10 characters)")
    .max(600, "Description cannot exceed 600 characters"),
  bannerUrl: z
    .string()
    .trim()
    .min(
      1,
      "Please upload a storefront banner image (1200 × 400 px or 3:1 ratio, under 3 MB)"
    )
    .refine(
      (val) =>
        val.startsWith("data:image/") ||
        val.startsWith("blob:") ||
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("/"),
      "Please upload a valid storefront banner image"
    ),
  featuredAssetId: z.string(),
  isVisible: z.boolean(),
});

type StorefrontFormValues = z.infer<typeof storefrontSchema>;

export interface StorefrontSetupFormProps {
  initialData: SellerStorefrontConfig;
  publishedAssets: DigitalAsset[];
  isSaving: boolean;
  onSubmit: (payload: UpdateStorefrontPayload) => Promise<unknown>;
}

const formatAssetOptionPrice = (asset: DigitalAsset): string => {
  if (typeof asset.price === "number") {
    return (asset.price / 100).toFixed(2);
  }
  if (typeof asset.priceCents === "number") {
    return (asset.priceCents / 100).toFixed(2);
  }
  if (typeof asset.min_price === "number") {
    return asset.min_price.toFixed(2);
  }
  if (asset.tiers && asset.tiers.length > 0) {
    const firstPrice = Number(asset.tiers[0].price);
    if (Number.isFinite(firstPrice)) {
      return firstPrice.toFixed(2);
    }
  }
  return "0.00";
};

export const StorefrontSetupForm: React.FC<StorefrontSetupFormProps> = ({
  initialData,
  publishedAssets,
  isSaving,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawBannerSource, setRawBannerSource] = useState<string | null>(null);
  const [uploadedDimensions, setUploadedDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StorefrontFormValues>({
    resolver: zodResolver(storefrontSchema),
    defaultValues: {
      url: initialData.url || "", // Starts as ""
      title: initialData.title || "",
      description: initialData.description || "",
      bannerUrl: initialData.bannerUrl || "",
      featuredAssetId: initialData.featuredAssetId || "",
      isVisible: initialData.url ? initialData.isVisible : true,
    },
  });

  useEffect(() => {
    reset({
      url: initialData.url || "",
      title: initialData.title || "",
      description: initialData.description || "",
      bannerUrl: initialData.bannerUrl || "",
      featuredAssetId: initialData.featuredAssetId || "",
      isVisible: initialData.url ? initialData.isVisible : true,
    });
  }, [initialData, reset]);

  const rawWatchedUrl = useWatch({ control, name: "url" });
  const watchedBanner = useWatch({ control, name: "bannerUrl" });
  const watchedUrl = normalizeStorefrontUrl(rawWatchedUrl || "");

  const validateBannerFile = (file: File): boolean => {
    if (!file || file.size === 0) {
      toast.error("Empty File", {
        description: `"${file?.name || "Selected file"}" contains no data (0 bytes). Please choose a valid image.`,
      });
      return false;
    }

    const mimeType = file.type.toLowerCase();
    const hasValidExt = /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!ALLOWED_BANNER_MIME_TYPES.includes(mimeType) && !hasValidExt) {
      toast.error("Unsupported Image Format", {
        description: `"${file.name}" has an unsupported format (${file.type || "unknown"}). Please upload a PNG, JPG, or WebP banner image.`,
      });
      return false;
    }

    if (file.size > MAX_BANNER_BYTES) {
      toast.error("Banner Exceeds 3 MB Limit", {
        description: `"${file.name}" is ${formatBytes(file.size)}. Maximum allowed file size for storefront banners is 3 MB. Please compress the image or choose a smaller file.`,
      });
      return false;
    }

    return true;
  };

  const processSelectedBannerFile = (file: File) => {
    if (!validateBannerFile(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Failed to Read Image", {
        description: "Unable to read the selected banner file. Please try another image.",
      });
    };
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) return;

      const img = new Image();
      img.onerror = () => {
        toast.error("Invalid Image File", {
          description: "The selected file could not be decoded as a valid image.",
        });
      };
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setRawBannerSource(dataUrl);
        setUploadedDimensions({ width, height });
        setUploadedFileName(file.name);

        const isExactResolution =
          width === BANNER_TARGET_WIDTH && height === BANNER_TARGET_HEIGHT;

        if (isExactResolution) {
          setValue("bannerUrl", dataUrl, {
            shouldValidate: true,
            shouldDirty: true,
          });
          toast.success("Banner Uploaded", {
            description: `${file.name} (${width} × ${height} px, 3:1 ratio) applied to your storefront.`,
          });
        } else {
          // Resolution differs from 1200 x 400 -> automatically open the 3:1 cropper
          setCropModalOpen(true);
          toast.info("Crop Storefront Banner", {
            description: `Uploaded image is ${width} × ${height} px. Adjust the 1200 × 400 px (3:1 ratio) crop area to fit your storefront banner.`,
          });
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedBannerFile(file);
    }
  };

  const handleDropBanner = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedBannerFile(file);
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setValue("bannerUrl", croppedDataUrl, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setCropModalOpen(false);
    toast.success("Banner Cropped & Applied", {
      description:
        "Cropped banner (1200 × 400 px • 3:1 ratio) is ready for your storefront.",
    });
  };

  const handleRemoveBanner = () => {
    setValue("bannerUrl", "", { shouldValidate: true, shouldDirty: true });
    setRawBannerSource(null);
    setUploadedDimensions(null);
    setUploadedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormInvalid = (fieldErrors: FieldErrors<StorefrontFormValues>) => {
    const firstError =
      fieldErrors.url?.message ||
      fieldErrors.title?.message ||
      fieldErrors.description?.message ||
      fieldErrors.bannerUrl?.message ||
      fieldErrors.featuredAssetId?.message ||
      "Please check your storefront inputs and try again.";
    toast.error("Validation Error", { description: String(firstError) });
  };

  const handleFormSubmit = async (values: StorefrontFormValues) => {
    await onSubmit({
      url: normalizeStorefrontUrl(values.url),
      title: values.title.trim(),
      description: values.description.trim(),
      bannerUrl: values.bannerUrl.trim(),
      featuredAssetId: values.featuredAssetId || "",
      isVisible: values.isVisible,
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit, handleFormInvalid)}
        noValidate
        className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-6 md:p-8 space-y-6 shadow-xs"
      >
        {/* 1. Custom URL Slug */}
        <div className="space-y-2">
          <label htmlFor="url" className="block text-label-lg text-on-surface">
            Custom Storefront URL
          </label>
          <div
            className={`flex items-center rounded-lg border bg-surface-container-low overflow-hidden focus-within:ring-2 focus-within:ring-primary-container transition-colors duration-150 ${
              errors.url ? "border-error" : "border-outline-variant/60"
            }`}
          >
            <span className="px-3 sm:px-3.5 py-2.5 text-body-sm sm:text-body-md text-on-surface-variant bg-surface-container-high border-r border-outline-variant/40 select-none shrink-0">
              selldigitalassets.com/
            </span>
            <input
              id="url"
              type="text"
              placeholder="seller01"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={Boolean(errors.url)}
              aria-describedby="url-preview-hint"
              {...register("url")}
              className="w-full min-w-0 px-3 sm:px-3.5 py-2.5 bg-transparent text-body-md text-on-surface focus:outline-none"
            />
          </div>
          <p id="url-preview-hint" className="text-body-sm text-on-surface-variant break-all">
            Preview:{" "}
            <span className="font-semibold text-on-surface">
              https://selldigitalassets.com/{watchedUrl || "your-custom-url"}
            </span>
          </p>
        </div>

        {/* 2. Storefront Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-label-lg text-on-surface">
            Storefront Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g., PixelCraft Studio — UI Kits & Design Systems"
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors duration-150 ${
              errors.title ? "border-error" : "border-outline-variant/60"
            }`}
          />
        </div>

        {/* 3. Storefront Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-label-lg text-on-surface">
            Storefront Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Tell buyers about your digital assets, design tools, and commercial licenses..."
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
            className={`w-full px-4 py-2.5 rounded-lg border bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors duration-150 ${
              errors.description ? "border-error" : "border-outline-variant/60"
            }`}
          />
        </div>

        {/* 4. Storefront Banner Image Upload (1200 x 400 / 3:1 Ratio, < 3 MB, Auto-Crop) */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="banner-upload-input"
              className="block text-label-lg text-on-surface"
            >
              Storefront Banner Image
            </label>
            <span className="text-badge-caption px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
              1200 × 400 px • 3:1 Ratio • Max 3 MB
            </span>
          </div>

          {/* Hidden registered field for form state & validation */}
          <input type="hidden" {...register("bannerUrl")} />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="banner-upload-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-invalid={Boolean(errors.bannerUrl)}
            aria-describedby="banner-upload-instructions"
            onChange={handleBannerFileChange}
            className="sr-only"
          />

          {/* Upload Dropzone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOver(false);
            }}
            onDrop={handleDropBanner}
            className={`rounded-xl border-2 border-dashed p-5 sm:p-6 text-center transition-colors duration-150 cursor-pointer ${
              errors.bannerUrl
                ? "border-error bg-error-container/10"
                : isDragOver
                ? "border-primary-container bg-primary-container/10"
                : "border-outline-variant/60 bg-surface-container-low hover:border-primary-container/70 hover:bg-surface-container"
            }`}
          >
            <div className="mx-auto w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center mb-3 text-primary">
              <Icons.UploadCloud size={22} />
            </div>
            <p className="text-label-lg text-on-surface">
              Click to upload banner or drag and drop
            </p>
            <p
              id="banner-upload-instructions"
              className="mt-1 text-body-sm text-on-surface-variant max-w-xl mx-auto"
            >
              Upload a banner with <strong className="text-on-surface">1200 × 400</strong>{" "}
              resolution (<strong className="text-on-surface">3:1 aspect ratio</strong>) and
              file size <strong className="text-on-surface">less than 3 MB</strong> (PNG, JPG,
              or WebP). If your image has a different resolution, the image cropper will open
              automatically.
            </p>
          </div>

          {/* Live Cropped / Uploaded Banner Preview */}
          {watchedBanner && (
            <div className="rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/40">
              <div className="relative aspect-3/1 w-full bg-surface-container-high overflow-hidden">
                <img
                  src={watchedBanner}
                  alt="Storefront Banner Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/70 text-white text-badge-caption">
                  1200 × 400 px (3:1 Banner Preview)
                </span>
              </div>

              <div className="p-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/30">
                <span className="text-body-sm text-on-surface-variant truncate">
                  {uploadedFileName
                    ? `Selected: ${uploadedFileName}`
                    : "Active Storefront Banner"}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!rawBannerSource) {
                        setRawBannerSource(watchedBanner);
                      }
                      setCropModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-medium hover:bg-surface-container-highest transition-colors duration-150 cursor-pointer"
                  >
                    <Icons.Edit size={14} />
                    <span>Crop Banner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-medium hover:bg-surface-container-highest transition-colors duration-150 cursor-pointer"
                  >
                    <Icons.Upload size={14} />
                    <span>Change</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-body-sm font-medium hover:opacity-90 transition-colors duration-150 cursor-pointer"
                  >
                    <Icons.Trash2 size={14} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Featured Asset Selection */}
        <div className="space-y-2">
          <label htmlFor="featuredAssetId" className="block text-label-lg text-on-surface">
            Featured Digital Asset
          </label>
          <select
            id="featuredAssetId"
            aria-describedby="featured-asset-hint"
            {...register("featuredAssetId")}
            className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/60 bg-surface-container-low text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container transition-colors duration-150"
          >
            <option value="">— No Featured Asset Selected —</option>
            {publishedAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.title} (${formatAssetOptionPrice(asset)})
              </option>
            ))}
          </select>
          <p id="featured-asset-hint" className="text-body-sm text-on-surface-variant">
            The featured asset is spotlighted at the top of your custom storefront page.
          </p>
        </div>

        {/* 6. Storefront Visibility Toggle */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label
              htmlFor="isVisible"
              className="block text-label-lg text-on-surface cursor-pointer"
            >
              Make Storefront Publicly Visible
            </label>
            <span className="block text-body-sm text-on-surface-variant wrap-break-word">
              When enabled and saved, your storefront is live at selldigitalassets.com/
              {watchedUrl || "seller01"}.
            </span>
          </div>
          <input
            id="isVisible"
            type="checkbox"
            {...register("isVisible")}
            className="h-5 w-5 accent-primary-container rounded cursor-pointer shrink-0"
          />
        </div>

        {/* Submit Trigger */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-semibold text-label-lg hover:opacity-95 disabled:opacity-50 transition-colors duration-150 cursor-pointer w-full sm:w-auto"
          >
            {isSaving ? (
              <Icons.RotateCcw size={18} className="animate-spin" />
            ) : (
              <Icons.Store size={18} />
            )}
            <span>{isSaving ? "Saving Storefront..." : "Save & Publish Storefront"}</span>
          </button>
        </div>
      </form>

      {/* Auto-opened 1200 x 400 (3:1) Banner Crop Modal */}
      <BannerCropModal
        isOpen={cropModalOpen}
        imageSrc={rawBannerSource || watchedBanner || null}
        originalDimensions={uploadedDimensions}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};
