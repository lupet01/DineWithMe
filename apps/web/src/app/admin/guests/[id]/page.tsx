import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { restaurantRepository, seatRepository, userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { formatAmount } from "@dinewithme/config/src/payment";
import { getAuthUser } from "@/lib/auth/server";

function statusBadgeClass(status: string): string {
  if (status === "ATTENDED" || status === "COMPLETED") return "badge-green";
  if (status === "CONFIRMED") return "badge-blue";
  if (status === "CANCELLED" || status === "EXPIRED" || status === "NO_SHOW") return "badge-red";
  return "badge-slate";
}

/**
 * Guest Profile (CRM View) — the one restaurant-admin guest view. Replaces
 * the old Guest Quick View popup, which drew the same "click a guest name"
 * destination as a gated popup instead of a real page. Platform admins get
 * a separate, richer User Detail page (/admin/ops/users/[id]) with trust
 * score/payment/safety-report history included — this page deliberately
 * never queries any of that, matching the alert copy below.
 */
export default async function GuestProfilePage({ params }: { params: { id: string } }) {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  // Platform admins reach guest identities through the richer User Detail
  // page instead — this route (and its gated-info alert) is restaurant-admin
  // only, mirroring guest-row.tsx's own split for the identical click.
  if (user.role === Role.PLATFORM_ADMIN) {
    redirect(`/admin/ops/users/${params.id}`);
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;
  if (!restaurant) {
    notFound();
  }

  const [guest, visits] = await Promise.all([
    userRepository.findById(params.id),
    seatRepository.findVisitHistoryByUserAndRestaurant(params.id, restaurant.id),
  ]);

  if (!guest || visits.length === 0) {
    // No booking history at this restaurant - either a bad id, or a guest
    // who's never actually visited here. Either way there's nothing scoped
    // to this restaurant to show, so this reads the same as "not found"
    // rather than leaking that the user id exists elsewhere on the platform.
    notFound();
  }

  const name = [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email;
  const initials = (guest.firstName?.[0] ?? guest.email[0] ?? "?").toUpperCase() + (guest.lastName?.[0] ?? "").toUpperCase();

  const attendedVisits = visits.filter((v) => v.status === "ATTENDED" || v.status === "COMPLETED");
  const noShowVisits = visits.filter((v) => v.status === "NO_SHOW");
  const totalSpendCents = visits.reduce(
    (sum, v) => sum + v.paymentIntents.reduce((s, p) => s + p.amount, 0),
    0
  );
  const ratingsGiven = visits
    .map((v) => v.dinnerFeedback[0]?.rating)
    .filter((r): r is number => typeof r === "number");
  const avgRatingGiven = ratingsGiven.length
    ? (ratingsGiven.reduce((s, r) => s + r, 0) / ratingsGiven.length).toFixed(1)
    : null;
  const isRegular = attendedVisits.length >= 3;

  // Real schema has one free-text note per booking (Seat.dietaryNotes), not
  // a separate structured "restrictions" tag list - show the most recent
  // note rather than inventing a restrictions/notes split the data doesn't
  // support.
  const latestDietaryNote = visits.find((v) => v.dietaryNotes)?.dietaryNotes ?? null;

  return (
    <div className="guest-profile">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Link
          href="/admin/guests"
          style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--p)", textDecoration: "none", padding: "5px 12px 5px 8px", border: "1px solid var(--bdr)", borderRadius: 20 }}
        >
          ← Guests &amp; Bookings
        </Link>
      </div>

      {/* Desktop: left-aligned header with a wide equal-weight stat row */}
      <div className="card card-pad only-desktop" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: "50%", background: "var(--p-tint)", color: "var(--p)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{name}</div>
              <div style={{ fontSize: 12.5, color: "var(--t3)", marginTop: 2 }}>{guest.email}</div>
            </div>
          </div>
          {isRegular && <span className="badge badge-green">Regular Guest</span>}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--bdr)" }}>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{visits.length}</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>Visits here</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{formatAmount(totalSpendCents)}</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>Total spend</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--green-txt)" }}>{attendedVisits.length}/{visits.length} attended</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>Attendance rate</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: noShowVisits.length ? "var(--red-txt)" : "var(--text)" }}>{noShowVisits.length}</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>No-shows</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{avgRatingGiven ? `${avgRatingGiven} ★` : "—"}</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>Avg rating given</div></div>
        </div>
      </div>

      {/* Mobile: centered card — avatar, name, email, badge, then 3-up stats */}
      <div className="card card-pad only-mobile" style={{ marginBottom: 14, textAlign: "center" }}>
        <div
          style={{
            width: 56, height: 56, borderRadius: "50%", background: "var(--p-tint)", color: "var(--p)",
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, margin: "0 auto 10px",
          }}
        >
          {initials}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{name}</div>
        <div style={{ fontSize: 11.5, color: "var(--t3)", marginTop: 2, marginBottom: 10 }}>{guest.email}</div>
        {isRegular && <span className="badge badge-green">Regular Guest</span>}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--bdr)" }}>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{visits.length}</div><div style={{ fontSize: 10, color: "var(--t3)" }}>Visits</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{formatAmount(totalSpendCents)}</div><div style={{ fontSize: 10, color: "var(--t3)" }}>Spend</div></div>
          <div><div style={{ fontSize: 16, fontWeight: 800, color: "var(--green-txt)" }}>{attendedVisits.length}/{visits.length}</div><div style={{ fontSize: 10, color: "var(--t3)" }}>Attended{noShowVisits.length ? ` (${noShowVisits.length} no-show)` : ""}</div></div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>Dietary Profile</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
            Notes (from bookings)
          </div>
          <div style={{ fontSize: 12.5, color: "var(--t2)", lineHeight: 1.4, fontStyle: latestDietaryNote ? "italic" : "normal" }}>
            {latestDietaryNote ? `"${latestDietaryNote}"` : "None on file"}
          </div>
        </div>
      </div>

      <div className="alert" style={{ background: "var(--bg2)", border: "1px solid var(--bdr)", borderRadius: 16, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 11.5, color: "var(--t2)", lineHeight: 1.5 }}>
          Trust score, payment history, and safety-report history aren&apos;t visible here — those are platform-admin-only. Contact support if you have a serious concern.
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Visit History at {restaurant.name}</div>
        <div className="table-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>Dinner</th>
                <th>Date</th>
                <th>Status</th>
                <th className="r">Rating Left</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit, i) => {
                const rating = visit.dinnerFeedback[0]?.rating;
                const isNoShow = visit.status === "NO_SHOW";
                return (
                  <tr key={`${visit.dinner.id}-${i}`} style={isNoShow ? { opacity: 0.6 } : undefined}>
                    <td>
                      <div className="td-strong">
                        <Link href={`/admin/dinners/${visit.dinner.id}`} style={{ color: "var(--p)", textDecoration: "none" }}>
                          {visit.dinner.theme?.title || "Dinner"}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <div className="td-muted" style={{ marginTop: 0 }}>
                        {new Date(visit.dinner.startsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeClass(visit.status)}`}>{visit.status}</span>
                    </td>
                    <td className="r">
                      {rating ? (
                        <span style={{ fontWeight: 700, color: "var(--yellow-txt)" }}>{rating.toFixed(1)} ★</span>
                      ) : (
                        <span style={{ color: "var(--t3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
