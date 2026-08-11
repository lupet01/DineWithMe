"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateDinner } from "../actions";

interface DuplicateDinnerButtonProps {
  dinnerId: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The key post-event CTA on Completed Dinner Summary — creates a new DRAFT
 * dinner pre-filled from this one (same theme/meal/price/seats, one week
 * out) and takes the admin straight to Edit Dinner to review before
 * publishing.
 */
export function DuplicateDinnerButton({ dinnerId, className, style }: DuplicateDinnerButtonProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (isDuplicating) return;
    setIsDuplicating(true);
    setError(null);
    const result = await duplicateDinner(dinnerId);
    setIsDuplicating(false);
    if (!result.success || !result.data) {
      setError(result.error || "Failed to duplicate dinner");
      return;
    }
    router.push(`/admin/dinners/${result.data.newDinnerId}/edit`);
  };

  return (
    <>
      <button type="button" onClick={handleClick} disabled={isDuplicating} className={className} style={style}>
        {isDuplicating ? "Duplicating…" : "Duplicate Dinner"}
      </button>
      {error && <p style={{ fontSize: 11, color: "var(--red-txt)" }}>{error}</p>}
    </>
  );
}
