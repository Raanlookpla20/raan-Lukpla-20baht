"use client";

import "cropperjs/dist/cropper.css";
import { useEffect, useRef, useState } from "react";
import { Cropper, ReactCropperElement } from "react-cropper";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { detectImageFormat } from "@/lib/image-format";

type AspectMode = "square" | "free";

interface ImageCropModalProps {
  file: File;
  queueLabel?: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// Sniff the first bytes so an iOS photo mislabelled "image/jpeg" is still
// recognised, and fall back to the declared type / extension when the sniff
// is inconclusive.
async function looksLikeHeic(file: File): Promise<boolean> {
  try {
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (detectImageFormat(header) === "heic") return true;
  } catch {
    // fall through to the cheaper heuristics
  }
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export function ImageCropModal({ file, queueLabel, onConfirm, onCancel }: ImageCropModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectMode, setAspectMode] = useState<AspectMode>("square");
  const [zoom, setZoom] = useState(1);
  const [zoomBounds, setZoomBounds] = useState<{ min: number; max: number }>({ min: 1, max: 3 });
  const [processing, setProcessing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [preparing, setPreparing] = useState(false);
  // True once a HEIC source has been converted to JPEG in the browser, so the
  // crop output is always flattened to JPEG regardless of the original type.
  const convertedFromHeicRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setLoadFailed(false);
    setImageUrl(null);
    setPreparing(false);
    convertedFromHeicRef.current = false;

    async function prepare() {
      let displayBlob: Blob = file;

      if (await looksLikeHeic(file)) {
        if (cancelled) return;
        setPreparing(true);
        try {
          // Dynamic import: heic2any bundles a full libheif build, so it must
          // stay out of the main bundle and only load when a HEIC is picked.
          const heic2any = (await import("heic2any")).default;
          const result = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
          displayBlob = Array.isArray(result) ? result[0] : result;
          convertedFromHeicRef.current = true;
        } catch {
          // Corrupt file or library error — drop back to the old behaviour:
          // show the "can't preview" notice and let the user cancel to upload
          // the original (the server converts HEIC on its own).
          if (!cancelled) {
            setPreparing(false);
            setLoadFailed(true);
          }
          return;
        }
      }

      if (cancelled) return;
      objectUrl = URL.createObjectURL(displayBlob);
      setImageUrl(objectUrl);
      setPreparing(false);
    }

    void prepare();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
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

  // Output PNG when the source is a real PNG so transparency survives the crop;
  // every other format — including a HEIC that we just converted to JPEG — is
  // flattened to JPEG like the rest of the pipeline expects.
  function outputMime(): string {
    if (convertedFromHeicRef.current) return "image/jpeg";
    return file.type === "image/png" ? "image/png" : "image/jpeg";
  }

  function handleConfirm() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setProcessing(true);
    // getCroppedCanvas() returns null if the source image never actually
    // loaded — fall back to the "can't preview" notice instead of crashing on
    // a null canvas.
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
      outputMime(),
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
              className={clsx(
                "flex items-center justify-center px-3 py-1 max-sm:min-h-11 max-sm:px-4",
                aspectMode === "square" ? "bg-primary-500 text-white" : "bg-white text-slate-600"
              )}
            >
              จัตุรัส
            </button>
            <button
              type="button"
              onClick={() => handleAspectChange("free")}
              className={clsx(
                "flex items-center justify-center px-3 py-1 max-sm:min-h-11 max-sm:px-4",
                aspectMode === "free" ? "bg-primary-500 text-white" : "bg-white text-slate-600"
              )}
            >
              อิสระ
            </button>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-lg bg-slate-900"
          style={{ height: "min(60vh, 420px)" }}
        >
          {preparing && (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-white">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              กำลังเตรียมรูปภาพ...
            </div>
          )}
          {imageUrl && !loadFailed && !preparing && (
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
          {loadFailed && !preparing && (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-white">
              ไม่สามารถแสดงตัวอย่างรูปนี้ได้ในเบราว์เซอร์ (เช่น ไฟล์ HEIC) กด
              &quot;ยกเลิก&quot; เพื่อใช้รูปต้นฉบับแทน ระบบจะแปลงไฟล์ให้อัตโนมัติตอนอัปโหลด
            </div>
          )}
        </div>

        {!loadFailed && !preparing && imageUrl && (
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
          <Button
            fullWidth
            onClick={handleConfirm}
            disabled={processing || preparing || !imageUrl || loadFailed}
          >
            {processing ? "กำลังครอบตัด..." : "ยืนยัน"}
          </Button>
        </div>
      </div>
    </div>
  );
}
