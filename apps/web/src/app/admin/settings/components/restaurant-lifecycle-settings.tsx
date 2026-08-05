"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import type { Restaurant, RestaurantClosureRequest } from "@dinewithme/db";
import {
  pauseRestaurantSelfServe,
  reactivateRestaurantSelfServe,
  requestRestaurantClosure,
  cancelRestaurantClosureRequest,
  updateNotificationPreferences,
} from "../actions";
import { PauseListingCard } from "./pause-listing-card";
import { NotificationPreferencesCard } from "./notification-preferences-card";
import { PayoutsSnapshotCard } from "./payouts-snapshot-card";
import { DangerZoneCard } from "./danger-zone-card";

interface RestaurantLifecycleSettingsProps {
  restaurant: Restaurant;
  pendingClosureRequest: RestaurantClosureRequest | null;
  nextPayoutAmountCents: number | null;
  nextPayoutDate: string | null;
  bankName: string | null;
  maskedAccountNumber: string | null;
  verifiedAt: string | null;
}

export function RestaurantLifecycleSettings({
  restaurant,
  pendingClosureRequest,
  nextPayoutAmountCents,
  nextPayoutDate,
  bankName,
  maskedAccountNumber,
  verifiedAt,
}: RestaurantLifecycleSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    notifyNewBooking: restaurant.notifyNewBooking,
    notifyCancellation: restaurant.notifyCancellation,
    notifyLowFillRateWarning: restaurant.notifyLowFillRateWarning,
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  const runAction = (action: Promise<{ success: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action;
      if (!result.success) {
        setError(result.error || "Something went wrong");
        return;
      }
      router.refresh();
    });
  };

  // Wireframe's Pause Listing is a bare instant/reversible toggle - no reason
  // prompt, no confirm dialog, unlike the old buttons-per-status UI this
  // replaces.
  const handlePause = () => runAction(pauseRestaurantSelfServe(restaurant.id));
  const handleReactivate = () => runAction(reactivateRestaurantSelfServe(restaurant.id));

  const handleSubmitClosure = (reason: string) => {
    runAction(requestRestaurantClosure(restaurant.id, reason));
  };

  const handleCancelClosure = () => {
    if (!pendingClosureRequest) return;
    runAction(cancelRestaurantClosureRequest(pendingClosureRequest.id));
  };

  const handlePreferenceChange = async (
    key: "notifyNewBooking" | "notifyCancellation" | "notifyLowFillRateWarning",
    value: boolean
  ) => {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSavingPreferences(true);
    const result = await updateNotificationPreferences(restaurant.id, next);
    setSavingPreferences(false);
    if (!result.success) {
      setPreferences(previous);
      setError(result.error || "Failed to update notification preferences");
    }
  };

  if (restaurant.status === "ARCHIVED") {
    return (
      <div className="card card-pad" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <Lock className="h-5 w-5" style={{ color: "var(--t3)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <div className="card-title">This restaurant is closed</div>
          <p style={{ fontSize: 13, color: "var(--t2)", marginTop: 4 }}>
            {restaurant.name} was permanently closed and is no longer visible to diners. Your
            dinner history is preserved. Contact support if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="alert alert-yellow" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <PauseListingCard
          status={restaurant.status}
          onPause={handlePause}
          onReactivate={handleReactivate}
          isPending={isPending}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <NotificationPreferencesCard
          preferences={preferences}
          onChange={handlePreferenceChange}
          isSaving={savingPreferences}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <PayoutsSnapshotCard
          nextPayoutAmountCents={nextPayoutAmountCents}
          nextPayoutDate={nextPayoutDate}
          bankName={bankName}
          maskedAccountNumber={maskedAccountNumber}
          verifiedAt={verifiedAt}
        />
      </div>

      <DangerZoneCard
        pendingClosureRequest={pendingClosureRequest}
        onSubmitClosure={handleSubmitClosure}
        onCancelClosure={handleCancelClosure}
        isPending={isPending}
      />
    </>
  );
}
