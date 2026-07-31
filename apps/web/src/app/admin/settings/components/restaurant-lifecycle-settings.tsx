"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, PauseCircle, PlayCircle } from "lucide-react";
import type { Restaurant, RestaurantClosureRequest } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  pauseRestaurantSelfServe,
  reactivateRestaurantSelfServe,
  requestRestaurantClosure,
  cancelRestaurantClosureRequest,
} from "../actions";

const STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  ACTIVE: "success",
  PAUSED: "danger",
  ARCHIVED: "neutral",
};

interface RestaurantLifecycleSettingsProps {
  restaurant: Restaurant;
  pendingClosureRequest: RestaurantClosureRequest | null;
}

export function RestaurantLifecycleSettings({
  restaurant,
  pendingClosureRequest,
}: RestaurantLifecycleSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closeReason, setCloseReason] = useState("");

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

  const handlePause = () => {
    const reason = prompt("Why are you pausing your restaurant? (Optional)");
    if (reason === null) return;
    runAction(pauseRestaurantSelfServe(restaurant.id, reason || undefined));
  };

  const handleReactivate = () => {
    const confirmed = confirm("Reactivate your restaurant? It will be visible to diners again.");
    if (!confirmed) return;
    runAction(reactivateRestaurantSelfServe(restaurant.id));
  };

  const handleSubmitClosure = (e: React.FormEvent) => {
    e.preventDefault();
    runAction(
      requestRestaurantClosure(restaurant.id, closeReason).then((result) => {
        if (result.success) {
          setShowCloseForm(false);
          setCloseReason("");
        }
        return result;
      })
    );
  };

  const handleCancelClosure = () => {
    if (!pendingClosureRequest) return;
    const confirmed = confirm("Cancel your closure request? Your restaurant will remain as-is.");
    if (!confirmed) return;
    runAction(cancelRestaurantClosureRequest(pendingClosureRequest.id));
  };

  if (restaurant.status === "ARCHIVED") {
    return (
      <Card padding="lg" className="flex items-start gap-3">
        <Lock className="h-5 w-5 flex-shrink-0 text-gray-400 mt-0.5" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">This restaurant is closed</h2>
          <p className="text-sm text-gray-600 mt-1">
            {restaurant.name} was permanently closed and is no longer visible to diners. Your
            dinner history is preserved. Contact support if you believe this is a mistake.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Visibility */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Visibility</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pausing hides {restaurant.name} from diners immediately. It&apos;s fully reversible -
              reactivate any time to go straight back to how things were.
            </p>
          </div>
          <Badge tone={STATUS_TONE[restaurant.status] ?? "neutral"}>{restaurant.status}</Badge>
        </div>

        <div className="mt-4">
          {restaurant.status === "ACTIVE" && (
            <button
              type="button"
              onClick={handlePause}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <PauseCircle className="h-4 w-4" />
              Pause Restaurant
            </button>
          )}
          {restaurant.status === "PAUSED" && (
            <button
              type="button"
              onClick={handleReactivate}
              disabled={isPending}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <PlayCircle className="h-4 w-4" />
              Reactivate Restaurant
            </button>
          )}
          {restaurant.status === "PENDING" && (
            <p className="text-sm text-gray-500">
              Available once your restaurant is approved and live.
            </p>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card padding="lg" className="border-red-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
            <p className="text-sm text-gray-600 mt-1">
              Closing your restaurant is permanent. Unlike pausing, it can&apos;t be undone
              yourself - our team reviews every request before it takes effect, so your
              restaurant stays as-is until then.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {pendingClosureRequest ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-900">Closure request pending review</p>
              <p className="text-sm text-amber-800 mt-1">&quot;{pendingClosureRequest.reason}&quot;</p>
              <button
                type="button"
                onClick={handleCancelClosure}
                disabled={isPending}
                className="mt-3 text-sm font-medium text-amber-900 underline hover:no-underline disabled:opacity-50"
              >
                Cancel request
              </button>
            </div>
          ) : showCloseForm ? (
            <form onSubmit={handleSubmitClosure} className="space-y-3">
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                rows={3}
                required
                placeholder="Tell us why you're closing your restaurant..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                disabled={isPending}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending || !closeReason.trim()}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Submitting..." : "Submit Closure Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseForm(false)}
                  disabled={isPending}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCloseForm(true)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            >
              Close Restaurant
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
