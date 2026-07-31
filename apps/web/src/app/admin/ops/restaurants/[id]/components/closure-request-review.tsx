"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { approveClosureRequest, rejectClosureRequest } from "../../actions";

interface ClosureRequestReviewProps {
  requestId: string;
  reason: string;
  requestedAt: Date | string;
}

export function ClosureRequestReview({ requestId, reason, requestedAt }: ClosureRequestReviewProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (result: Promise<{ success: boolean; error?: string }>) => {
    setIsUpdating(true);
    setError(null);
    const res = await result;
    setIsUpdating(false);
    if (!res.success) {
      setError(res.error || "Action failed");
      return;
    }
    router.refresh();
  };

  const handleApprove = () => {
    if (isUpdating) return;
    const confirmed = confirm(
      "Approve this closure request? This permanently archives the restaurant - there is no un-archive."
    );
    if (!confirmed) return;
    void runAction(approveClosureRequest(requestId));
  };

  const handleReject = () => {
    if (isUpdating) return;
    const confirmed = confirm("Reject this closure request? The restaurant is unaffected.");
    if (!confirmed) return;
    void runAction(rejectClosureRequest(requestId));
  };

  return (
    <Card padding="lg" className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-red-900">Closure Request Pending Review</h2>
          <p className="text-sm text-red-800 mt-1">&quot;{reason}&quot;</p>
          <p className="text-xs text-red-600 mt-1">
            Submitted{" "}
            {new Date(requestedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleApprove}
              disabled={isUpdating}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              Approve & Archive
            </button>
            <button
              onClick={handleReject}
              disabled={isUpdating}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </Card>
  );
}
