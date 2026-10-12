// START OF FILE src/components/product/wishlist-button.tsx
"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast, useWishlist } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  productName,
  className,
  withLabel,
}: {
  productId: string;
  productName: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { toggle, has } = useWishlist();
  const { push } = useToast();
  const [active, setActive] = useState(false);

  useEffect(() => setActive(has(productId)), [has, productId]);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(productId);
        setActive(added);
        push(added ? "success" : "info", added ? `${productName} added to wishlist.` : `${productName} removed from wishlist.`);
      }}
      className={cn(
        "group/heart inline-flex items-center gap-2 transition-all cursor-pointer rounded-xs",
        withLabel
          ? "border border-line bg-paper/80 px-4 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-ink hover:border-gold hover:text-[#a68352] shadow-2xs"
          : "flex size-9 items-center justify-center bg-paper/90 backdrop-blur-md hover:bg-paper hover:border-gold border border-transparent shadow-xs",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-transform duration-200",
          active ? "fill-error text-error scale-110" : "text-ink group-hover/heart:text-[#a68352] group-hover/heart:scale-110"
        )}
        strokeWidth={1.5}
      />
      {withLabel && <span>{active ? "Wishlisted" : "Add to Wishlist"}</span>}
    </button>
  );
}
// END OF FILE src/components/product/wishlist-button.tsx
