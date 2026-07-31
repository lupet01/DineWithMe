"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { processSelectedPayouts, verifyBankDetails } from "../../actions";

interface PayoutDetailActionsProps {
  payoutId: string;
  restaurantId: string;
  isReady: boolean;
  isVerified: boolean;
}

export function PayoutDetailActions({ payoutId, restaurantId, isReady, isVerified }: PayoutDetailActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setBusy(true);
    const result = await verifyBankDetails(restaurantId);
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Failed to verify bank details");
      return;
    }
    router.refresh();
  };

  const handleProcess = async () => {
    if (!confirm("Process this payout? This marks it as paid.")) return;
    setError(null);
    setBusy(true);
    const result = await processSelectedPayouts([payoutId]);
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Failed to process payout");
      return;
    }
    router.refresh();
  };

  if (!isReady && isVerified) return null;

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <div className="flex gap-2">
        {!isVerified && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={busy}
            className="rounded-full border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500 transition-colors hover:bg-primary-50 disabled:opacity-50"
          >
            {busy ? "Verifying…" : "Verify Payout Destination"}
          </button>
        )}
        {isReady && (
          <button
            type="button"
            onClick={handleProcess}
            disabled={busy}
            className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {busy ? "Processing…" : "Process Payout"}
          </button>
        )}
      </div>
    </div>
  );
}
