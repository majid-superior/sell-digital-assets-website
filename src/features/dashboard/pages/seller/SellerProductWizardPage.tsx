// src/features/dashboard/pages/seller/SellerProductWizardPage.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { useCategoryTaxonomy } from "@/hooks/useCategoryTaxonomy.ts";
import { formatCurrency, getCurrencyInfo } from "@/utils/currency.ts";
import { formatBytes } from "@/utils/file.ts";
import { resolveMediaUrl } from "@/utils/media.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";
import { Icons } from "@/lib/icons/index.ts";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Input,
    Label,
    Badge,
} from "@/components/ui/index.ts";
import { Spinner } from "@/components/ui/Spinner.tsx";
import type { TierType, AssetMedia, AssetFile, DigitalAsset } from "@/types/asset.ts";

const basicInfoSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(180),
    categoryId: z.number().int().positive("Please select a category"),
    shortDescription: z.string().trim().min(10, "Short description must be at least 10 characters").max(450),
    fullDescription: z.string().trim().optional().or(z.literal("")),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

type WizardStep = "info" | "tiers_specs" | "deliverables" | "media" | "review";

interface SellerProductWizardFormProps {
    initialAsset: DigitalAsset | null;
    isEditMode: boolean;
}

const SellerProductWizardForm: React.FC<SellerProductWizardFormProps> = ({
    initialAsset,
    isEditMode,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const currencyInfo = getCurrencyInfo();

    const isMediaRoute = location.pathname.includes("/products/upload/media");
    const [stepOverride, setStepOverride] = useState<WizardStep | null>(null);
    const [prevPathname, setPrevPathname] = useState(location.pathname);

    // If the URL changes (e.g. sidebar navigation or browser Back/Forward), reset stepOverride
    if (location.pathname !== prevPathname) {
        setPrevPathname(location.pathname);
        setStepOverride(null);
    }

    const currentStep: WizardStep = stepOverride ?? (isMediaRoute ? "media" : "info");
    const setCurrentStep = (step: WizardStep) => setStepOverride(step);

    const [assetId, setAssetId] = useState<string | null>(() => initialAsset?.id || null);
    const [activeAsset, setActiveAsset] = useState<DigitalAsset | null>(() => initialAsset || null);
    const [sellerFeedback, setSellerFeedback] = useState<string>(
        () => initialAsset?.seller_feedback || ""
    );

    // Tags state
    const [tags, setTags] = useState<string[]>(() => initialAsset?.tags || []);
    const [tagInput, setTagInput] = useState("");

    // Technical specs state
    const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(() => {
        if (initialAsset?.technical_specs && typeof initialAsset.technical_specs === "object") {
            return Object.entries(initialAsset.technical_specs).map(([key, value]) => ({
                key,
                value: String(value),
            }));
        }
        return [];
    });
    const [newSpecKey, setNewSpecKey] = useState("");
    const [newSpecValue, setNewSpecValue] = useState("");

    // Query database license tiers for marketplace standard configurations
    const { data: dbLicenseTiers } = useQuery({
        queryKey: ["license-tiers", "all"],
        queryFn: () => assetService.getLicenseTiers(),
        staleTime: 1000 * 60 * 10,
    });

    // Custom tier prices edited by seller
    const [tierPriceOverrides, setTierPriceOverrides] = useState<Partial<Record<TierType, number>>>(() => {
        if (initialAsset?.tiers && Array.isArray(initialAsset.tiers) && initialAsset.tiers.length > 0) {
            const map: Partial<Record<TierType, number>> = {};
            for (const t of initialAsset.tiers) {
                map[t.tier_type] = Number(t.price);
            }
            return map;
        }
        return {};
    });

    const defaultTierConfigs: Array<{ tierType: TierType; name: string; defaultPrice: number; licenseTermsSummary: string }> = [
        { tierType: "personal", name: "Personal License", defaultPrice: 9, licenseTermsSummary: "Single personal non-commercial project" },
        { tierType: "commercial", name: "Commercial License", defaultPrice: 19, licenseTermsSummary: "Up to 5 commercial applications" },
        { tierType: "extended", name: "Extended License", defaultPrice: 39, licenseTermsSummary: "Unlimited SaaS projects & resale permission" },
    ];

    // Compute effective tiers: database defaults merged with any seller price overrides
    const tiers = defaultTierConfigs.map((cfg) => {
        const dbTier = dbLicenseTiers?.find((d) => d.tier_type === cfg.tierType);
        const name = dbTier?.name || cfg.name;
        const defaultPrice = dbTier ? Number(dbTier.default_price) : cfg.defaultPrice;
        const price = tierPriceOverrides[cfg.tierType] !== undefined ? tierPriceOverrides[cfg.tierType]! : defaultPrice;
        const licenseTermsSummary = dbTier?.license_terms_summary || cfg.licenseTermsSummary;
        return {
            tierType: cfg.tierType,
            name,
            price,
            licenseTermsSummary,
        };
    });

    // Deliverable upload state
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [deliverableVersion, setDeliverableVersion] = useState("1.0.0");
    const [deliverableUploadProgress, setDeliverableUploadProgress] = useState<number | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<AssetFile[]>(() => initialAsset?.files || []);
    const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);

    // Media upload state - SEPARATE states for thumbnail vs screenshots (parallel uploading)
    const [mediaList, setMediaList] = useState<AssetMedia[]>(() => initialAsset?.media || []);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState<number | null>(null);

    const [activeScreenshotUploads, setActiveScreenshotUploads] = useState<
        Array<{ id: string; fileName: string; progress: number }>
    >([]);
    const blobUrlsRef = useRef<Set<string>>(new Set());

    // Cleanup any pending object URLs on unmount to prevent memory leaks
    useEffect(() => {
        const urls = blobUrlsRef.current;
        return () => {
            urls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
            urls.clear();
        };
    }, []);

    // Fetch category taxonomy for dropdown
    const { categories } = useCategoryTaxonomy();

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<BasicInfoFormData>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            title: initialAsset?.title || "",
            categoryId: initialAsset?.category_id || categories[0]?.id || 1,
            shortDescription: initialAsset?.short_description || "",
            fullDescription: initialAsset?.full_description || "",
        },
    });

    const onBasicInfoInvalid = (formErrors: typeof errors) => {
        const firstKey = Object.keys(formErrors)[0] as keyof typeof formErrors;
        const firstMessage = formErrors[firstKey]?.message || "Please fill in all required fields.";
        toast.error("Validation Error", { description: String(firstMessage) });
    };

    // Populate default category when categories load (new product mode)
    useEffect(() => {
        if (!isEditMode && categories.length > 0 && !getValues("categoryId")) {
            setValue("categoryId", categories[0].id);
        }
    }, [isEditMode, categories, setValue, getValues]);

    // Add Tag
    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const trimmed = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
            if (trimmed && !tags.includes(trimmed)) {
                setTags([...tags, trimmed]);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    // Add Spec
    const handleAddSpec = () => {
        if (newSpecKey.trim() && newSpecValue.trim()) {
            setSpecs([...specs, { key: newSpecKey.trim(), value: newSpecValue.trim() }]);
            setNewSpecKey("");
            setNewSpecValue("");
        }
    };

    const handleRemoveSpec = (index: number) => {
        setSpecs(specs.filter((_, i) => i !== index));
    };

    // Update Tier Price (only price is editable by seller)
    const handleUpdateTierPrice = (tierType: TierType, newPrice: number) => {
        setTierPriceOverrides((prev) => ({ ...prev, [tierType]: Math.max(0, newPrice) }));
    };

    // Save Basic Info & Create Draft Asset in PostgreSQL
    const handleSaveBasicAndAdvance = async (data: BasicInfoFormData) => {
        try {
            const technicalSpecsObj: Record<string, unknown> = {};
            for (const s of specs) {
                technicalSpecsObj[s.key] = s.value;
            }

            const fullDescClean = data.fullDescription ? data.fullDescription.trim() : null;

            if (!assetId) {
                // Phase 1 Creation: Create draft asset
                const created = await assetService.createDraftAsset({
                    categoryId: data.categoryId,
                    title: data.title,
                    shortDescription: data.shortDescription,
                    fullDescription: fullDescClean,
                    tags,
                    technicalSpecs: technicalSpecsObj,
                    tiers: tiers.map((t) => ({
                        tierType: t.tierType,
                        price: t.price,
                        licenseTermsSummary: t.licenseTermsSummary,
                    })),
                });

                setAssetId(created.id);
                setActiveAsset(created);
                toast.success("Draft Asset Created", { description: `Saved as draft (${created.title})` });
                void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            } else {
                // Update existing draft asset
                const updated = await assetService.updateAsset(assetId, {
                    categoryId: data.categoryId,
                    title: data.title,
                    shortDescription: data.shortDescription,
                    fullDescription: fullDescClean,
                    tags,
                    technicalSpecs: technicalSpecsObj,
                    tiers: tiers.map((t) => ({
                        tierType: t.tierType,
                        price: t.price,
                        licenseTermsSummary: t.licenseTermsSummary,
                    })),
                });
                setActiveAsset(updated);
                toast.success("Asset Draft Updated");
                void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            }

            setCurrentStep("tiers_specs");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save asset details";
            toast.error("Validation Error", { description: msg });
        }
    };

    const [isSavingStep2, setIsSavingStep2] = useState(false);

    // Save Pricing Tiers and Technical Specs & Advance to Deliverables
    const handleSaveStep2AndAdvance = async () => {
        if (!assetId) {
            toast.error("Invalid State", { description: "Please complete Step 1 details first." });
            setCurrentStep("info");
            return;
        }

        try {
            setIsSavingStep2(true);
            const technicalSpecsObj: Record<string, unknown> = {};
            for (const s of specs) {
                technicalSpecsObj[s.key] = s.value;
            }

            const updated = await assetService.updateAsset(assetId, {
                technicalSpecs: technicalSpecsObj,
                tiers: tiers.map((t) => ({
                    tierType: t.tierType,
                    price: t.price,
                    licenseTermsSummary: t.licenseTermsSummary,
                })),
            });

            setActiveAsset(updated);
            toast.success("Pricing & Specs Saved", { description: "Pricing tiers and technical specifications updated successfully." });
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            setCurrentStep("deliverables");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save pricing and technical specifications";
            toast.error("Save Failed", { description: msg });
        } finally {
            setIsSavingStep2(false);
        }
    };

    // Deliverable File Upload (Direct upload when browsed or dropped)
    const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10MB
    const ALLOWED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"];

    const validateMediaFile = (file: File, label: "thumbnail" | "screenshot"): boolean => {
        if (!file || file.size === 0) {
            toast.error("Empty File", {
                description: `"${file?.name || "Selected file"}" contains no data (0 bytes). Please choose a valid image.`
            });
            return false;
        }

        const fileType = file.type.toLowerCase();
        const hasValidExt = /\.(png|jpe?g|webp)$/i.test(file.name);
        if (!ALLOWED_MEDIA_TYPES.includes(fileType) && !hasValidExt) {
            toast.error("Unsupported Image Format", {
                description: `"${file.name}" has an unsupported format (${file.type || "unknown"}). Only PNG, JPG, and WebP images are allowed for ${label}s.`
            });
            return false;
        }

        if (file.size > MAX_MEDIA_BYTES) {
            const actualMb = (file.size / (1024 * 1024)).toFixed(1);
            toast.error("Image Exceeds 10MB Limit", {
                description: `"${file.name}" is ${actualMb} MB. Maximum allowed size for product ${label}s is 10 MB. Please compress the image or choose a smaller file.`
            });
            return false;
        }

        return true;
    };

    const handleUploadDeliverable = async (fileToUpload?: File) => {
        const file = fileToUpload || deliverableFile;
        if (!assetId) {
            toast.error("Save basic asset details first", { description: "Please complete Step 1 before uploading files." });
            return;
        }
        if (!file) {
            toast.error("Please select a deliverable file to upload");
            return;
        }

        if (file.size > 500 * 1024 * 1024) {
            const actualMb = (file.size / (1024 * 1024)).toFixed(1);
            toast.error("Deliverable Package Too Large", {
                description: `"${file.name}" is ${actualMb} MB. The maximum allowed deliverable size is 500 MB. Please compress or split the archive.`
            });
            return;
        }

        try {
            setIsUploadingDeliverable(true);
            setDeliverableUploadProgress(0);
            setDeliverableFile(file);

            toast.loading("Generating upload authorization...", { id: "deliverable-upload" });
            const presigned = await assetService.presignFileUpload(assetId, {
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
                version: deliverableVersion,
                fileSizeBytes: file.size,
            });

            toast.loading("Uploading deliverable package...", { id: "deliverable-upload" });
            await assetService.uploadBinary(presigned.uploadUrl, file, (percent) => {
                setDeliverableUploadProgress(percent);
            });

            toast.loading("Confirming file version in database...", { id: "deliverable-upload" });
            const confirmed = await assetService.confirmFileUpload(assetId, {
                storageKey: presigned.storageKey,
                fileName: file.name,
                version: deliverableVersion,
                fileSizeBytes: file.size,
            });

            setUploadedFiles((prev) => [...prev, confirmed]);
            toast.success("Deliverable Uploaded Successfully!", {
                id: "deliverable-upload",
                description: `${confirmed.file_name} attached to v${confirmed.version}`,
            });
            setDeliverableFile(null);
        } catch (err) {
            const msg = getHumanErrorMessage(err, "Deliverable upload failed");
            toast.error("Deliverable Upload Error", { id: "deliverable-upload", description: msg });
        } finally {
            setIsUploadingDeliverable(false);
            setDeliverableUploadProgress(null);
        }
    };

    // Dedicated Thumbnail Upload (Independent of Screenshots)
    const handleUploadThumbnail = async (file: File) => {
        if (!assetId) {
            toast.error("Save basic asset details first", { description: "Please complete Step 1 before uploading media." });
            return;
        }

        if (!validateMediaFile(file, "thumbnail")) {
            return;
        }

        const localPreviewUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(localPreviewUrl);
        const toastId = "thumbnail-upload";

        try {
            setIsUploadingThumbnail(true);
            setThumbnailUploadProgress(0);

            toast.loading("Requesting thumbnail upload authorization...", { id: toastId });
            const presigned = await assetService.presignMediaUpload(assetId, {
                fileName: file.name,
                contentType: file.type || "image/png",
                mediaType: "thumbnail",
                displayOrder: 1,
            });

            toast.loading("Uploading thumbnail image...", { id: toastId });
            await assetService.uploadBinary(presigned.uploadUrl, file, (percent) => {
                setThumbnailUploadProgress(percent);
            });

            toast.loading("Finalizing thumbnail entry...", { id: toastId });
            const confirmed = await assetService.confirmMediaUpload(assetId, {
                storageKey: presigned.storageKey,
                mediaType: "thumbnail",
                displayOrder: 1,
            });

            if (confirmed.url) {
                URL.revokeObjectURL(localPreviewUrl);
                blobUrlsRef.current.delete(localPreviewUrl);
            }

            const mediaWithUrl: AssetMedia = {
                ...confirmed,
                url: confirmed.url || localPreviewUrl,
            };

            setMediaList((prev) => [...prev.filter((m) => m.media_type !== "thumbnail"), mediaWithUrl]);

            toast.success("Thumbnail Uploaded Successfully!", {
                id: toastId,
                description: "Product cover thumbnail is now active.",
            });
        } catch (err) {
            URL.revokeObjectURL(localPreviewUrl);
            blobUrlsRef.current.delete(localPreviewUrl);
            const msg = getHumanErrorMessage(err, "Thumbnail upload failed");
            toast.error("Thumbnail Upload Error", { id: toastId, description: msg });
        } finally {
            setIsUploadingThumbnail(false);
            setThumbnailUploadProgress(null);
        }
    };

    // Dedicated Screenshots Upload (Supports Parallel Multi-File Uploading)
    const handleUploadScreenshots = async (files: FileList | File[]) => {
        if (!assetId) {
            toast.error("Save basic asset details first", { description: "Please complete Step 1 before uploading media." });
            return;
        }

        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        // Pre-validate all files individually
        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (validateMediaFile(file, "screenshot")) {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) return;

        // Process all valid screenshots in parallel
        await Promise.allSettled(
            validFiles.map(async (file, idx) => {
                const uploadId = `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
                const toastId = `screenshot-upload-${uploadId}`;
                const localPreviewUrl = URL.createObjectURL(file);
                blobUrlsRef.current.add(localPreviewUrl);

                setActiveScreenshotUploads((prev) => [
                    ...prev,
                    { id: uploadId, fileName: file.name, progress: 0 },
                ]);

                try {
                    toast.loading(`Authorizing "${file.name}"...`, { id: toastId });
                    const presigned = await assetService.presignMediaUpload(assetId, {
                        fileName: file.name,
                        contentType: file.type || "image/png",
                        mediaType: "screenshot",
                        displayOrder: mediaList.length + idx + 1,
                    });

                    toast.loading(`Uploading "${file.name}"...`, { id: toastId });
                    await assetService.uploadBinary(presigned.uploadUrl, file, (percent) => {
                        setActiveScreenshotUploads((prev) =>
                            prev.map((item) =>
                                item.id === uploadId ? { ...item, progress: percent } : item
                            )
                        );
                    });

                    toast.loading(`Finalizing "${file.name}"...`, { id: toastId });
                    const confirmed = await assetService.confirmMediaUpload(assetId, {
                        storageKey: presigned.storageKey,
                        mediaType: "screenshot",
                        displayOrder: mediaList.length + idx + 1,
                    });

                    if (confirmed.url) {
                        URL.revokeObjectURL(localPreviewUrl);
                        blobUrlsRef.current.delete(localPreviewUrl);
                    }

                    const mediaWithUrl: AssetMedia = {
                        ...confirmed,
                        url: confirmed.url || localPreviewUrl,
                    };

                    setMediaList((prev) => [...prev, mediaWithUrl]);

                    toast.success("Screenshot Uploaded!", {
                        id: toastId,
                        description: `"${file.name}" added to showcase gallery.`,
                    });
                } catch (err) {
                    URL.revokeObjectURL(localPreviewUrl);
                    blobUrlsRef.current.delete(localPreviewUrl);
                    const msg = getHumanErrorMessage(err, `Screenshot "${file.name}" upload failed`);
                    toast.error("Screenshot Upload Error", { id: toastId, description: msg });
                } finally {
                    setActiveScreenshotUploads((prev) => prev.filter((item) => item.id !== uploadId));
                }
            })
        );
    };

    // Remove uploaded media
    const handleDeleteMedia = async (mediaId: string) => {
        if (!assetId) {
            setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
            return;
        }

        try {
            await assetService.deleteMedia(assetId, mediaId);
            setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
            toast.success("Media Removed");
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to remove media item";
            toast.error("Removal Error", { description: msg });
        }
    };

    // Final Publish / Review Actions (Sellers submit for review)
    const handleFinalPublish = async (shouldPublish: boolean) => {
        if (!assetId) {
            toast.error("Asset not saved yet", { description: "Please complete Step 1 first." });
            return;
        }

        if (shouldPublish && uploadedFiles.length === 0) {
            toast.error("Deliverable File Required", {
                description: "You must upload at least one deliverable package in Step 3 before submitting for review.",
            });
            setCurrentStep("deliverables");
            return;
        }

        try {
            const targetStatus = shouldPublish ? "pending" : "draft";
            await assetService.updateAssetStatus(
                assetId,
                targetStatus,
                shouldPublish && sellerFeedback.trim() ? sellerFeedback.trim() : undefined
            );
            toast.success(
                shouldPublish ? "Asset Submitted for Review!" : "Draft Saved Successfully!",
                {
                    description: shouldPublish
                        ? "Your digital product has been submitted for admin approval and will go live once approved."
                        : "You can return to edit and submit whenever you are ready.",
                }
            );
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
            void navigate("/dashboard/seller/products/all");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update asset status";
            toast.error("Publishing Error", { description: msg });
        }
    };

    const stepsList: Array<{ id: WizardStep; label: string }> = [
        { id: "info", label: "1. Details" },
        { id: "tiers_specs", label: "2. Pricing" },
        { id: "deliverables", label: "3. Deliverables" },
        { id: "media", label: "4. Media" },
        { id: "review", label: "5. Review" },
    ];

    const thumbnailItem = mediaList.find((m) => m.media_type === "thumbnail");
    const screenshotItems = mediaList.filter((m) => m.media_type === "screenshot");

    return (
        <div className="space-y-6 max-w-4xl mx-auto w-full animate-fade-in pb-16">
            {/* Header */}
            <div className="pb-4 border-b border-outline-variant/30 flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                        {assetId ? "Edit Digital Asset" : "Create New Digital Asset"}
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Complete all 5 phases to publish your deliverable files and licensing contracts.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/dashboard/seller/products/all")}
                    className="cursor-pointer"
                >
                    Cancel
                </Button>
            </div>

            {/* Admin Feedback Callout Banner (when editing an asset that received review comments) */}
            {activeAsset?.admin_feedback && (
                <div
                    className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                        activeAsset.status === "rejected"
                            ? "border-error/40 bg-error/10 text-on-surface"
                            : "border-primary/40 bg-primary/10 text-on-surface"
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <div className="font-bold flex items-center gap-1.5 text-primary">
                            <Icons.AlertCircle size={16} />
                            <span>
                                {activeAsset.status === "rejected"
                                    ? "Admin Rejection Reason & Required Fixes"
                                    : activeAsset.status === "needs_update"
                                    ? "Admin Requested Updates Before Publishing"
                                    : "Administrator Review Feedback"}
                            </span>
                        </div>
                        <Badge variant="outline" size="sm" className="capitalize">
                            {activeAsset.status.replace(/_/g, " ")}
                        </Badge>
                    </div>
                    <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed pl-5">
                        {activeAsset.admin_feedback}
                    </p>
                </div>
            )}

            {/* Step Navigation Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
                {stepsList.map((step) => {
                    const isCurrent = currentStep === step.id;
                    return (
                        <button
                            key={step.id}
                            type="button"
                            onClick={() => {
                                // Can only jump forward if draft asset is already saved
                                if (step.id !== "info" && !assetId) {
                                    toast.info("Save basic details in Step 1 first");
                                    return;
                                }
                                if (!isEditMode && location.pathname.includes("/products/upload/")) {
                                    if (step.id === "media") {
                                        void navigate({
                                            pathname: "/dashboard/seller/products/upload/media",
                                            search: assetId ? `?assetId=${assetId}` : location.search,
                                        });
                                        return;
                                    } else if (step.id === "deliverables") {
                                        void navigate({
                                            pathname: "/dashboard/seller/products/upload/files",
                                            search: assetId ? `?assetId=${assetId}` : location.search,
                                        });
                                        return;
                                    }
                                }
                                setCurrentStep(step.id);
                            }}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                isCurrent
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            {step.label}
                        </button>
                    );
                })}
            </div>

            {/* STEP 1: Basic Info */}
            {currentStep === "info" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Step 1: Basic Asset Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(handleSaveBasicAndAdvance, onBasicInfoInvalid)} className="space-y-4">
                            {/* Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="title">Asset Title *</Label>
                                <Input
                                    id="title"
                                    error={!!errors.title}
                                    placeholder="e.g. Next.js SaaS Boilerplate with Stripe & Supabase"
                                    {...register("title")}
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1.5">
                                <Label htmlFor="categoryId">Marketplace Taxonomy Category *</Label>
                                <select
                                    id="categoryId"
                                    {...register("categoryId", { valueAsNumber: true })}
                                    className={`w-full px-3 py-2 text-sm rounded-xl bg-surface border text-on-surface focus:outline-hidden cursor-pointer ${
                                        errors.categoryId
                                            ? "border-error focus:border-error"
                                            : "border-outline-variant/40 focus:border-primary"
                                    }`}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} ({cat.slug})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Short Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="shortDescription">Short Hook / Elevator Pitch *</Label>
                                <Input
                                    id="shortDescription"
                                    error={!!errors.shortDescription}
                                    placeholder="One or two sentences summarizing the primary value proposition..."
                                    {...register("shortDescription")}
                                />
                            </div>

                            {/* Full Description (Optional) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="fullDescription">
                                    Full Description &amp; Documentation <span className="text-on-surface-variant font-normal text-xs">(Optional)</span>
                                </Label>
                                <textarea
                                    id="fullDescription"
                                    rows={5}
                                    placeholder="Detailed description, setup instructions, feature list (optional)..."
                                    {...register("fullDescription")}
                                    className={`w-full px-3 py-2 text-sm rounded-xl bg-surface border text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden resize-y ${
                                        errors.fullDescription
                                            ? "border-error focus:border-error"
                                            : "border-outline-variant/40 focus:border-primary"
                                    }`}
                                />
                            </div>

                            {/* Tags Input */}
                            <div className="space-y-1.5">
                                <Label htmlFor="tagInput">Tags &amp; Keywords</Label>
                                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-outline-variant/40 bg-surface min-h-10.5 items-center">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container text-xs font-mono text-on-surface"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        id="tagInput"
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleAddTag}
                                        placeholder="Add tag and press Enter..."
                                        className="flex-1 min-w-35 text-xs bg-transparent border-none focus:outline-hidden text-on-surface placeholder:text-on-surface-variant/50"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="md"
                                    rightIcon={<Icons.Next size={14} />}
                                    className="cursor-pointer"
                                >
                                    Continue
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* STEP 2: Tiers & Specs */}
            {currentStep === "tiers_specs" && (
                <div className="space-y-6">
                    {/* Tiers Builder */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">
                                Pricing Tiers ({currencyInfo.code})
                            </CardTitle>
                            <p className="text-xs text-on-surface-variant mt-1">
                                License terms are standardized across the marketplace. You can customize the price for each licensing tier below.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.tierType}
                                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-on-surface">
                                                    {tier.name || `${tier.tierType.charAt(0).toUpperCase() + tier.tierType.slice(1)} License`}
                                                </span>
                                                <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                                                    {tier.tierType}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-on-surface-variant mt-1">
                                                {tier.licenseTermsSummary}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-on-surface-variant font-semibold">
                                                Price ({currencyInfo.symbol}):
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={tier.price}
                                                onChange={(e) => handleUpdateTierPrice(tier.tierType, Number(e.target.value))}
                                                className="w-24 px-2.5 py-1.5 text-sm font-bold text-center rounded-lg bg-surface border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Technical Specifications Key-Value Editor */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Technical Specifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                {specs.map((spec, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-1/3 px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface truncate">
                                            {spec.key}
                                        </span>
                                        <span className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-low text-xs text-on-surface truncate">
                                            {spec.value}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSpec(idx)}
                                            className="text-error hover:text-error/80 px-2 cursor-pointer text-sm font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add Spec Row */}
                            <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
                                <input
                                    type="text"
                                    placeholder="Spec (e.g. Version)"
                                    value={newSpecKey}
                                    onChange={(e) => setNewSpecKey(e.target.value)}
                                    className="w-1/3 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant/40 text-on-surface"
                                />
                                <input
                                    type="text"
                                    placeholder="Value (e.g. 2.0.4)"
                                    value={newSpecValue}
                                    onChange={(e) => setNewSpecValue(e.target.value)}
                                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant/40 text-on-surface"
                                />
                                <Button variant="outline" size="sm" onClick={handleAddSpec} className="cursor-pointer">
                                    Add
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            size="md"
                            leftIcon={<Icons.Back size={14} />}
                            onClick={() => setCurrentStep("info")}
                            className="cursor-pointer"
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            rightIcon={<Icons.Next size={14} />}
                            onClick={handleSaveStep2AndAdvance}
                            isLoading={isSavingStep2}
                            className="cursor-pointer"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: Deliverables Upload */}
            {currentStep === "deliverables" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">
                            Step 3: Upload Deliverable Files
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Upload the digital deliverable package that buyers receive upon purchasing. Supports archives (ZIP, RAR, 7Z), documents, graphics, audio, video, or code packages up to 500 MB.
                        </p>

                        {/* File Version Input */}
                        <div className="space-y-1.5 max-w-xs">
                            <Label htmlFor="version-input">Deliverable Package Version</Label>
                            <Input
                                id="version-input"
                                value={deliverableVersion}
                                onChange={(e) => setDeliverableVersion(e.target.value)}
                                placeholder="1.0.0"
                                className="font-mono text-xs"
                            />
                        </div>

                        {/* Drag and Drop Box with Auto-Upload */}
                        <div
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    if (!isUploadingDeliverable) {
                                        document.getElementById("deliverable-file-input")?.click();
                                    }
                                }
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files?.[0]) {
                                    void handleUploadDeliverable(e.dataTransfer.files[0]);
                                }
                            }}
                            onClick={() => {
                                if (!isUploadingDeliverable) {
                                    document.getElementById("deliverable-file-input")?.click();
                                }
                            }}
                            className="p-8 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors group"
                        >
                            <Icons.Upload size={36} className="text-primary mb-2 transition-transform group-hover:scale-110" />
                            <h4 className="font-bold text-sm text-on-surface">
                                {isUploadingDeliverable
                                    ? `Uploading ${deliverableFile?.name || "file"}...`
                                    : deliverableFile
                                    ? deliverableFile.name
                                    : "Drag & drop deliverable file here"}
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1">
                                {isUploadingDeliverable
                                    ? "Streaming payload direct to storage server..."
                                    : "or click anywhere in this box to browse and auto-upload (.zip, .rar, .7z, .pdf, media, etc.)"}
                            </p>

                            <input
                                type="file"
                                accept=".zip,.rar,.7z,.tar,.gz,.pdf,.png,.jpg,.jpeg,.svg,.mp4,.mov,.mp3,.wav,.blend,.obj,.fbx"
                                id="deliverable-file-input"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        void handleUploadDeliverable(file);
                                        e.target.value = "";
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                isLoading={isUploadingDeliverable}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    document.getElementById("deliverable-file-input")?.click();
                                }}
                                className="mt-3 cursor-pointer"
                            >
                                {isUploadingDeliverable ? "Uploading..." : "Browse Files"}
                            </Button>
                        </div>

                        {/* Visual Progress Bar */}
                        {deliverableUploadProgress !== null && (
                            <div className="space-y-1.5 animate-fade-in">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-on-surface">Uploading Binary to Storage...</span>
                                    <span className="text-primary font-mono">{deliverableUploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-200"
                                        style={{ width: `${deliverableUploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* List of uploaded files */}
                        {uploadedFiles.length > 0 && (
                            <div className="pt-4 border-t border-outline-variant/30 space-y-2">
                                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                                    Active Deliverable Packages ({uploadedFiles.length})
                                </h4>
                                {uploadedFiles.map((f) => (
                                    <div
                                        key={f.id}
                                        className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icons.Package size={16} className="text-primary shrink-0" />
                                            <span className="font-semibold text-on-surface">{f.file_name}</span>
                                            <Badge variant="outline" size="sm">
                                                v{f.version}
                                            </Badge>
                                        </div>
                                        <span className="text-on-surface-variant font-mono">
                                            {formatBytes(f.file_size_bytes || 0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                size="md"
                                leftIcon={<Icons.Back size={14} />}
                                onClick={() => setCurrentStep("tiers_specs")}
                                className="cursor-pointer"
                            >
                                Back
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                rightIcon={<Icons.Next size={14} />}
                                onClick={() => {
                                    if (!isEditMode && location.pathname.includes("/products/upload/")) {
                                        void navigate({
                                            pathname: "/dashboard/seller/products/upload/media",
                                            search: assetId ? `?assetId=${assetId}` : location.search,
                                        });
                                    } else {
                                        setCurrentStep("media");
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                Continue
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 4: Media Showcase (Separate Blocks for Thumbnail & Screenshots) */}
            {currentStep === "media" && (
                <div className="space-y-6">
                    {/* BLOCK 1: Main Thumbnail (Cover Image) */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold">Main Thumbnail (Cover Image)</CardTitle>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        The primary display card image shown in catalog search and marketplace showcases (Recommended 16:9, max 10MB).
                                    </p>
                                </div>
                                {thumbnailItem && (
                                    <Badge variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/30">
                                        Cover Set
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {thumbnailItem ? (
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                                    <div className="relative aspect-16/10 w-full sm:w-56 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container shadow-2xs shrink-0">
                                        <img
                                            src={resolveMediaUrl(thumbnailItem.url || "")}
                                            alt="Main Thumbnail"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = "none";
                                                const sibling = target.nextElementSibling;
                                                if (sibling) (sibling as HTMLElement).style.display = "flex";
                                            }}
                                        />
                                        <div className="w-full h-full hidden flex-col items-center justify-center p-2 text-center text-xs text-on-surface-variant">
                                            <Icons.Image size={28} className="text-on-surface-variant/40 mb-1" />
                                            <span>Cover Image</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1 w-full">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-on-surface">Primary Storefront Thumbnail</span>
                                            <Badge variant="outline" size="sm" className="text-[10px]">
                                                16:9 Aspect
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-on-surface-variant">
                                            This image will be rendered on listing cards and product details hero view.
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => document.getElementById("thumbnail-file-input")?.click()}
                                                isLoading={isUploadingThumbnail}
                                                className="cursor-pointer"
                                            >
                                                Change Thumbnail
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => handleDeleteMedia(thumbnailItem.id)}
                                                className="text-error hover:text-error/80 cursor-pointer"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            if (!isUploadingThumbnail) {
                                                document.getElementById("thumbnail-file-input")?.click();
                                            }
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files?.[0]) {
                                            void handleUploadThumbnail(e.dataTransfer.files[0]);
                                        }
                                    }}
                                    onClick={() => {
                                        if (!isUploadingThumbnail) {
                                            document.getElementById("thumbnail-file-input")?.click();
                                        }
                                    }}
                                    className="p-6 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors group"
                                >
                                    <Icons.Upload size={32} className="text-primary mb-2 transition-transform group-hover:scale-110" />
                                    <h4 className="font-bold text-sm text-on-surface">
                                        Upload Main Thumbnail
                                    </h4>
                                    <p className="text-xs text-on-surface-variant mt-1">
                                        PNG, JPG, or WebP up to 10MB (click anywhere to browse)
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        type="button"
                                        isLoading={isUploadingThumbnail}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            document.getElementById("thumbnail-file-input")?.click();
                                        }}
                                        className="mt-3 cursor-pointer"
                                    >
                                        Browse Thumbnail
                                    </Button>
                                </div>
                            )}

                            {/* Thumbnail Upload Progress */}
                            {thumbnailUploadProgress !== null && (
                                <div className="space-y-1.5 animate-fade-in pt-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-on-surface">Uploading Thumbnail Image...</span>
                                        <span className="text-primary font-mono">{thumbnailUploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-200"
                                            style={{ width: `${thumbnailUploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                id="thumbnail-file-input"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        void handleUploadThumbnail(file);
                                        e.target.value = "";
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* BLOCK 2: Screenshots & Showcase Gallery */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">Screenshots &amp; Showcase Gallery</CardTitle>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Add feature screenshots, UI previews, or sample renders to display on your product detail gallery (multi-file parallel upload supported).
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Drag and Drop Box for Screenshots */}
                            <div
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        document.getElementById("screenshot-file-input")?.click();
                                    }
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files?.length) {
                                        void handleUploadScreenshots(e.dataTransfer.files);
                                    }
                                }}
                                onClick={() => {
                                    document.getElementById("screenshot-file-input")?.click();
                                }}
                                className="p-6 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors group"
                            >
                                <Icons.Upload size={32} className="text-primary mb-2 transition-transform group-hover:scale-110" />
                                <h4 className="font-bold text-sm text-on-surface">
                                    Add Product Screenshots
                                </h4>
                                <p className="text-xs text-on-surface-variant mt-1">
                                    PNG, JPG, or WebP up to 10MB each (drag multiple files or click to browse)
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    isLoading={activeScreenshotUploads.length > 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById("screenshot-file-input")?.click();
                                    }}
                                    className="mt-3 cursor-pointer"
                                >
                                    Browse Screenshots (Multiple)
                                </Button>
                            </div>

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                id="screenshot-file-input"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.length) {
                                        void handleUploadScreenshots(e.target.files);
                                        e.target.value = "";
                                    }
                                }}
                            />

                            {/* Parallel Screenshot Uploads Progress */}
                            {activeScreenshotUploads.length > 0 && (
                                <div className="space-y-2 animate-fade-in pt-2">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-on-surface">
                                            Uploading Screenshots ({activeScreenshotUploads.length} active)...
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {activeScreenshotUploads.map((upload) => (
                                            <div
                                                key={upload.id}
                                                className="p-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low space-y-1"
                                            >
                                                <div className="flex justify-between text-xs">
                                                    <span className="truncate max-w-60 text-on-surface font-medium">
                                                        {upload.fileName}
                                                    </span>
                                                    <span className="text-primary font-mono font-semibold">
                                                        {upload.progress}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-200"
                                                        style={{ width: `${upload.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gallery of Uploaded Screenshots */}
                            {screenshotItems.length > 0 && (
                                <div className="pt-2 space-y-2">
                                    <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                                        Screenshots ({screenshotItems.length})
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {screenshotItems.map((m) => (
                                            <div
                                                key={m.id}
                                                className="relative aspect-16/10 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container group shadow-2xs"
                                            >
                                                {m.url ? (
                                                    <img
                                                        src={resolveMediaUrl(m.url)}
                                                        alt="Screenshot"
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => {
                                                            const target = e.currentTarget;
                                                            target.style.display = "none";
                                                            const sibling = target.nextElementSibling;
                                                            if (sibling) (sibling as HTMLElement).style.display = "flex";
                                                        }}
                                                    />
                                                ) : null}
                                                <div
                                                    className={`w-full h-full flex flex-col items-center justify-center p-2 text-center text-xs text-on-surface-variant ${
                                                        m.url ? "hidden" : "flex"
                                                    }`}
                                                >
                                                    <Icons.Image size={24} className="text-on-surface-variant/40 mb-1" />
                                                    <span className="truncate max-w-full text-[10px] font-mono">
                                                        {m.storage_key ? m.storage_key.split("/").pop() : "Screenshot"}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMedia(m.id)}
                                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-surface/90 text-error hover:bg-error hover:text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                                    title="Delete screenshot"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <Button
                            variant="outline"
                            size="md"
                            leftIcon={<Icons.Back size={14} />}
                            onClick={() => {
                                if (!isEditMode && location.pathname.includes("/products/upload/")) {
                                    void navigate({
                                        pathname: "/dashboard/seller/products/upload/files",
                                        search: assetId ? `?assetId=${assetId}` : location.search,
                                    });
                                } else {
                                    setCurrentStep("deliverables");
                                }
                            }}
                            className="cursor-pointer"
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            rightIcon={<Icons.Next size={14} />}
                            onClick={() => setCurrentStep("review")}
                            className="cursor-pointer"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 5: Review & Publish */}
            {currentStep === "review" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Step 5: Review &amp; Submit for Approval</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                            <h3 className="font-extrabold text-base text-on-surface">
                                {activeAsset?.title || getValues("title")}
                            </h3>
                            <p className="text-xs text-on-surface-variant">
                                {activeAsset?.short_description || getValues("shortDescription")}
                            </p>

                            <div className="flex flex-wrap gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                                <span className="font-semibold text-on-surface-variant">Tiers:</span>
                                {tiers.map((t) => (
                                    <Badge key={t.tierType} variant="outline" size="sm">
                                        {t.name || t.tierType}: {formatCurrency(t.price)}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Deliverables summary */}
                        <div className="p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-on-surface block">Deliverable Files</span>
                                <span className="text-[11px] text-on-surface-variant">
                                    {uploadedFiles.length > 0
                                        ? `${uploadedFiles.length} version package uploaded`
                                        : "No deliverable uploaded yet"}
                                </span>
                            </div>
                            {uploadedFiles.length > 0 ? (
                                <Icons.Check size={20} className="text-primary" />
                            ) : (
                                <Badge variant="outline" size="sm">Pending</Badge>
                            )}
                        </div>

                        {/* Media summary */}
                        <div className="p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-on-surface block">Showcase Media</span>
                                <span className="text-[11px] text-on-surface-variant">
                                    {thumbnailItem ? "Cover Thumbnail set" : "No cover thumbnail"}, {screenshotItems.length} screenshot(s)
                                </span>
                            </div>
                            {thumbnailItem ? (
                                <Icons.Check size={20} className="text-primary" />
                            ) : (
                                <Badge variant="outline" size="sm">Optional</Badge>
                            )}
                        </div>

                        {/* Seller Reply / Revision Notes to Admin */}
                        <div className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low space-y-2">
                            <Label htmlFor="wizard-seller-feedback" className="text-xs font-semibold text-on-surface">
                                {activeAsset?.admin_feedback
                                    ? "Response to Admin Feedback / Summary of Changes"
                                    : "Notes for Admin Reviewer (Optional)"}
                            </Label>
                            <textarea
                                id="wizard-seller-feedback"
                                rows={3}
                                value={sellerFeedback}
                                onChange={(e) => setSellerFeedback(e.target.value)}
                                placeholder={
                                    activeAsset?.admin_feedback
                                        ? "Explain how you addressed the administrator's requested updates..."
                                        : "Add any helpful context or notes for the administrator reviewing your submission..."
                                }
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-hidden"
                            />
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                            <Button
                                variant="outline"
                                size="md"
                                leftIcon={<Icons.Back size={14} />}
                                onClick={() => {
                                    if (!isEditMode && location.pathname.includes("/products/upload/")) {
                                        void navigate({
                                            pathname: "/dashboard/seller/products/upload/media",
                                            search: assetId ? `?assetId=${assetId}` : location.search,
                                        });
                                    } else {
                                        setCurrentStep("media");
                                    }
                                }}
                                className="cursor-pointer"
                            >
                                Back
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="md"
                                    onClick={() => handleFinalPublish(false)}
                                    className="cursor-pointer"
                                >
                                    Save Draft
                                </Button>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => handleFinalPublish(true)}
                                    className="cursor-pointer"
                                >
                                    {activeAsset?.status === "needs_update" || activeAsset?.status === "rejected"
                                        ? "Resubmit for Review"
                                        : "Submit for Review"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export const SellerProductWizardPage: React.FC = () => {
    const { id: editId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const queryAssetId = searchParams.get("assetId") || searchParams.get("id");
    const activeAssetId = editId || queryAssetId || undefined;
    const isEditMode = Boolean(editId);
    const shouldFetch = Boolean(activeAssetId);

    const { data: existingAsset, isLoading: isLoadingExisting } = useQuery({
        queryKey: queryKeys.assets.detail(activeAssetId || ""),
        queryFn: () => assetService.getAssetById(activeAssetId!),
        enabled: shouldFetch,
        staleTime: 1000 * 60 * 5,
    });

    if (shouldFetch && (isLoadingExisting || !existingAsset)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
                <Spinner size="lg" />
                <p className="text-sm text-on-surface-variant">
                    {isEditMode ? "Loading asset details for editing..." : "Loading draft asset..."}
                </p>
            </div>
        );
    }

    return (
        <SellerProductWizardForm
            key={activeAssetId || "new"}
            initialAsset={existingAsset || null}
            isEditMode={isEditMode}
        />
    );
};

export default SellerProductWizardPage;
