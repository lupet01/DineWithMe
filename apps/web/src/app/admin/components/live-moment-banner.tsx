"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markLiveMomentSeen } from "../live-moment-actions";

interface LiveMomentBannerProps {
  restaurantId: string;
  restaurantName: string;
}

/**
 * One-time "You're Live!" moment - only ever rendered when
 * restaurant.liveMomentSeenAt is null (server-decided). Marked seen only
 * on dismissal (either button), not on mount - it should survive a
 * refresh until the owner actually acknowledges it, per the wireframe.
 */
export function LiveMomentBanner({ restaurantId, restaurantName }: LiveMomentBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const dismiss = (navigateTo?: string) => {
    startTransition(async () => {
      await markLiveMomentSeen(restaurantId);
      if (navigateTo) {
        router.push(navigateTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="card card-pad" style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: 34, marginBottom: 6 }}>🎉</div>
      <div className="card-title">You&apos;re live, {restaurantName}!</div>
      <p className="card-title-sub" style={{ marginTop: 6, lineHeight: 1.5 }}>
        Your restaurant is approved and bookable on Discover right now. Create your first dinner
        to start filling seats.
      </p>
      <button
        type="button"
        onClick={() => dismiss("/admin/dinners/new")}
        disabled={isPending}
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
      >
        + Create Your First Dinner
      </button>
      <button
        type="button"
        onClick={() => dismiss()}
        disabled={isPending}
        style={{
          marginTop: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "var(--t3)",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        Maybe later
      </button>
    </div>
  );
}
