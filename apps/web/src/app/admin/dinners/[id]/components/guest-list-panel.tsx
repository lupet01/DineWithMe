"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "../../../components/confirm-modal";
import { GuestRow } from "./guest-row";
import { checkInAllSeats } from "../actions";

interface Seat {
  id: string;
  status: string;
  dietaryNotes: string | null;
  checkedInAt: Date | null;
  confirmedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  paymentIntents: Array<{ status: string; amount: number }>;
}

interface GuestListPanelProps {
  dinnerId: string;
  restaurantId: string;
  seats: Seat[];
  canRefund: boolean;
  isPlatformAdmin: boolean;
  /** COMPLETED dinner: renders as a read-only "Guest Manifest & Results" table (rating left, no check-in/refund controls) instead of the live check-in list. */
  isCompleted?: boolean;
  ratingsByGuestId?: Record<string, number>;
}

/**
 * Guest List card (§16.1 wireframe) - search by name, "Check In All", and
 * the guest table sorted so not-yet-checked-in guests come first (the host
 * shouldn't have to scroll past confirmed names to find who's still
 * arriving). Once the dinner is COMPLETED this becomes a read-only results
 * table instead (§Completed Dinner Summary) - see isCompleted below.
 */
export function GuestListPanel({ dinnerId, restaurantId, seats, canRefund, isPlatformAdmin, isCompleted = false, ratingsByGuestId = {} }: GuestListPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isCheckingInAll, setIsCheckingInAll] = useState(false);
  const [checkInAllOpen, setCheckInAllOpen] = useState(false);

  const sortedSeats = useMemo(() => {
    return [...seats].sort((a, b) => {
      const aCheckedIn = a.status === "ATTENDED" || a.status === "COMPLETED";
      const bCheckedIn = b.status === "ATTENDED" || b.status === "COMPLETED";
      if (aCheckedIn === bCheckedIn) return 0;
      return aCheckedIn ? 1 : -1;
    });
  }, [seats]);

  const filteredSeats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedSeats;
    return sortedSeats.filter((seat) => {
      const guest = seat.confirmedByUser;
      const name = [guest?.firstName, guest?.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = guest?.email.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [sortedSeats, search]);

  const anyPendingCheckIn = seats.some((seat) => seat.status === "CONFIRMED");

  const handleCheckInAll = async () => {
    if (isCheckingInAll) return;

    setIsCheckingInAll(true);
    const result = await checkInAllSeats(dinnerId);
    setIsCheckingInAll(false);

    if (!result.success) {
      toast.error(result.error || "Failed to check in guests");
      return;
    }
    const count = result.data?.checkedIn ?? 0;
    toast.success(`Checked in ${count} ${count === 1 ? "guest" : "guests"}`);
    setCheckInAllOpen(false);
    router.refresh();
  };

  return (
    <div className="card card-pad">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div className="card-title" style={{ marginBottom: 0 }}>{isCompleted ? "Guest Manifest & Results" : "Guest List"}</div>
        {!isCompleted && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setCheckInAllOpen(true)}
              disabled={isCheckingInAll || !anyPendingCheckIn}
              className="btn btn-sm btn-outline"
            >
              {isCheckingInAll ? "Checking in..." : "Check In All"}
            </button>
            <a href={`/admin/dinners/${dinnerId}/export`} className="btn btn-sm btn-outline">
              Export CSV
            </a>
          </div>
        )}
      </div>

      {seats.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>No confirmed guests yet</div>
      ) : (
        <>
          <div className="search-bar" style={{ width: 260, margin: "0 0 12px" }}>
            <Search className="search-icon" />
            <input
              className="field-input"
              placeholder="Search guest by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredSeats.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--t3)" }}>No guests match your search</div>
          ) : (
            <div className="table-scroll">
              <table className="dtable">
                <thead>
                  {isCompleted ? (
                    <tr>
                      <th>Guest</th>
                      <th>Dietary</th>
                      <th>Check-in</th>
                      <th className="r">Rating Left</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Guest</th>
                      <th>Seat Status</th>
                      <th>Payment</th>
                      <th>Dietary Notes</th>
                      <th className="r">Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredSeats.map((seat) => (
                    <GuestRow
                      key={seat.id}
                      dinnerId={dinnerId}
                      restaurantId={restaurantId}
                      seat={seat}
                      canRefund={canRefund}
                      isPlatformAdmin={isPlatformAdmin}
                      isCompleted={isCompleted}
                      rating={seat.confirmedByUser ? ratingsByGuestId[seat.confirmedByUser.id] : undefined}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={checkInAllOpen}
        onClose={() => setCheckInAllOpen(false)}
        onConfirm={handleCheckInAll}
        tone="green"
        title="Check in every confirmed guest?"
        description="This marks all confirmed guests for this dinner as checked in."
        confirmLabel="Check In All"
      />
    </div>
  );
}
