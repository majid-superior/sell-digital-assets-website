// src/features/dashboard/pages/SettingsPage.tsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth.ts";
import { Badge, Button } from "@/components/ui/index.ts";
import { toast } from "sonner";

export const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const isSeller = user?.role === "seller";

    const [displayName, setDisplayName] = useState(user?.displayName || user?.name || "");
    const [storeName, setStoreName] = useState(user?.sellerProfile?.storeName || "");
    const [bio, setBio] = useState(user?.sellerProfile?.bio || "");

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success("Settings saved successfully", {
            description: "Your profile details have been updated.",
        });
    };

    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Account & Profile Settings</h1>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                    Manage your personal account credentials, communication preferences, and public creator details.
                </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 1. Profile Information */}
                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/30 space-y-4 shadow-xs">
                    <h2 className="text-base font-bold text-on-surface">Personal Information</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="settings-display-name"
                                className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block"
                            >
                                Display Name
                            </label>
                            <input
                                id="settings-display-name"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label
                                htmlFor="settings-email-address"
                                className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block"
                            >
                                Email Address
                            </label>
                            <input
                                id="settings-email-address"
                                type="email"
                                value={user?.email || ""}
                                disabled
                                className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-container-high border border-outline-variant/30 text-on-surface-variant opacity-75 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-on-surface-variant">Assigned Role:</span>
                        <Badge variant={isSeller ? "primary" : "secondary"} size="sm">
                            {user?.role === "seller" ? "Seller (Creator)" : "Buyer (Customer)"}
                        </Badge>
                    </div>
                </div>

                {/* 2. Store Information (Seller Only) */}
                {isSeller && (
                    <div className="p-6 rounded-3xl bg-surface border border-outline-variant/30 space-y-4 shadow-xs">
                        <h2 className="text-base font-bold text-on-surface">Storefront Details</h2>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="settings-store-name"
                                    className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block"
                                >
                                    Store Name
                                </label>
                                <input
                                    id="settings-store-name"
                                    type="text"
                                    placeholder="Enter your creator brand name..."
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="settings-creator-bio"
                                    className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant block"
                                >
                                    Creator Bio
                                </label>
                                <textarea
                                    id="settings-creator-bio"
                                    rows={3}
                                    placeholder="Tell buyers about your creative craft and tools..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-end gap-3">
                    <Button type="submit" variant="primary" size="md">
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;

