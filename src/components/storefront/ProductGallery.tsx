"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function ProductGallery({
  images,
  productName,
  overrideUrl,
}: {
  images: { id: string; url: string }[];
  productName: string;
  /** When set (e.g. the customer picked a product option with its own image), takes priority
   *  over the thumbnail selection until the customer manually clicks a thumbnail. */
  overrideUrl?: string | null;
}) {
  const list = images.length > 0 ? images : [{ id: "placeholder", url: "/images/product-placeholder.svg" }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const prevOverrideRef = useRef(overrideUrl);

  useEffect(() => {
    if (overrideUrl !== prevOverrideRef.current) {
      setManualUrl(null); // a newly-selected option image takes priority again
      prevOverrideRef.current = overrideUrl;
    }
  }, [overrideUrl]);

  const displayedUrl = manualUrl ?? overrideUrl ?? list[activeIndex]?.url ?? list[0].url;
  const activeThumbIndex = list.findIndex((img) => img.url === displayedUrl);

  function selectThumbnail(index: number) {
    setActiveIndex(index);
    setManualUrl(list[index].url);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-50"
      >
        <Image
          src={displayedUrl}
          alt={productName}
          fill
          priority
          sizes="(max-width: 640px) 100vw, 480px"
          className="object-cover"
        />
      </button>

      {list.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => selectThumbnail(i)}
              className={clsx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-50",
                i === activeThumbIndex ? "border-primary-500" : "border-transparent"
              )}
            >
              <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative h-full max-h-[80vh] w-full max-w-lg">
            <Image
              src={displayedUrl}
              alt={productName}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
