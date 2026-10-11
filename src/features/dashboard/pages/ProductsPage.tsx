// src/features/dashboard/pages/ProductsPage.tsx
import React, { useState } from "react";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge } from "@/components/ui/index.ts";
import { toast } from "sonner";

interface SellerProduct {
    id: string;
    title: string;
    price: string;
    category: string;
    salesCount: number;
    revenue: string;
    status: "active" | "draft" | "review";
    lastUpdated: string;
}

const MOCK_PRODUCTS: SellerProduct[] = [
    {
        id: "prod-1",
        title: "Cyberpunk 3D Character Pack",
        price: "$49.00",
        category: "3D Models",
        salesCount: 48,
        revenue: "$2,352.00",
        status: "active",
        lastUpdated: "2 days ago",
    },
    {
        id: "prod-2",
        title: "Neon UI Dashboard Kit",
        price: "$35.00",
        category: "UI Kits",
        salesCount: 62,
        revenue: "$2,170.00",
        status: "active",
        lastUpdated: "1 week ago",
    },
    {
        id: "prod-3",
        title: "Lo-Fi Audio Loop Collection",
        price: "$24.00",
        category: "Audio",
        salesCount: 32,
        revenue: "$768.00",
        status: "active",
        lastUpdated: "Sep 20, 2026",
    },
    {
        id: "prod-4",
        title: "Retro Arcade Sound Effects",
        price: "$19.00",
        category: "Audio",
        salesCount: 0,
        revenue: "$0.00",
        status: "draft",
        lastUpdated: "Draft",
    },
];

export const ProductsPage: React.FC = () => {
    const [search, setSearch] = useState("");

    const filtered = MOCK_PRODUCTS.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header + Add Product CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-on-surface">My Digital Products</h1>
                    <p className="text-xs sm:text-sm text-on-surface-variant">
                        Manage your store listings, pricing, digital file uploads, and sales status.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="sm"
                    className="gap-2 shrink-0 font-semibold"
                    onClick={() => toast.info("Product creator modal will be available in the next release.")}
                >
                    <Icons.Plus size={16} />
                    <span>Create New Product</span>
                </Button>
            </div>

            {/* Filter Search */}
            <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant/70">
                    <Icons.Search size={16} />
                </div>
                <input
                    type="text"
                    placeholder="Search by title or category..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>

            {/* Products Table */}
            <div className="rounded-2xl bg-surface border border-outline-variant/30 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 bg-surface-container-low border-b border-outline-variant/20">
                            <tr>
                                <th className="py-3.5 px-4">Product Name</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Price</th>
                                <th className="py-3.5 px-4">Sales</th>
                                <th className="py-3.5 px-4">Revenue</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                            {filtered.map((prod) => (
                                <tr key={prod.id} className="hover:bg-surface-container-low/50 transition-colors">
                                    <td className="py-3.5 px-4 font-semibold text-on-surface">
                                        {prod.title}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                                        <Badge variant="secondary" size="sm">
                                            {prod.category}
                                        </Badge>
                                    </td>
                                    <td className="py-3.5 px-4 font-bold">{prod.price}</td>
                                    <td className="py-3.5 px-4 text-xs">{prod.salesCount} sold</td>
                                    <td className="py-3.5 px-4 font-semibold text-emerald-500">{prod.revenue}</td>
                                    <td className="py-3.5 px-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                prod.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-surface-container-high text-on-surface-variant"
                                            }`}
                                        >
                                            {prod.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => toast.info(`Editing ${prod.title}`)}
                                            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductsPage;

