// src/features/dashboard/pages/seller/SellerProductWizardPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { formatBytes } from "@/utils/file.ts";
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
import type { TierType, MediaType, AssetMedia, AssetFile, DigitalAsset } from "@/types/asset.ts";

const basicInfoSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(180),
    categoryId: z.number().int().positive("Please select a category"),
    shortDescription: z.string().trim().min(10, "Short description must be at least 10 characters").max(450),
    fullDescription: z.string().trim().min(20, "Full description must be at least 20 characters"),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

type WizardStep = "info" | "tiers_specs" | "deliverables" | "media" | "review";

export const SellerProductWizardPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: editId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const [currentStep, setCurrentStep] = useState<WizardStep>("info");
    const [assetId, setAssetId] = useState<string | null>(editId || null);
    const [activeAsset, setActiveAsset] = useState<DigitalAsset | null>(null);

    // Tags state
    const [tags, setTags] = useState<string[]>(["template", "typescript"]);
    const [tagInput, setTagInput] = useState("");

    // Technical specs state
    const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([
        { key: "Framework", value: "React 19" },
        { key: "Database", value: "PostgreSQL" },
    ]);
    const [newSpecKey, setNewSpecKey] = useState("");
    const [newSpecValue, setNewSpecValue] = useState("");

    // Tiers state
    const [tiers, setTiers] = useState<Array<{ tierType: TierType; price: number; licenseTermsSummary: string }>>([
        { tierType: "personal", price: 29, licenseTermsSummary: "Single personal non-commercial project" },
        { tierType: "commercial", price: 79, licenseTermsSummary: "Up to 5 commercial commercial applications" },
        { tierType: "extended", price: 199, licenseTermsSummary: "Unlimited SaaS projects & resale permission" },
    ]);

    // Deliverable upload state
    const [deliverableFile, setDeliverableFile] = useState<File | null>(null);
    const [deliverableVersion, setDeliverableVersion] = useState("1.0.0");
    const [deliverableUploadProgress, setDeliverableUploadProgress] = useState<number | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<AssetFile[]>([]);
    const [isUploadingDeliverable, setIsUploadingDeliverable] = useState(false);

    // Media upload state
    const [mediaList, setMediaList] = useState<AssetMedia[]>([]);
    const [mediaUploadProgress, setMediaUploadProgress] = useState<number | null>(null);
    const [isUploadingMedia, setIsUploadingMedia] = useState(false);
    const [mediaType, setMediaType] = useState<MediaType>("thumbnail");

    // Fetch category taxonomy for dropdown
    const { data: categories = [] } = useQuery({
        queryKey: queryKeys.categories.tree(),
        queryFn: () => assetService.getCategoryTaxonomy(),
    });

    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        formState: { errors },
    } = useForm<BasicInfoFormData>({
        resolver: zodResolver(basicInfoSchema),
        defaultValues: {
            title: "",
            categoryId: categories[0]?.id || 1,
            shortDescription: "",
            fullDescription: "",
        },
    });

    const onBasicInfoInvalid = (formErrors: typeof errors) => {
        const firstKey = Object.keys(formErrors)[0] as keyof typeof formErrors;
        const firstMessage = formErrors[firstKey]?.message || "Please fill in all required fields.";
        toast.error("Validation Error", { description: String(firstMessage) });
    };

    // Populate default category when categories load
    useEffect(() => {
        if (categories.length > 0 && !getValues("categoryId")) {
            setValue("categoryId", categories[0].id);
        }
    }, [categories, setValue, getValues]);

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

    // Update Tier Price
    const handleUpdateTierPrice = (tierType: TierType, newPrice: number) => {
        setTiers(tiers.map((t) => (t.tierType === tierType ? { ...t, price: Math.max(0, newPrice) } : t)));
    };

    // Update Tier Summary
    const handleUpdateTierSummary = (tierType: TierType, summary: string) => {
        setTiers(tiers.map((t) => (t.tierType === tierType ? { ...t, licenseTermsSummary: summary } : t)));
    };

    // Save Basic Info & Create Draft Asset in PostgreSQL
    const handleSaveBasicAndAdvance = async (data: BasicInfoFormData) => {
        try {
            const technicalSpecsObj: Record<string, unknown> = {};
            for (const s of specs) {
                technicalSpecsObj[s.key] = s.value;
            }

            if (!assetId) {
                // Phase 1 Creation: Create draft asset
                const created = await assetService.createDraftAsset({
                    categoryId: data.categoryId,
                    title: data.title,
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
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
            } else {
                // Update existing draft asset
                const updated = await assetService.updateAsset(assetId, {
                    categoryId: data.categoryId,
                    title: data.title,
                    shortDescription: data.shortDescription,
                    fullDescription: data.fullDescription,
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
            }

            setCurrentStep("tiers_specs");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save asset details";
            toast.error("Validation Error", { description: msg });
        }
    };

    // 2-Phase Presigned Upload: Deliverable File
    const handleUploadDeliverable = async () => {
        if (!assetId) {
            toast.error("Save basic asset details first");
            return;
        }
        if (!deliverableFile) {
            toast.error("Please select a ZIP file to upload");
            return;
        }

        try {
            setIsUploadingDeliverable(true);
            setDeliverableUploadProgress(0);

            // Phase 1: Request presigned upload URL
            toast.loading("Generating presigned upload authorization...", { id: "deliverable-upload" });
            const presigned = await assetService.presignFileUpload(assetId, {
                fileName: deliverableFile.name,
                contentType: deliverableFile.type || "application/zip",
                version: deliverableVersion,
                fileSizeBytes: deliverableFile.size,
            });

            // Phase 2: Stream binary direct to storage
            toast.loading("Streaming binary deliverable to storage disk...", { id: "deliverable-upload" });
            await assetService.uploadBinary(presigned.uploadUrl, deliverableFile, (percent) => {
                setDeliverableUploadProgress(percent);
            });

            // Phase 3: Confirm file in database
            toast.loading("Confirming file version in database...", { id: "deliverable-upload" });
            const confirmed = await assetService.confirmFileUpload(assetId, {
                storageKey: presigned.storageKey,
                fileName: deliverableFile.name,
                version: deliverableVersion,
                fileSizeBytes: deliverableFile.size,
            });

            setUploadedFiles([...uploadedFiles, confirmed]);
            toast.success("Deliverable Uploaded Successfully!", {
                id: "deliverable-upload",
                description: `${confirmed.file_name} attached to v${confirmed.version}`,
            });
            setDeliverableFile(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Deliverable upload failed";
            toast.error("Upload Error", { id: "deliverable-upload", description: msg });
        } finally {
            setIsUploadingDeliverable(false);
            setDeliverableUploadProgress(null);
        }
    };

    // 2-Phase Presigned Upload: Media File
    const handleUploadMedia = async (file: File) => {
        if (!assetId) {
            toast.error("Save basic asset details first");
            return;
        }

        try {
            setIsUploadingMedia(true);
            setMediaUploadProgress(0);

            toast.loading("Requesting media presigned upload...", { id: "media-upload" });
            const presigned = await assetService.presignMediaUpload(assetId, {
                fileName: file.name,
                contentType: file.type || "image/png",
                mediaType,
                displayOrder: mediaList.length + 1,
            });

            toast.loading("Streaming image to media storage...", { id: "media-upload" });
            await assetService.uploadBinary(presigned.uploadUrl, file, (percent) => {
                setMediaUploadProgress(percent);
            });

            toast.loading("Finalizing media showcase entry...", { id: "media-upload" });
            const confirmed = await assetService.confirmMediaUpload(assetId, {
                storageKey: presigned.storageKey,
                mediaType,
                displayOrder: mediaList.length + 1,
            });

            setMediaList([...mediaList, confirmed]);
            toast.success("Media Uploaded Successfully!", {
                id: "media-upload",
                description: `Showcase ${confirmed.media_type} preview is now live.`,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Media upload failed";
            toast.error("Upload Error", { id: "media-upload", description: msg });
        } finally {
            setIsUploadingMedia(false);
            setMediaUploadProgress(null);
        }
    };

    // Final Publish / Draft Actions
    const handleFinalPublish = async (shouldPublish: boolean) => {
        if (!assetId) {
            toast.error("Asset not saved yet");
            return;
        }

        try {
            const targetStatus = shouldPublish ? "published" : "draft";
            await assetService.updateAssetStatus(assetId, targetStatus);
            toast.success(
                shouldPublish ? "Asset Published Live!" : "Draft Saved Successfully!",
                {
                    description: shouldPublish
                        ? "Your digital product is now active in the public marketplace."
                        : "You can return to edit and publish whenever you are ready.",
                }
            );
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            void navigate("/dashboard/seller/products/all");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update asset status";
            toast.error("Publishing Error", { description: msg });
        }
    };

    const stepsList: Array<{ id: WizardStep; label: string }> = [
        { id: "info", label: "1. Basic Details" },
        { id: "tiers_specs", label: "2. Pricing & Specs" },
        { id: "deliverables", label: "3. Deliverable ZIP" },
        { id: "media", label: "4. Media Showcase" },
        { id: "review", label: "5. Review & Publish" },
    ];

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

                            {/* Full Description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="fullDescription">Full Description &amp; Documentation *</Label>
                                <textarea
                                    id="fullDescription"
                                    rows={5}
                                    placeholder="Detailed description, setup instructions, feature list..."
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
                                <Button type="submit" variant="primary" size="md" className="cursor-pointer">
                                    Save &amp; Continue to Step 2 <Icons.Next size={14} className="ml-1" />
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
                            <CardTitle className="text-base font-bold">Pricing Tiers (USD)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tiers.map((tier) => (
                                <div
                                    key={tier.tierType}
                                    className="p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm capitalize text-on-surface">
                                            {tier.tierType} License
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-on-surface-variant font-semibold">Price ($):</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={tier.price}
                                                onChange={(e) => handleUpdateTierPrice(tier.tierType, Number(e.target.value))}
                                                className="w-24 px-2 py-1 text-sm font-bold text-center rounded-lg bg-surface border border-outline-variant/40 text-on-surface"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`terms-${tier.tierType}`} className="text-xs">
                                            License Terms Summary
                                        </Label>
                                        <input
                                            id={`terms-${tier.tierType}`}
                                            type="text"
                                            value={tier.licenseTermsSummary}
                                            onChange={(e) => handleUpdateTierSummary(tier.tierType, e.target.value)}
                                            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant/40 text-on-surface mt-1"
                                        />
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
                        <Button variant="outline" size="md" onClick={() => setCurrentStep("info")} className="cursor-pointer">
                            <Icons.Back size={14} className="mr-1" /> Back to Details
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setCurrentStep("deliverables")}
                            className="cursor-pointer"
                        >
                            Next: Upload Deliverables <Icons.Next size={14} className="ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 3: Deliverables Upload (2-Phase Presigned Upload) */}
            {currentStep === "deliverables" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">
                            Step 3: Deliverable ZIP Upload (2-Phase Presigned Upload)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            Upload your product binary deliverable as a ZIP archive. The client requests a presigned signed URL
                            from the backend, uploads binary bytes directly to disk, and confirms the package version.
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

                        {/* Drag and Drop Box */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files?.[0]) {
                                    setDeliverableFile(e.dataTransfer.files[0]);
                                }
                            }}
                            className="p-8 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                            <Icons.Upload size={36} className="text-primary mb-2" />
                            <h4 className="font-bold text-sm text-on-surface">
                                {deliverableFile ? deliverableFile.name : "Drag & drop ZIP archive here"}
                            </h4>
                            <p className="text-xs text-on-surface-variant mt-1">
                                {deliverableFile ? `${formatBytes(deliverableFile.size)} selected` : "or click browse to select a .zip payload from your machine"}
                            </p>

                            <input
                                type="file"
                                accept=".zip,.tar,.gz,.7z"
                                id="deliverable-file-input"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setDeliverableFile(e.target.files[0]);
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("deliverable-file-input")?.click()}
                                className="mt-3 cursor-pointer"
                            >
                                Browse Files
                            </Button>
                        </div>

                        {/* Visual Progress Bar */}
                        {deliverableUploadProgress !== null && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-on-surface">Uploading Binary to Storage...</span>
                                    <span className="text-primary">{deliverableUploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-200"
                                        style={{ width: `${deliverableUploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {deliverableFile && (
                            <div className="flex justify-end">
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={handleUploadDeliverable}
                                    isLoading={isUploadingDeliverable}
                                    leftIcon={<Icons.Upload size={16} />}
                                    className="cursor-pointer"
                                >
                                    Upload &amp; Confirm Deliverable
                                </Button>
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
                            <Button variant="outline" size="md" onClick={() => setCurrentStep("tiers_specs")} className="cursor-pointer">
                                <Icons.Back size={14} className="mr-1" /> Back
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setCurrentStep("media")}
                                className="cursor-pointer"
                            >
                                Next: Media Showcase <Icons.Next size={14} className="ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 4: Media Showcase */}
            {currentStep === "media" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Step 4: Media &amp; Preview Images</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Label htmlFor="mediaTypeSelect">Media Type:</Label>
                            <select
                                id="mediaTypeSelect"
                                value={mediaType}
                                onChange={(e) => setMediaType(e.target.value as MediaType)}
                                className="px-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant/40 text-on-surface cursor-pointer"
                            >
                                <option value="thumbnail">Main Thumbnail</option>
                                <option value="screenshot">Product Screenshot</option>
                            </select>
                        </div>

                        {/* Drag and Drop Box for Image */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files?.[0]) {
                                    void handleUploadMedia(e.dataTransfer.files[0]);
                                }
                            }}
                            className="p-8 border-2 border-dashed border-outline-variant/50 rounded-2xl bg-surface-container-lowest/50 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                            <Icons.Upload size={36} className="text-primary mb-2" />
                            <h4 className="font-bold text-sm text-on-surface">Upload {mediaType} Image</h4>
                            <p className="text-xs text-on-surface-variant mt-1">PNG, JPG, or WebP up to 10MB</p>

                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                id="media-file-input"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        void handleUploadMedia(e.target.files[0]);
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById("media-file-input")?.click()}
                                isLoading={isUploadingMedia}
                                className="mt-3 cursor-pointer"
                            >
                                Browse Image
                            </Button>
                        </div>

                        {mediaUploadProgress !== null && (
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs font-semibold">
                                    <span className="text-on-surface">Streaming Media Image...</span>
                                    <span className="text-primary">{mediaUploadProgress}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-200"
                                        style={{ width: `${mediaUploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Gallery Preview of uploaded media */}
                        {mediaList.length > 0 && (
                            <div className="pt-4 border-t border-outline-variant/30 space-y-2">
                                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                                    Uploaded Showcase Items ({mediaList.length})
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {mediaList.map((m) => (
                                        <div
                                            key={m.id}
                                            className="relative aspect-16/10 rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container group"
                                        >
                                            {m.url ? (
                                                <img src={m.url} alt={m.media_type} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
                                                    {m.storage_key}
                                                </div>
                                            )}
                                            <Badge
                                                variant="outline"
                                                size="sm"
                                                className="absolute top-1.5 left-1.5 text-[9px] uppercase bg-surface/80"
                                            >
                                                {m.media_type}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" size="md" onClick={() => setCurrentStep("deliverables")} className="cursor-pointer">
                                <Icons.Back size={14} className="mr-1" /> Back
                            </Button>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setCurrentStep("review")}
                                className="cursor-pointer"
                            >
                                Next: Review &amp; Publish <Icons.Next size={14} className="ml-1" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* STEP 5: Review & Publish */}
            {currentStep === "review" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold">Step 5: Review &amp; Publish</CardTitle>
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
                                        {t.tierType}: {formatCurrency(t.price)}
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
                                <span className="text-[11px] text-amber-500 font-semibold">ZIP Required for live publishing</span>
                            )}
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row justify-between gap-3">
                            <Button variant="outline" size="md" onClick={() => setCurrentStep("media")} className="cursor-pointer">
                                <Icons.Back size={14} className="mr-1" /> Back
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="md"
                                    onClick={() => handleFinalPublish(false)}
                                    className="cursor-pointer"
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => handleFinalPublish(true)}
                                    className="cursor-pointer"
                                >
                                    Publish Immediately
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default SellerProductWizardPage;
