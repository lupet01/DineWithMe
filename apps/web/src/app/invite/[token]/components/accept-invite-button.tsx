"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite, declineInvite } from "../actions";

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setError(null);
    setPending("accept");
    const result = await acceptInvite(token);
    setPending(null);

    if (!result.success || !result.data) {
      setError(result.error || "Failed to accept invite");
      return;
    }

    router.push(result.data.redirectTo);
    router.refresh();
  };

  const handleDecline = async () => {
    setError(null);
    setPending("decline");
    const result = await declineInvite(token);
    setPending(null);

    if (!result.success) {
      setError(result.error || "Failed to decline invite");
      return;
    }

    router.refresh();
  };

  return (
    <div className="mt-6 space-y-2">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>
      )}
      <button
        type="button"
        onClick={handleAccept}
        disabled={pending !== null}
        className="w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50"
      >
        {pending === "accept" ? "Accepting…" : "Accept Invite"}
      </button>
      <button
        type="button"
        onClick={handleDecline}
        disabled={pending !== null}
        className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {pending === "decline" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
