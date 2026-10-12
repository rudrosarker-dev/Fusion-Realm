"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";
import { Modal } from "@/components/ui/overlays";

export function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((i) => {
        const next = (i + dir + images.length) % images.length;
        trackRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        return next;
      });
    },
    [images.length],
  );

  const current = images[index];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      {/* thumbnails — desktop rail, mobile dots */}
      <div className="order-2 hidden lg:order-1 lg:flex lg:w-20 lg:flex-col lg:gap-3">
        {images.map((im, i) => (
          <button
            key={i}
            type="button"
            aria-label={`View image ${i + 1} of ${name}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "relative aspect-[3/4] w-20 overflow-hidden bg-cream transition-opacity",
              i === index ? "opacity-100 ring-1 ring-ink" : "opacity-50 hover:opacity-90",
            )}
          >
            <Image src={im.src} alt={im.alt} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* main image — mobile scroll-snap track */}
      <div className="order-1 lg:order-2 lg:flex-1">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar lg:block"
          onScroll={(e) => {
            const el = e.currentTarget;
            if (el.scrollWidth <= el.clientWidth) return;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index && i >= 0 && i < images.length) setIndex(i);
          }}
        >
          {images.map((im, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${im.alt} — open zoom view`}
              onClick={() => {
                setIndex(i);
                setZoomOpen(true);
              }}
              className={cn(
                "relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-cream lg:w-full",
                i === index ? "lg:block" : "lg:hidden",
              )}
            >
              <Image
                src={im.src}
                alt={im.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* dots + arrows */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2" role="tablist" aria-label="Product images">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn("h-px w-6 transition-all", i === index ? "bg-ink" : "bg-line hover:bg-fog")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button aria-label="Previous image" onClick={() => go(-1)} className="flex size-9 items-center justify-center border border-line transition-colors hover:border-ink">
              <ChevronLeft className="size-4" strokeWidth={1.5} />
            </button>
            <button aria-label="Next image" onClick={() => go(1)} className="flex size-9 items-center justify-center border border-line transition-colors hover:border-ink">
              <ChevronRight className="size-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title={`${name} — Detail`} wide>
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-cream">
          <Image src={current.src} alt={current.alt} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      </Modal>
    </div>
  );
}
