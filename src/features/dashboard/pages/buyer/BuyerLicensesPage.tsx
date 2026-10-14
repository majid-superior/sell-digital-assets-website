// src/features/dashboard/pages/buyer/BuyerLicensesPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { licenseService } from "@/services/v1/licenseService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { Icons } from "@/lib/icons/index.ts";
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Badge,
    Modal,
    Input,
    Label,
    Skeleton,
    EmptyState,
} from "@/components/ui/index.ts";
import type { BuyerLicenseItem, LicenseVerificationResult } from "@/types/license.ts";

export const BuyerLicensesPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Live Query: Authenticated Buyer's Licenses from Backend REST API
    const { data: licenses = [], isLoading } = useQuery({
        queryKey: queryKeys.licenses.buyer(),
        queryFn: () => licenseService.getBuyerLicenses(),
    });

    // Live License Verifier Widget State
    const [verifyKeyInput, setVerifyKeyInput] = useState("");
    const [verifyDomainInput, setVerifyDomainInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<LicenseVerificationResult | null>(null);

    // Activate Domain Modal State
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
    const [selectedLicenseKey, setSelectedLicenseKey] = useState<string>("");
    const [domainToActivate, setDomainToActivate] = useState("");

    // Mutation: Activate Domain / Seat on Backend
    const activateMutation = useMutation({
        mutationFn: async ({ key, domain }: { key: string; domain: string }) => {
            return licenseService.activateLicense(key, domain);
        },
        onSuccess: (result, variables) => {
            toast.success("Domain Registered Successfully!", {
                description: result.message || `Bound ${variables.domain} to license seat.`,
            });
            setIsActivateModalOpen(false);
            setDomainToActivate("");
            void queryClient.invalidateQueries({ queryKey: queryKeys.licenses.buyer() });
        },
        onError: (err) => {
            const msg = err instanceof Error ? err.message : "Domain registration failed";
            toast.error("Seat Activation Failed", { description: msg });
        },
    });

    // Copy to clipboard helper
    const handleCopy = (key: string) => {
        navigator.clipboard.writeText(key).then(() => {
            toast.success("License key copied to clipboard");
        }).catch(() => {
            toast.error("Failed to copy license key");
        });
    };

    // Live License Verifier Tool
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyKeyInput.trim()) {
            toast.error("Please enter a license key to verify");
            return;
        }

        try {
            setIsVerifying(true);
            const result = await licenseService.verifyLicense(
                verifyKeyInput.trim(),
                verifyDomainInput.trim() || undefined
            );
            setVerificationResult(result);

            if (result.isValid) {
                toast.success("License Key Valid!", {
                    description: `Status: ${result.status.toUpperCase()} • Tier: ${result.tier.toUpperCase()}`,
                });
            } else {
                toast.error("License Verification Failed", {
                    description: result.reason || "Invalid license credentials",
                });
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Verification request failed";
            toast.error("Verification Error", { description: msg });
        } finally {
            setIsVerifying(false);
        }
    };

    // Activate Domain Submit
    const handleActivateDomain = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLicenseKey || !domainToActivate.trim()) {
            toast.error("Domain or machine identifier required");
            return;
        }
        activateMutation.mutate({
            key: selectedLicenseKey,
            domain: domainToActivate.trim(),
        });
    };

    return (
        <div className="space-y-8 animate-fade-in w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/30">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                        Cryptographic Licenses &amp; Seat Management
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        View active license keys, bind domains or client machines, and verify entitlement status.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/explore")}
                    leftIcon={<Icons.Explore size={14} />}
                    className="cursor-pointer shrink-0"
                >
                    Browse Catalog
                </Button>
            </div>

            {/* Standalone License Verifier Tool */}
            <Card className="border-outline-variant/40 bg-surface-container-low shadow-xs">
                <CardHeader>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-on-surface">
                        <Icons.Security size={18} className="text-primary" />
                        Live License Key Verifier Tool
                    </CardTitle>
                    <p className="text-xs text-on-surface-variant">
                        Query the backend cryptographic verification engine in real-time to check license validity, expiration, and seat allocations.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleVerify} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-6 space-y-1">
                            <Label htmlFor="verify-key" className="text-xs">
                                License Key *
                            </Label>
                            <Input
                                id="verify-key"
                                placeholder="DV26-XXXX-YYYY-ZZZZ-####"
                                value={verifyKeyInput}
                                onChange={(e) => setVerifyKeyInput(e.target.value)}
                                className="font-mono uppercase text-xs"
                            />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                            <Label htmlFor="verify-domain" className="text-xs">
                                Target Domain or IP (Optional)
                            </Label>
                            <Input
                                id="verify-domain"
                                placeholder="app.myclient.com"
                                value={verifyDomainInput}
                                onChange={(e) => setVerifyDomainInput(e.target.value)}
                                className="text-xs"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="md"
                                isLoading={isVerifying}
                                className="w-full cursor-pointer text-xs"
                            >
                                Verify Key
                            </Button>
                        </div>
                    </form>

                    {/* Verification Result Display */}
                    {verificationResult && (
                        <div
                            className={`p-4 rounded-xl border transition-all text-xs space-y-2 mt-3 ${
                                verificationResult.isValid
                                    ? "bg-primary/5 border-primary/30 text-on-surface"
                                    : "bg-error/5 border-error/30 text-error"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {verificationResult.isValid ? (
                                        <Icons.Check size={16} className="text-primary" />
                                    ) : (
                                        <Icons.Close size={16} className="text-error" />
                                    )}
                                    <span className="font-bold text-sm">
                                        {verificationResult.isValid ? "License Valid & Active" : "Invalid License"}
                                    </span>
                                </div>
                                <Badge
                                    variant={verificationResult.isValid ? "primary" : "error"}
                                    size="sm"
                                    className="uppercase font-mono text-[9px]"
                                >
                                    {verificationResult.status || "FAIL"}
                                </Badge>
                            </div>

                            {verificationResult.isValid && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-outline-variant/20">
                                    <div>
                                        <span className="text-[10px] text-on-surface-variant block">Tier</span>
                                        <span className="font-semibold uppercase font-mono">{verificationResult.tier}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-on-surface-variant block">Seats Used</span>
                                        <span className="font-semibold">
                                            {verificationResult.seats?.activeCount} / {verificationResult.seats?.maxActivations}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-on-surface-variant block">Domain Bound</span>
                                        <span className="font-semibold">
                                            {verificationResult.isDomainActivated ? "Yes (Active)" : "No"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-on-surface-variant block">Remaining</span>
                                        <span className="font-semibold">{verificationResult.seats?.remaining} seats</span>
                                    </div>
                                </div>
                            )}

                            {!verificationResult.isValid && verificationResult.reason && (
                                <p className="text-xs text-error font-medium">{verificationResult.reason}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Licenses List */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-on-surface">Active Purchased Licenses</h3>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 2 }, (_, i) => (
                            <Card key={i} className="border-outline-variant/30 p-5 space-y-4">
                                <Skeleton variant="text" width={120} height={20} />
                                <Skeleton variant="rectangular" width="100%" height={36} className="rounded-xl" />
                                <Skeleton variant="rectangular" width="100%" height={12} className="rounded-full" />
                            </Card>
                        ))}
                    </div>
                ) : licenses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {licenses.map((lic: BuyerLicenseItem) => {
                            const activeCount = lic.activations?.length ?? lic.activation_count ?? 0;
                            const maxActivations = lic.max_activations || 1;
                            const percentUsed = Math.round((activeCount / maxActivations) * 100);
                            const activeDomains = lic.activations?.map((a) => a.domain_or_machine_id) || [];
                            const assetTitle = lic.asset?.title || "Purchased Digital Asset";

                            return (
                                <Card key={lic.id} className="border-outline-variant/30 hover:border-outline-variant/60 transition-all shadow-xs flex flex-col justify-between">
                                    <CardHeader className="space-y-2 pb-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="primary" size="sm" className="font-mono uppercase text-[9px]">
                                                {lic.tier} License
                                            </Badge>
                                            <Badge
                                                variant={lic.status === "active" ? "secondary" : "outline"}
                                                size="sm"
                                                className="uppercase text-[9px]"
                                            >
                                                {lic.status}
                                            </Badge>
                                        </div>

                                        <CardTitle className="text-sm font-bold text-on-surface line-clamp-1">
                                            {assetTitle}
                                        </CardTitle>

                                        {/* Key Display with Copy Button */}
                                        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container font-mono text-xs text-on-surface select-all">
                                            <span className="font-bold tracking-wider">{lic.license_key}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(lic.license_key)}
                                                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                                                title="Copy License Key"
                                            >
                                                <Icons.FileText size={14} />
                                            </button>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4 pt-0">
                                        {/* Seat / Activation Progress Bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-on-surface-variant">Seat Activations:</span>
                                                <span className="font-bold text-on-surface">
                                                    {activeCount} / {maxActivations} domains used
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${
                                                        percentUsed >= 100 ? "bg-amber-500" : "bg-primary"
                                                    }`}
                                                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Active Domains List */}
                                        {activeDomains.length > 0 && (
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-semibold text-on-surface-variant block">
                                                    Active Registered Domains:
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {activeDomains.map((dom) => (
                                                        <span
                                                            key={dom}
                                                            className="px-2 py-0.5 rounded-md bg-surface-container-high text-[11px] font-mono text-on-surface"
                                                        >
                                                            {dom}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="pt-2 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={activeCount >= maxActivations}
                                                onClick={() => {
                                                    setSelectedLicenseKey(lic.license_key);
                                                    setIsActivateModalOpen(true);
                                                }}
                                                className="cursor-pointer text-xs"
                                            >
                                                {activeCount >= maxActivations
                                                    ? "Seats Full"
                                                    : "+ Activate New Domain"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-outline-variant/40 bg-surface">
                        <EmptyState
                            title="No active licenses found"
                            description="You do not have any cryptographic license keys registered to your account yet. When you purchase assets from the catalog, your license keys and seat allocations will appear here."
                            icon={<Icons.Security size={36} />}
                            action={
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => navigate("/explore")}
                                    className="cursor-pointer"
                                >
                                    Browse Marketplace Catalog
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Activate Domain Modal */}
            <Modal
                isOpen={isActivateModalOpen}
                onClose={() => setIsActivateModalOpen(false)}
                title="Register New Domain / Seat"
                description={`Bind a domain name or machine host to license key ${selectedLicenseKey}.`}
            >
                <form onSubmit={handleActivateDomain} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="domain-input">Domain or IP Address *</Label>
                        <Input
                            id="domain-input"
                            placeholder="e.g. app.mycompany.com or 192.168.1.10"
                            value={domainToActivate}
                            onChange={(e) => setDomainToActivate(e.target.value)}
                            className="font-mono text-sm"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                            Once activated, this domain is cryptographically bound to the license key.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsActivateModalOpen(false)}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={activateMutation.isPending}
                            className="cursor-pointer"
                        >
                            Activate Seat
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BuyerLicensesPage;
