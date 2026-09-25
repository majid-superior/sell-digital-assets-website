// src/data/mockAssets.ts
import type { DigitalAsset } from "@/types/asset.ts";
import type { SellerProfile } from "@/types/user.ts";

export const MOCK_SELLERS: Record<string, SellerProfile> = {
    "seller-1": {
        storeName: "Studio Monolith",
        headline: "Boutique Type Foundry & Grid Systems",
        bio: "Crafting precision variable fonts and editorial layouts for discerning brands.",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        verified: true,
        totalSales: 4820,
        rating: 4.9,
        joinedDate: "2023-01-15",
    },
    "seller-2": {
        storeName: "HyperPixel Labs",
        headline: "Production-ready UI Kits & Design Systems",
        bio: "Figma design systems built with auto-layout v5, variables, and dark mode tokens.",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        verified: true,
        totalSales: 12450,
        rating: 4.95,
        joinedDate: "2022-06-10",
    },
    "seller-3": {
        storeName: "PolyCraft 3D",
        headline: "Low-Poly & Stylized 3D Assets for Games",
        bio: "Rigged Blender assets, GLTF/FBX formats, and PBR texturing for game devs.",
        avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        verified: false,
        totalSales: 890,
        rating: 4.75,
        joinedDate: "2024-03-01",
    },
};

export const MOCK_ASSETS: DigitalAsset[] = [
    {
        id: "asset-1",
        sellerId: "seller-2",
        title: "ApexFlow Pro - Enterprise SaaS UI Kit",
        slug: "apexflow-pro-saas-ui-kit",
        description: "Over 450+ responsive desktop and mobile components with variables, tokenized colors, and interactive prototypes for modern web applications.",
        priceCents: 4800, // $48.00
        currency: "USD",
        category: "ui_kit",
        tags: ["figma", "saas", "dashboard", "design-system"],
        thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 124000000, // 124 MB
        fileFormat: ".fig (Figma File)",
        version: "2.4.0",
        ratingAverage: 4.9,
        reviewsCount: 142,
        salesCount: 1280,
        status: "published",
        createdAt: "2024-01-10T10:00:00Z",
        updatedAt: "2024-05-15T12:00:00Z",
    },
    {
        id: "asset-2",
        sellerId: "seller-1",
        title: "Kallisto Display - Variable Serif Font",
        slug: "kallisto-display-variable-serif",
        description: "An elegant, high-contrast serif font featuring optical sizes from text to giant display headings. Includes 18 stylistic sets and multilingual ligatures.",
        priceCents: 3400, // $34.00
        currency: "USD",
        category: "font",
        tags: ["typography", "editorial", "luxury", "variable-font"],
        thumbnailUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 4200000, // 4.2 MB
        fileFormat: ".otf, .woff2",
        version: "1.2.0",
        ratingAverage: 4.95,
        reviewsCount: 88,
        salesCount: 940,
        status: "published",
        createdAt: "2024-02-18T14:30:00Z",
        updatedAt: "2024-06-01T09:15:00Z",
    },
    {
        id: "asset-3",
        sellerId: "seller-3",
        title: "CyberCity Isometric 3D Asset Pack",
        slug: "cybercity-isometric-3d-pack",
        description: "Modular cyberpunk buildings, neon signs, animated holographic billboards, and vehicles. Ready for Unity, Unreal Engine 5, and Three.js.",
        priceCents: 5900, // $59.00
        currency: "USD",
        category: "3d_model",
        tags: ["blender", "gltf", "cyberpunk", "game-dev"],
        thumbnailUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 680000000, // 680 MB
        fileFormat: ".blend, .fbx, .gltf",
        version: "3.0.1",
        ratingAverage: 4.82,
        reviewsCount: 64,
        salesCount: 420,
        status: "published",
        createdAt: "2024-03-05T08:00:00Z",
        updatedAt: "2024-06-12T16:45:00Z",
    },
    {
        id: "asset-4",
        sellerId: "seller-2",
        title: "NovaGlyph - 2,800+ Streamlined Vector Icons",
        slug: "novaglyph-vector-icons",
        description: "Consistent 24px grid vector icons across 7 categories in 4 optical weights: Thin, Light, Regular, and Bold.",
        priceCents: 2600, // $26.00
        currency: "USD",
        category: "icon_set",
        tags: ["icons", "svg", "figma", "vector"],
        thumbnailUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 28000000, // 28 MB
        fileFormat: ".svg, .fig, .iconjar",
        version: "4.1.0",
        ratingAverage: 4.88,
        reviewsCount: 215,
        salesCount: 2450,
        status: "published",
        createdAt: "2023-11-20T11:00:00Z",
        updatedAt: "2024-04-22T15:10:00Z",
    },
    {
        id: "asset-5",
        sellerId: "seller-2",
        title: "Stratum - Dark Mode Analytics Template",
        slug: "stratum-dark-mode-template",
        description: "Production-ready dashboard interface built with Tailwind CSS, Chart.js integrations, and fluid mobile layouts.",
        priceCents: 3900, // $39.00
        currency: "USD",
        category: "template",
        tags: ["react", "tailwind", "dashboard", "charts"],
        thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 45000000, // 45 MB
        fileFormat: "React / Vite source",
        version: "1.0.4",
        ratingAverage: 4.79,
        reviewsCount: 42,
        salesCount: 310,
        status: "published",
        createdAt: "2024-04-02T16:00:00Z",
        updatedAt: "2024-05-30T11:20:00Z",
    },
    {
        id: "asset-6",
        sellerId: "seller-3",
        title: "Claymation 3D Character Rig Kit",
        slug: "claymation-3d-character-rig",
        description: "Fully rigged, expressive claymation characters for games and animations. Features 42 pre-built mocap animations.",
        priceCents: 6400, // $64.00
        currency: "USD",
        category: "3d_model",
        tags: ["characters", "rigged", "animation", "blender"],
        thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
        previewUrls: [
            "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&auto=format&fit=crop&q=80",
        ],
        fileSizeInBytes: 520000000, // 520 MB
        fileFormat: ".blend, .fbx",
        version: "2.0.0",
        ratingAverage: 4.91,
        reviewsCount: 76,
        salesCount: 530,
        status: "published",
        createdAt: "2024-01-25T13:45:00Z",
        updatedAt: "2024-05-18T14:10:00Z",
    },
];
