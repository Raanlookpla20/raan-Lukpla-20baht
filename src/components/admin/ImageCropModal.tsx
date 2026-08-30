"use client";

import "cropperjs/dist/cropper.css";
import { useEffect, useRef, useState } from "react";
import { Cropper, ReactCropperElement } from "react-cropper";
import { Button } from "@/components/ui/Button";

type AspectMode = "square" | "free";

interface ImageCropModalProps {
  file: File;
  queueLabel?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// Output PNG when the source is PNG so transparency survives the crop;
// every other format (including HEIC, which the upload endpoint converts
// separately) is flattened to JPEG like the rest of the pipeline expects.
function outputMimeFor(file: File): string {
  return file.type === "image/png" ? "image/png" : "image/jpeg";
}

export function ImageCropModal({ file, queueLabel, onConfirm, onCancel }: ImageCropModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectMode, setAspectMode] = useState<AspectMode>("square");
  const [zoom, setZoom] = useState(1);
  const [zoomBounds, setZoomBounds] = useState<{ min: number; max: number }>({ min: 1, max: 3 });
  const [processing, setProcessing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleImageError() {
    setLoadFailed(true);
  }

  function handleReady() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const imageData = cropper.getImageData();
    const initialRatio = imageData.naturalWidth > 0 ? imageData.width / imageData.naturalWidth : 1;
    setZoomBounds({ min: initialRatio, max: initialRatio * 3 });
    setZoom(initialRatio);
  }

  function handleZoomEvent(event: Cropper.ZoomEvent<HTMLImageElement>) {
    setZoom(event.detail.ratio);
  }

  function handleZoomSlider(value: number) {
    setZoom(value);
    cropperRef.current?.cropper.zoomTo(value);
  }

  function handleAspectChange(mode: AspectMode) {
    setAspectMode(mode);
    cropperRef.current?.cropper.setAspectRatio(mode === "square" ? 1 : NaN);
  }

  function handleConfirm() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setProcessing(true);
    // getCroppedCanvas() returns null if the source image never actually
    // loaded (e.g. HEIC, which browsers can't decode in an <img> tag even
    // though selecting the file and creating an object URL succeeds) — fall
    // back to the original file instead of crashing on a null canvas.
    const canvas = cropper.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
      maxWidth: 2048,
      maxHeight: 2048,
    });
    if (!canvas) {
      setProcessing(false);
      setLoadFailed(true);
      return;
    }
    canvas.toBlob(
      (blob) => {
        setProcessing(false);
        if (blob) onConfirm(blob);
        else onCancel();
      },
      outputMimeFor(file),
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-lg flex-col gap-3 rounded-2xl bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">
            ครอบตัดรูปภาพ{queueLabel ? ` (${queueLabel})` : ""}
          </p>
          <div className="flex overflow-hidden rounded-full border border-[var(--color-border)] text-xs">
            <button
              type="button"
              onClick={() => handleAspectChange("square")}
              className={
                aspectMode === "square"
                  ? "bg-primary-500 px-3 py-1 text-white"
                  : "bg-white px-3 py-1 text-slate-600"
              }
            >
              จัตุรัส
            </button>
            <button
              type="button"
              onClick={() => handleAspectChange("free")}
              className={
                aspectMode === "free"
                  ? "bg-primary-500 px-3 py-1 text-white"
                  : "bg-white px-3 py-1 text-slate-600"
              }
            >
              อิสระ
            </button>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-lg bg-slate-900"
          style={{ height: "min(60vh, 420px)" }}
        >
          {imageUrl && !loadFailed && (
            <Cropper
              ref={cropperRef}
              src={imageUrl}
              style={{ height: "100%", width: "100%" }}
              aspectRatio={1}
              viewMode={1}
              dragMode="move"
              autoCropArea={1}
              cropBoxMovable
              cropBoxResizable
              guides
              background={false}
              responsive
              zoomOnWheel
              zoomOnTouch
              wheelZoomRatio={0.1}
              ready={handleReady}
              zoom={handleZoomEvent}
              onError={handleImageError}
            />
          )}
          {loadFailed && (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white">
              ไม่สามารถแสดงตัวอย่างรูปนี้ได้ในเบราว์เซอร์ (เช่น ไฟล์ HEIC) กด
              &quot;ยกเลิก&quot; เพื่อใช้รูปต้นฉบับแทน ระบบจะแปลงไฟล์ให้อัตโนมัติตอนอัปโหลด
            </div>
          )}
        </div>

        {!loadFailed && (
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">ซูม</span>
            <input
              type="range"
              min={zoomBounds.min}
              max={zoomBounds.max}
              step={(zoomBounds.max - zoomBounds.min) / 100 || 0.01}
              value={zoom}
              onChange={(e) => handleZoomSlider(Number(e.target.value))}
              className="flex-1"
            />
          </label>
        )}

        <div className="flex gap-2">
          <Button variant="outline" fullWidth onClick={onCancel} disabled={processing}>
            ยกเลิก (ใช้รูปเดิม)
          </Button>
          <Button fullWidth onClick={handleConfirm} disabled={processing || !imageUrl || loadFailed}>
            {processing ? "กำลังครอบตัด..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  );
}
