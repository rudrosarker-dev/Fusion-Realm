// START OF FILE src/components/home/draggable-carousel.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/types";

export function DraggableCarousel({ products }: { products: Product[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [progress, setProgress] = useState(0);

  const updateProgress = () => {
    const el = sliderRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max > 0) {
      setProgress((el.scrollLeft / max) * 100);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = sliderRef.current;
    if (!el) return;
    setIsDown(true);
    setHasMoved(false);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const el = sliderRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.6;
    if (Math.abs(walk) > 5) setHasMoved(true);
    el.scrollLeft = scrollLeft - walk;
    updateProgress();
  };

  const scroll = (direction: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(updateProgress, 350);
  };

  return (
    <div className="relative group/carousel">
      {/* অ্যারো বাটনগুলো এখন সুন্দর গ্যাপ নিয়ে ঠিক ডান পাশে অবস্থান করবে, লেখার ওপর উঠবে না */}
      <div className="hidden sm:flex items-center gap-2 absolute -top-16 right-0 z-10">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Previous pieces"
          className="size-9 border border-line bg-paper/80 flex items-center justify-center text-ink hover:border-gold hover:text-gold-dark transition-colors cursor-pointer shadow-xs rounded-xs"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Next pieces"
          className="size-9 border border-line bg-paper/80 flex items-center justify-center text-ink hover:border-gold hover:text-gold-dark transition-colors cursor-pointer shadow-xs rounded-xs"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onScroll={updateProgress}
        className={`flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar scroll-smooth select-none py-2 ${
          isDown ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          scrollSnapType: isDown ? "none" : "x mandatory",
        }}
      >
        {products.map((p) => (
          <div
            key={p.id}
            className="w-[240px] sm:w-[280px] md:w-[320px] shrink-0"
            style={{ scrollSnapAlign: "start" }}
            onClickCapture={(e) => {
              if (hasMoved) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <ProductCard product={p} sizes="(max-width: 640px) 240px, 320px" />
          </div>
        ))}
      </div>

      <div className="mt-8 h-[2px] w-full bg-line/60 relative overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-150"
          style={{ width: `${Math.max(15, progress)}%` }}
        />
      </div>
    </div>
  );
}
// END OF FILE src/components/home/draggable-carousel.tsx
