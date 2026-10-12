"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const el = cursorRef.current;
    if (!el) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let isVisible = false;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) {
        isVisible = true;
        el.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      const interactive = target?.closest?.("button, a, input, select, textarea, [role='button'], article");

      if (interactive) {
        el.classList.add("cursor-hover");
      } else {
        el.classList.remove("cursor-hover");
      }
    };

    const onMouseDown = () => {
      el.classList.add("cursor-click");
    };

    const onMouseUp = () => {
      el.classList.remove("cursor-click");
    };

    const onMouseLeave = () => {
      isVisible = false;
      el.style.opacity = "0";
    };

    const onMouseEnter = () => {
      isVisible = true;
      el.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    let frameId: number;
    const render = () => {
      currentX += (mouseX - currentX) * 0.35;
      currentY += (mouseY - currentY) * 0.35;

      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      frameId = requestAnimationFrame(render);
    };
    frameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9999] opacity-0 will-change-transform rounded-full border border-gold/70 bg-gold/15 size-3.5 transition-[width,height,background-color,border-color] duration-200 ease-out [&.cursor-hover]:size-8 [&.cursor-hover]:bg-gold/10 [&.cursor-hover]:border-gold [&.cursor-click]:size-2.5"
    />
  );
}
