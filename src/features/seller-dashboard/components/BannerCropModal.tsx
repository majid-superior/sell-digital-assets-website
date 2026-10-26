// src/features/seller-dashboard/components/BannerCropModal.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Modal } from "../../../components/ui/Modal.tsx";
import { Icons } from "../../../lib/icons/index.ts";

export const BANNER_TARGET_WIDTH = 1200;
export const BANNER_TARGET_HEIGHT = 400;
export const BANNER_ASPECT_RATIO = BANNER_TARGET_WIDTH / BANNER_TARGET_HEIGHT; // 3:1

export interface BannerCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  originalDimensions?: { width: number; height: number } | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeBaseCropSize(imgWidth: number, imgHeight: number): {
  baseWidth: number;
  baseHeight: number;
} {
  const imgAspect = imgWidth / imgHeight;
  if (imgAspect >= BANNER_ASPECT_RATIO) {
    // Image is wider than 3:1 -> full height, 3 * height width
    return {
      baseWidth: imgHeight * BANNER_ASPECT_RATIO,
      baseHeight: imgHeight,
    };
  }
  // Image is taller than 3:1 -> full width, width / 3 height
  return {
    baseWidth: imgWidth,
    baseHeight: imgWidth / BANNER_ASPECT_RATIO,
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export const BannerCropModal: React.FC<BannerCropModalProps> = ({
  isOpen,
  imageSrc,
  originalDimensions,
  onClose,
  onCropComplete,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  // Normalized center of crop in [0, 1] relative to image dimensions
  const [centerRatio, setCenterRatio] = useState<{ x: number; y: number }>({
    x: 0.5,
    y: 0.5,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startCenterX: number;
    startCenterY: number;
  } | null>(null);

  const getCropRect = useCallback(
    (img: HTMLImageElement, currentZoom: number, center: { x: number; y: number }): CropRect => {
      const { baseWidth, baseHeight } = computeBaseCropSize(
        img.naturalWidth,
        img.naturalHeight
      );
      const cropWidth = baseWidth / currentZoom;
      const cropHeight = baseHeight / currentZoom;

      const desiredX = center.x * img.naturalWidth - cropWidth / 2;
      const desiredY = center.y * img.naturalHeight - cropHeight / 2;

      const x = clamp(desiredX, 0, Math.max(0, img.naturalWidth - cropWidth));
      const y = clamp(desiredY, 0, Math.max(0, img.naturalHeight - cropHeight));

      return { x, y, width: cropWidth, height: cropHeight };
    },
    []
  );

  // Load image whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      return;
    }

    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (isCancelled) return;
      loadedImageRef.current = img;
      setZoom(1);
      setCenterRatio({ x: 0.5, y: 0.5 });
      setImageReady(true);
    };
    img.src = imageSrc;

    return () => {
      isCancelled = true;
      loadedImageRef.current = null;
      setImageReady(false);
    };
  }, [isOpen, imageSrc]);

  // Draw cropped region + rule-of-thirds guide onto preview canvas
  useEffect(() => {
    if (!isOpen || !imageReady) return;
    const canvas = previewCanvasRef.current;
    const img = loadedImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const crop = getCropRect(img, zoom, centerRatio);

    ctx.clearRect(0, 0, BANNER_TARGET_WIDTH, BANNER_TARGET_HEIGHT);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      BANNER_TARGET_WIDTH,
      BANNER_TARGET_HEIGHT
    );
  }, [isOpen, imageReady, zoom, centerRatio, getCropRect]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loadedImageRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCenterX: centerRatio.x,
      startCenterY: centerRatio.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStartRef.current || !loadedImageRef.current) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const img = loadedImageRef.current;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const { baseWidth, baseHeight } = computeBaseCropSize(
      img.naturalWidth,
      img.naturalHeight
    );
    const cropWidth = baseWidth / zoom;
    const cropHeight = baseHeight / zoom;

    const deltaClientX = e.clientX - dragStartRef.current.clientX;
    const deltaClientY = e.clientY - dragStartRef.current.clientY;

    // Dragging image right moves crop window left
    const deltaImgX = -(deltaClientX / rect.width) * cropWidth;
    const deltaImgY = -(deltaClientY / rect.height) * cropHeight;

    const minCenterX = (cropWidth / 2) / img.naturalWidth;
    const maxCenterX = 1 - minCenterX;
    const minCenterY = (cropHeight / 2) / img.naturalHeight;
    const maxCenterY = 1 - minCenterY;

    const nextCenterX = clamp(
      dragStartRef.current.startCenterX + deltaImgX / img.naturalWidth,
      minCenterX,
      maxCenterX
    );
    const nextCenterY = clamp(
      dragStartRef.current.startCenterY + deltaImgY / img.naturalHeight,
      minCenterY,
      maxCenterY
    );

    setCenterRatio({ x: nextCenterX, y: nextCenterY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleResetCrop = () => {
    setZoom(1);
    setCenterRatio({ x: 0.5, y: 0.5 });
  };

  const handleApplyCrop = () => {
    const img = loadedImageRef.current;
    if (!img) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = BANNER_TARGET_WIDTH;
    exportCanvas.height = BANNER_TARGET_HEIGHT;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const crop = getCropRect(img, zoom, centerRatio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      BANNER_TARGET_WIDTH,
      BANNER_TARGET_HEIGHT
    );

    // Export as WebP (or PNG/JPEG fallback)
    let dataUrl = exportCanvas.toDataURL("image/webp", 0.9);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
    }
    onCropComplete(dataUrl);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title="Crop Storefront Banner (1200 × 400 px • 3:1 Ratio)"
      description={
        originalDimensions
          ? `Uploaded image is ${originalDimensions.width} × ${originalDimensions.height} px. Drag to reposition and zoom to fit the required 1200 × 400 px (3:1) banner frame.`
          : "Drag to reposition and zoom to fit the required 1200 × 400 px (3:1) banner frame."
      }
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-outline-variant/60 bg-surface-container-high text-on-surface text-label-lg hover:bg-surface-container-highest transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={!imageReady}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary-container text-on-primary text-label-lg hover:opacity-95 disabled:opacity-50 transition-colors duration-150 cursor-pointer"
          >
            <Icons.Check size={16} />
            <span>Use Cropped Image (1200 × 400)</span>
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Interactive 3:1 Crop Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-outline-variant/60 bg-surface-container-lowest select-none">
          <canvas
            ref={previewCanvasRef}
            width={BANNER_TARGET_WIDTH}
            height={BANNER_TARGET_HEIGHT}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`w-full aspect-3/1 block touch-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          />

          {/* Rule-of-Thirds Visual Grid Overlay */}
          <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-r border-b border-white/25" />
            <div className="border-b border-white/25" />
            <div className="border-r border-white/25" />
            <div className="border-r border-white/25" />
            <div />
          </div>

          <div className="pointer-events-none absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-md bg-black/70 text-white text-badge-caption">
            Drag to Reposition • Output: 1200 × 400 px (3:1)
          </div>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
          <div className="flex items-center gap-3 flex-1">
            <label
              htmlFor="banner-crop-zoom"
              className="text-body-sm font-semibold text-on-surface shrink-0"
            >
              Zoom ({zoom.toFixed(2)}×)
            </label>
            <input
              id="banner-crop-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary-container cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleResetCrop}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-body-sm font-medium hover:bg-surface-container-highest transition-colors duration-150 cursor-pointer shrink-0"
          >
            <Icons.RotateCcw size={14} />
            <span>Reset Position</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BannerCropModal;

