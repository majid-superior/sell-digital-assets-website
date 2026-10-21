// src/website/HeroSearch.tsx
import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Modal } from "@/components/ui/index.ts";

export type SearchMode = "search" | "generate";

export interface AssetTypeOption {
  label: string;
  value: string;
  categorySlug?: string;
}

const ASSET_TYPES: AssetTypeOption[] = [
  { label: "All Assets", value: "all" },
  { label: "Photos", value: "photos", categorySlug: "photos" },
  { label: "Vectors", value: "vectors", categorySlug: "vectors" },
  { label: "Illustrations", value: "illustrations", categorySlug: "illustrations" },
  { label: "Videos", value: "videos", categorySlug: "videos" },
  { label: "3D Models", value: "3d", categorySlug: "3d-models" },
  { label: "Templates", value: "templates", categorySlug: "templates" },
];

const TRENDING_KEYWORDS = [
  "Backgrounds",
  "Generative AI",
  "Cyberpunk",
  "Minimalist",
  "Textures",
  "Abstract 3D",
  "Social Media",
];

const GENERATE_STYLES = [
  "Photorealistic",
  "Digital Art",
  "3D Render",
  "Cinematic",
  "Anime",
  "Watercolor",
];

export const HeroSearch: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SearchMode>("search");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Photorealistic");
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const [visualSearchFile, setVisualSearchFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const activeType = ASSET_TYPES.find((t) => t.value === selectedType);
    const categoryParam = activeType?.categorySlug ? `&category=${encodeURIComponent(activeType.categorySlug)}` : "";

    if (query) {
      void navigate(`/explore?q=${encodeURIComponent(query)}${categoryParam}`);
    } else if (activeType?.categorySlug) {
      void navigate(`/explore?category=${encodeURIComponent(activeType.categorySlug)}`);
    } else {
      void navigate("/explore");
    }
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = generatePrompt.trim();
    if (!prompt) {
      toast.info("Please enter a creative prompt", {
        description: "Describe the subject, lighting, and composition you want to generate.",
      });
      return;
    }

    toast.success("AI Studio Prompt Dispatched", {
      description: `Searching library for generative matches: "${prompt}" in ${selectedStyle} style.`,
    });

    void navigate(`/explore?q=${encodeURIComponent(prompt)}&ai=true&style=${encodeURIComponent(selectedStyle)}`);
  };

  const handleVisualSearchFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid Image File", {
        description: "Please upload a PNG, JPEG, or WebP image for visual search.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File Too Large", {
        description: "Image size exceeds 10 MB limit for visual search analysis.",
      });
      return;
    }

    setVisualSearchFile(file);
    const derivedQuery = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    toast.info("Analyzing Image Query", {
      description: `Searching visual similarity for "${derivedQuery}"...`,
    });

    setIsVisualSearchOpen(false);
    void navigate(`/explore?q=${encodeURIComponent(derivedQuery)}&visualSearch=true`);
  };

  return (
    <section className="relative w-full py-10 sm:py-16 lg:py-20 overflow-hidden">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
        {/* Main Headline */}
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-on-surface text-balance">
            Find the perfect high-res stock assets and royalty-free creative resources
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-2xl mx-auto text-balance">
            Over 300 million authentic photos, vectors, 4K footage, 3D models, and design templates for commercial projects.
          </p>
        </div>

        {/* Search / Generate Mode Toggle */}
        <div className="flex items-center justify-center">
          <div
            role="tablist"
            aria-label="Search mode"
            className="inline-flex p-1 rounded-full bg-surface-container-high border border-outline-variant/30 shadow-inner"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "search"}
              onClick={() => setMode("search")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === "search"
                  ? "bg-primary text-on-primary shadow-xs scale-100"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icons.Search size={16} />
              <span>Search Assets</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === "generate"}
              onClick={() => setMode("generate")}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                mode === "generate"
                  ? "bg-primary text-on-primary shadow-xs scale-100"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <Icons.Magic size={16} />
              <span>Generate with AI</span>
            </button>
          </div>
        </div>

        {/* Main Input Control Bar */}
        {mode === "search" ? (
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex flex-col sm:flex-row items-stretch bg-surface border border-outline-variant/40 rounded-2xl sm:rounded-full p-2 shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all text-left"
          >
            {/* Asset Type Select Dropdown */}
            <div className="relative shrink-0 border-b sm:border-b-0 sm:border-r border-outline-variant/30 px-3 py-1.5 flex items-center">
              <label htmlFor="asset-type-select" className="sr-only">
                Asset Type
              </label>
              <select
                id="asset-type-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-medium text-on-surface focus:outline-hidden cursor-pointer pr-6 py-1 appearance-none w-full"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-surface text-on-surface">
                    {type.label}
                  </option>
                ))}
              </select>
              <Icons.ChevronDown
                size={14}
                className="absolute right-3 pointer-events-none text-on-surface-variant"
              />
            </div>

            {/* Main Text Input */}
            <div className="flex-1 flex items-center px-3 py-1 min-w-0">
              <Icons.Search size={18} className="text-on-surface-variant/70 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stock assets, vectors, 3D, video..."
                aria-label="Search stock assets"
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search input"
                  className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <Icons.Close size={15} />
                </button>
              )}
            </div>

            {/* Visual Search & Submit Buttons */}
            <div className="flex items-center gap-2 px-1 pt-2 sm:pt-0 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setIsVisualSearchOpen(true)}
                title="Visual search — Search by image"
                aria-label="Visual search — Search by image"
                className="p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <Icons.Image size={18} />
              </button>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="rounded-xl sm:rounded-full px-6 font-semibold"
              >
                Search
              </Button>
            </div>
          </form>
        ) : (
          /* Generate with AI Mode */
          <form
            onSubmit={handleGenerateSubmit}
            className="space-y-4 bg-surface border border-outline-variant/40 rounded-3xl p-4 sm:p-6 shadow-lg text-left"
          >
            <div className="space-y-2">
              <label htmlFor="generate-prompt-input" className="text-xs font-bold text-on-surface flex items-center gap-2">
                <Icons.Magic size={14} className="text-primary" />
                <span>Describe the creative asset you want to generate</span>
              </label>
              <div className="relative">
                <textarea
                  id="generate-prompt-input"
                  rows={3}
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="e.g. Futuristic glass skyscraper overgrown with lush tropical vines at sunset, cinematic lighting, ultra-detailed 8K..."
                  className="w-full p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-on-surface-variant block">Select Style:</span>
              <div className="flex flex-wrap gap-2">
                {GENERATE_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      selectedStyle === style
                        ? "bg-primary text-on-primary shadow-xs"
                        : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
              <span className="text-xs text-on-surface-variant">Powered by Commercial Safe Generative AI</span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                leftIcon={<Icons.Magic size={16} />}
                className="rounded-full px-6"
              >
                Generate
              </Button>
            </div>
          </form>
        )}

        {/* Footer info: My Libraries link & Trending Keywords */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs">
          {/* Trending Searches */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-on-surface-variant font-medium">Trending:</span>
            {TRENDING_KEYWORDS.map((tag) => (
              <Link
                key={tag}
                to={`/explore?q=${encodeURIComponent(tag)}`}
                className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors font-medium border border-outline-variant/20"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* My Libraries Link */}
          <Link
            to="/dashboard/buyer/library/downloads"
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold ml-auto"
          >
            <Icons.Library size={15} />
            <span>My Libraries</span>
          </Link>
        </div>
      </div>

      {/* Visual Search Modal Dialog */}
      <Modal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
        title="Visual Search / Search by Image"
        description="Drag and drop an image or browse a file to find visually similar assets in our catalog."
        size="md"
      >
        <div className="space-y-4">
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
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleVisualSearchFile(e.dataTransfer.files[0]);
              }
            }}
            className="p-8 border-2 border-dashed border-outline-variant/60 rounded-2xl bg-surface-container-low/50 hover:bg-surface-container hover:border-primary text-center flex flex-col items-center justify-center cursor-pointer transition-colors group"
          >
            <Icons.Image size={40} className="text-primary mb-3 transition-transform group-hover:scale-110" />
            <span className="text-sm font-bold text-on-surface">Drop your image here, or browse</span>
            <span className="text-xs text-on-surface-variant mt-1">
              Supports JPG, PNG, and WebP up to 10 MB
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleVisualSearchFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>

          {visualSearchFile && (
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between text-xs">
              <span className="truncate max-w-60 font-medium text-on-surface">{visualSearchFile.name}</span>
              <span className="text-primary font-semibold">Ready to analyze</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVisualSearchOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default HeroSearch;

