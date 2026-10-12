"use client";

import { useState } from "react";
import { Star, CheckCircle, Plus } from "lucide-react";
import { Modal } from "@/components/ui/overlays";
import { Button, Input } from "@/components/ui/primitives";
import { useToast } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  sizePurchased?: string;
}

const DEMO_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Zubair Ahmed",
    rating: 5,
    date: "14 Feb 2026",
    title: "Exceptional weight and structured drape",
    comment: "The 480gsm loopback fleece is completely unmatched. The collar sits sharp and doesn't bacon after washes. True luxury construction right here in Dhaka.",
    verified: true,
    sizePurchased: "L",
  },
  {
    id: "rev-2",
    author: "Tahmid Hossain",
    rating: 5,
    date: "28 Jan 2026",
    title: "Minimalist precision",
    comment: "Finally an independent house that focuses on fabric weight rather than loud logos. Boxy cut is flattering for everyday wear.",
    verified: true,
    sizePurchased: "M",
  },
  {
    id: "rev-3",
    author: "S. M. Rahman",
    rating: 5,
    date: "10 Jan 2026",
    title: "Worth every taka",
    comment: "Was sceptical about ordering clothes online, but the cash on delivery inspection and prompt customer service won me over.",
    verified: true,
    sizePurchased: "XL",
  },
];

export function ProductReviews({ productName }: { productName: string }) {
  const { push } = useToast();
  const [reviews, setReviews] = useState<Review[]>(DEMO_REVIEWS);
  const [openModal, setOpenModal] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Review = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim() || "Valued Client",
      rating: newRating,
      date: "Just now",
      title: newTitle.trim(),
      comment: newComment.trim(),
      verified: true,
    };
    setReviews([created, ...reviews]);
    setOpenModal(false);
    push("success", "Review submitted for verification. Thank you!");
    setNewAuthor("");
    setNewTitle("");
    setNewComment("");
  };

  return (
    <section className="container-x py-20 border-t border-line" aria-label="Customer Reviews">
      <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
        <div>
          <p className="eyebrow">Client Feedback</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Verified Reviews</h2>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center text-ink">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="size-4 fill-ink" strokeWidth={1} />
              ))}
            </div>
            <span className="text-sm font-semibold font-mono text-ink">5.0 / 5.0</span>
            <span className="text-xs text-fog">({reviews.length} atelier reviews)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center gap-2 border border-ink px-4 py-2.5 text-xs uppercase tracking-wider font-medium hover:bg-ink hover:text-paper transition-colors cursor-pointer"
        >
          <Plus className="size-3.5" />
          <span>Write a Review</span>
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.id} className="border border-line bg-paper p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-ink text-ink" strokeWidth={1} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-fog">{r.date}</span>
              </div>
              <h3 className="font-semibold text-sm text-ink">{r.title}</h3>
              <p className="text-xs leading-relaxed text-ash">{r.comment}</p>
            </div>

            <div className="pt-3 border-t border-line/60 flex items-center justify-between text-[11px]">
              <span className="font-medium text-ink">{r.author}</span>
              {r.verified && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                  <CheckCircle className="size-3" /> Verified Buyer
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)} title={`Review — ${productName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={cn(
                      "size-5 transition-colors",
                      star <= newRating ? "fill-ink text-ink" : "text-line"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Your Name *"
            required
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="e.g. S. M. Rahman"
          />

          <Input
            label="Review Title *"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Outstanding fabric quality"
          />

          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-[0.16em] text-fog block">
              Your Experience *
            </label>
            <textarea
              rows={4}
              required
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Tell others about the silhouette, weight, and drape..."
              className="w-full border border-line bg-paper p-3 text-xs outline-none focus:border-ink"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-line">
            <Button type="submit">Submit Feedback</Button>
            <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
