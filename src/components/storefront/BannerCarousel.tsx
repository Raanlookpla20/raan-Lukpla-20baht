"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function BannerCarousel({ banners }: { banners: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative aspect-[2.5/1] w-full overflow-hidden rounded-2xl bg-slate-100 sm:aspect-[3/1]">
      {banners.map((src, i) => (
        <div
          key={src + i}
          className={clsx(
            "absolute inset-0 transition-opacity duration-500",
            i === index ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={src}
            alt={`banner-${i + 1}`}
            fill
            priority={i === 0}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ))}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`ไปที่แบนเนอร์ ${i + 1}`}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
