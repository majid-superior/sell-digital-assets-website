// src/features/dashboard/pages/PurchasesPage.tsx
import React, { useState } from "react";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge } from "@/components/ui/index.ts";
import { toast } from "sonner";

interface PurchasedItem {
    id: string;
    title: string;
    category: string;
    version: string;
    purchaseDate: string;
    fileSize: string;
    license: string;
    downloadUrl: string;
    thumbnailUrl?: string;
}

const MOCK_PURCHASES: PurchasedItem[] = [
    {
        id: "p1",
        title: "NextGen 3D Sci-Fi Vehicles Pack",
        category: "3D Models",
        version: "v2.1",
        purchaseDate: "Oct 10, 2026",
        fileSize: "1.4 GB",
        license: "Commercial License",
        downloadUrl: "#",
    },
    {
        id: "p2",
        title: "Minimalist Tailwind UI Components Kit",
        category: "Templates & Code",
        version: "v1.4",
        purchaseDate: "Oct 04, 2026",
        fileSize: "45 MB",
        license: "Extended License",
        downloadUrl: "#",
    },
    {
        id: "p3",
        title: "Cinematic Soundscapes & Foley Vol. 1",
        category: "Audio & Music",
        version: "v1.0",
        purchaseDate: "Sep 28, 2026",
        fileSize: "820 MB",
        license: "Royalty-Free Commercial",
        downloadUrl: "#",
    },
    {
        id: "p4",
        title: "Photorealistic Clay Mockups for Figma",
        category: "Graphics & UI",
        version: "v3.0",
        purchaseDate: "Aug 15, 2026",
        fileSize: "310 MB",
        license: "Standard License",
        downloadUrl: "#",
    },
];

export const PurchasesPage: React.FC = () => {
    const [search, setSearch] = useState("");

    const filtered = MOCK_PURCHASES.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleDownload = (item: PurchasedItem) => {
        toast.success("Download started", {
            description: `Downloading ${item.title} (${item.fileSize})`,
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Purchases & Downloads</h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                        All your purchased digital assets, license keys, and downloadable archives.
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                        <Icons.Search size={16} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search your library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Purchases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-surface border border-outline-variant/30 hover:border-outline-variant/60 transition-all flex flex-col justify-between space-y-4 shadow-xs"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <Badge variant="secondary" size="sm">
                                    {item.category}
                                </Badge>
                                <span className="font-mono text-[11px] text-on-surface-variant">{item.version}</span>
                            </div>

                            <h3 className="font-bold text-base text-on-surface line-clamp-1">{item.title}</h3>

                            <div className="text-xs text-on-surface-variant space-y-0.5">
                                <p>License: <strong className="text-on-surface">{item.license}</strong></p>
                                <p>Purchased: {item.purchaseDate} • {item.fileSize}</p>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="sm"
                            className="w-full gap-2 text-xs font-semibold"
                            onClick={() => handleDownload(item)}
                        >
                            <Icons.Download size={14} />
                            <span>Download Files</span>
                        </Button>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-on-surface-variant space-y-2">
                    <Icons.NoResults size={36} className="mx-auto text-on-surface-variant/60" />
                    <p className="text-sm font-semibold">No digital assets found</p>
                    <p className="text-xs">Try adjusting your search query</p>
                </div>
            )}
        </div>
    );
};

export default PurchasesPage;

