// src/features/website/components/landingMedia.ts
// Showcase media for the landing page. Swap these for real catalog assets when available.

export type ShowcaseMedia =
    | { kind: "image"; id: string; src: string; alt: string; author: string; aspect: string }
    | { kind: "video"; id: string; src: string; poster: string; alt: string; author: string; aspect: string; duration: string };

const photo = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const GTV = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

export const HERO_MEDIA_COLUMNS: ShowcaseMedia[][] = [
    [
        { kind: "image", id: "c1-1", src: photo("alpine-lake", 480, 640), alt: "Mountain lake at dawn", author: "Lena M.", aspect: "aspect-[3/4]" },
        { kind: "video", id: "c1-2", src: `${GTV}/ForBiggerBlazes.mp4`, poster: photo("blaze", 480, 360), alt: "Cinematic fire footage", author: "Studio Nova", aspect: "aspect-[4/3]", duration: "0:15" },
        { kind: "image", id: "c1-3", src: photo("city-neon", 480, 600), alt: "Neon city street at night", author: "Kenji A.", aspect: "aspect-[4/5]" },
    ],
    [
        { kind: "video", id: "c2-1", src: `${GTV}/ForBiggerEscapes.mp4`, poster: photo("escape", 480, 640), alt: "Aerial travel footage", author: "Drift Films", aspect: "aspect-[3/4]", duration: "0:15" },
        { kind: "image", id: "c2-2", src: photo("desert-dunes", 480, 480), alt: "Golden desert dunes", author: "Amira S.", aspect: "aspect-square" },
        { kind: "image", id: "c2-3", src: photo("forest-fog", 480, 640), alt: "Foggy forest path", author: "Jonas W.", aspect: "aspect-[3/4]" },
    ],
    [
        { kind: "image", id: "c3-1", src: photo("ocean-wave", 480, 600), alt: "Turquoise ocean wave", author: "Maya R.", aspect: "aspect-[4/5]" },
        { kind: "image", id: "c3-2", src: photo("studio-portrait", 480, 360), alt: "Studio portrait", author: "Theo B.", aspect: "aspect-[4/3]" },
        { kind: "video", id: "c3-3", src: `${GTV}/ForBiggerJoyrides.mp4`, poster: photo("joyride", 480, 640), alt: "Road trip footage", author: "Open Road Co.", aspect: "aspect-[3/4]", duration: "0:15" },
    ],
];

export const HERO_TRENDING_TAGS = ["Nature", "4K drone", "Business", "Abstract", "Cityscape", "Slow motion"];

export const SHOWCASE_GALLERY: ShowcaseMedia[] = HERO_MEDIA_COLUMNS.flat();

export interface Collection {
    id: string;
    title: string;
    count: string;
    image: string;
    query: string;
}

export const LANDING_COLLECTIONS: Collection[] = [
    { id: "nature", title: "Nature & Landscapes", count: "412K", image: photo("collection-nature", 800, 1000), query: "nature" },
    { id: "aerial", title: "Aerial & Drone", count: "86K", image: photo("collection-aerial", 800, 600), query: "drone" },
    { id: "people", title: "People & Lifestyle", count: "298K", image: photo("collection-people", 800, 600), query: "lifestyle" },
    { id: "business", title: "Business & Tech", count: "174K", image: photo("collection-business", 800, 600), query: "business" },
    { id: "abstract", title: "Abstract & Texture", count: "121K", image: photo("collection-abstract", 800, 600), query: "abstract" },
];

export const SPOTLIGHT_VIDEO = {
    src: `${GTV}/ForBiggerFun.mp4`,
    poster: photo("spotlight-reel", 1280, 720),
    alt: "Featured 4K showreel",
};
