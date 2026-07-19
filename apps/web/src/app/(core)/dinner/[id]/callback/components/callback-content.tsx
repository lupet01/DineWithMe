"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import type { DinnerDetail } from "@dinewithme/shared";
import { ConfirmationSuccess } from "../../confirm/components/confirmation-success";
import { ConfirmationError } from "../../confirm/components/confirmation-error";
import { ConfirmationSkeleton } from "../../confirm/components/confirmation-skeleton";

interface CallbackContentProps {
  dinnerId: string;
  seatId: string;
  reference?: string;
  status?: string;
}

type CallbackState = "loading" | "success" | "error";

export function CallbackContent({
  dinnerId,
  seatId,
  reference,
  status,
}: CallbackContentProps) {
  const router = useRouter();
  const [state, setState] = useState<CallbackState>("loading");
  const [dinner, setDinner] = useState<DinnerDetail | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    processCallback();
  }, []);

  const processCallback = async () => {
    try {
      // If this is a free dinner (status=success without reference), just confirm
      if (status === "success" && !reference) {
        await confirmFreeDinner();
        return;
      }

      // If we have a reference, verify payment with Paystack
      if (reference) {
        await verifyPaymentAndConfirm();
        return;
      }

      // If we get here, something is wrong
      throw new Error("Invalid callback parameters");
    } catch (err) {
      console.error("Callback processing error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const confirmFreeDinner = async () => {
    try {
      // For free dinners, the seat should already be CONFIRMED by the booking API
      // We just need to fetch dinner details for display
      const dinnerResponse = await fetch(`/api/dinners/${dinnerId}`);
      if (!dinnerResponse.ok) {
        throw new Error("Failed to fetch dinner details");
      }

      const dinnerData = await dinnerResponse.json();
      setDinner(dinnerData.data);

      // Track success
      await track(AnalyticsEvents.SEAT_CONFIRMED, {
        userId: "current-user",
        dinnerId,
        seatId,
        timestamp: new Date().toISOString(),
      });

      setState("success");
    } catch (err) {
      throw err;
    }
  };

  const verifyPaymentAndConfirm = async () => {
    try {
      // Step 1: Verify payment with Paystack
      const verifyResponse = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || "Payment verification failed");
      }

      const verifyData = await verifyResponse.json();

      // Check if payment was successful
      if (!verifyData.success || verifyData.data?.status !== "success") {
        throw new Error("Payment was not successful");
      }

      // Step 2: Fetch dinner details (seat should already be confirmed by webhook)
      const dinnerResponse = await fetch(`/api/dinners/${dinnerId}`);
      if (!dinnerResponse.ok) {
        throw new Error("Failed to fetch dinner details");
      }

      const dinnerData = await dinnerResponse.json();
      setDinner(dinnerData.data);

      // Track success
      await track(AnalyticsEvents.SEAT_CONFIRMED, {
        userId: "current-user",
        dinnerId,
        seatId,
        timestamp: new Date().toISOString(),
      });

      setState("success");
    } catch (err) {
      throw err;
    }
  };

  const handleRetry = () => {
    setState("loading");
    setError("");
    processCallback();
  };

  const handleBackToDinner = () => {
    router.push(`/dinner/${dinnerId}`);
  };

  if (state === "loading") {
    return <ConfirmationSkeleton />;
  }

  if (state === "error") {
    return (
      <ConfirmationError
        error={error}
        onRetry={handleRetry}
        onBackToDinner={handleBackToDinner}
      />
    );
  }

  if (state === "success" && dinner) {
    return <ConfirmationSuccess dinner={dinner} />;
  }

  return null;
}
