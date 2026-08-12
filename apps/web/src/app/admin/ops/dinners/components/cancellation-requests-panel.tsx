"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { approveDinnerCancellation, rejectDinnerCancellation } from "../actions";

interface CancellationRequest {
  id: string;
  reason: string;
  dinner: {
    id: string;
    startsAt: string | Date;
    restaurant: { id: string; name: string };
    theme: { title: string } | null;
  };
  requestedBy: { firstName: string | null; lastName: string | null; email: string };
}

/**
 * Platform-Ops review of restaurant-filed dinner cancellation requests. Approve
 * runs the actual cancellation under platform authority (releases seats +
 * refunds every paying guest); reject leaves the dinner untouched. Mirrors the
 * closure-request alert on the Restaurants Ops screen.
 */
export function CancellationRequestsPanel({ requests }: { requests: CancellationRequest[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  const approve = async (id: string) => {
    if (!confirm("Approve this cancellation? Every paying guest will be refunded and all seats released. This can't be undone.")) return;
    setBusyId(id);
    const res = await approveDinnerCancellation(id);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.error || "Failed to approve cancellation");
      return;
    }
    const d = res.data;
    toast.success(
      d ? `Dinner cancelled — ${d.refunded} guest(s) refunded${d.failed ? `, ${d.failed} failed` : ""}` : "Cancellation approved"
    );
    router.refresh();
  };

  const reject = async (id: string) => {
    if (!confirm("Reject this cancellation request? The dinner stays as it is.")) return;
    setBusyId(id);
    const res = await rejectDinnerCancellation(id);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.error || "Failed to reject request");
      return;
    }
    toast.success("Request rejected");
    router.refresh();
  };

  return (
    <Card padding="lg" className="border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-2">
            Dinner Cancellation Requests ({requests.length})
          </h3>
          <ul className="space-y-3">
            {requests.map((r) => {
              const name =
                [r.requestedBy.firstName, r.requestedBy.lastName].filter(Boolean).join(" ") ||
                r.requestedBy.email;
              const date = new Date(r.dinner.startsAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <li key={r.id} className="rounded-lg border border-red-100 bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {r.dinner.theme?.title || "Dinner"} · {r.dinner.restaurant.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {date} · requested by {name}
                      </div>
                      <div className="mt-1 text-sm text-gray-700">&ldquo;{r.reason}&rdquo;</div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => reject(r.id)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => approve(r.id)}
                        className="rounded-full bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {busyId === r.id ? "Working…" : "Approve & Refund"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Card>
  );
}
