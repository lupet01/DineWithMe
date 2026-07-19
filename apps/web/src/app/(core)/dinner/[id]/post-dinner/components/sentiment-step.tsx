"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { VibeTag } from "@dinewithme/shared";

interface VibeTagOption {
  value: VibeTag;
  label: string;
}

const VIBE_TAG_OPTIONS: VibeTagOption[] = [
  { value: "GREAT_CONVERSATIONS", label: "Great conversations" },
  { value: "GOOD_FOOD", label: "Good food" },
  { value: "WELCOMING", label: "Welcoming" },
  { value: "INTIMATE", label: "Intimate" },
  { value: "ENERGETIC", label: "Energetic" },
  { value: "RELAXED", label: "Relaxed" },
];

interface RatingStepProps {
  restaurantName: string | null;
  whenLabel: string | null;
  onSubmit: (rating: number, vibeTags: VibeTag[], comment: string) => void;
  onSkip: () => void;
}

/**
 * Screen 1 "How Was It?" - 5-star overall rating, multi-select vibe tags,
 * and an optional comment. Formerly a 4-option emoji sentiment picker
 * (GREAT/GOOD/NEUTRAL/UNCOMFORTABLE); that enum still exists server-side
 * (Feedback.overallSentiment is a required column), so feedback-flow.tsx
 * derives an overallSentiment value from the star rating when submitting.
 */
export function RatingStep({ restaurantName, whenLabel, onSubmit, onSkip }: RatingStepProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<Set<VibeTag>>(new Set());
  const [comment, setComment] = useState("");

  const toggleTag = (tag: VibeTag) => {
    const next = new Set(selectedTags);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    setSelectedTags(next);
  };

  const handleSubmit = () => {
    onSubmit(rating, Array.from(selectedTags), comment.trim());
  };

  const subtitle = [restaurantName, whenLabel].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          How was your dinner?
        </h1>
        {subtitle && (
          <p className="mt-2 text-[13px] text-gray-500">{subtitle}</p>
        )}
      </div>

      {/* Overall experience card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-[15px] font-semibold text-gray-900">Overall experience</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                className="p-1 transition-transform active:scale-90"
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    filled ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-[13px] text-gray-400">
          {rating > 0 ? `${rating} of 5` : "Tap to rate"}
        </p>
      </div>

      {/* Vibe tags card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-[15px] font-semibold text-gray-900">How was the vibe?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIBE_TAG_OPTIONS.map((tag) => {
            const active = selectedTags.has(tag.value);
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => toggleTag(tag.value)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional comment */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-gray-900">
          Anything else? (optional)
        </label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share more about your dinner..."
          className="w-full rounded-xl border border-gray-200 bg-cream-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-400">{comment.length}/1000</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          className="w-full rounded-full bg-primary-500 py-4 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
        >
          Submit Feedback
        </button>
        <button
          onClick={onSkip}
          className="w-full rounded-full border-2 border-gray-200 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
