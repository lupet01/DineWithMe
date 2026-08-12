import Link from "next/link";
import { Sparkles, FileText } from "lucide-react";
import type { Restaurant, ComplianceDocument, RestaurantWithMembers } from "@dinewithme/db";
import type { Theme } from "@prisma/client";
import { COMPLIANCE_DOC_TYPE_LABELS } from "@/lib/compliance-document";
import {
  OPERATING_HOURS_DAYS,
  OPERATING_HOURS_DAY_LABELS,
  type OperatingHours,
} from "@dinewithme/shared";

interface RestaurantOverviewProps {
  restaurant: Restaurant;
  members: RestaurantWithMembers["members"];
  allThemes: Theme[];
  enabledThemeIds: string[];
  documents: ComplianceDocument[];
  mediaItems: { id: string; url: string }[];
  mediaTotalCount: number;
}

function parseOperatingHours(value: unknown): OperatingHours | null {
  if (!value || typeof value !== "object") return null;
  return value as OperatingHours;
}

/** Collapses consecutive days with identical hours into one row (e.g. "Mon
 * – Sat  11:00 – 22:00") the same way the wireframe's own sample data does,
 * rather than listing all 7 days flat. */
function summarizeHours(hours: OperatingHours | null): { label: string; value: string }[] {
  if (!hours) return [];
  const rows: { label: string; value: string }[] = [];
  let i = 0;
  while (i < OPERATING_HOURS_DAYS.length) {
    // noUncheckedIndexedAccess makes a plain numeric index type as
    // `T | undefined` even though the `while` bounds above already
    // guarantee i/j/j+1 are in range - non-null assertions here are safe,
    // not a bypass.
    const day = OPERATING_HOURS_DAYS[i]!;
    const d = hours[day];
    const valueStr = d.closed ? "Closed" : d.open && d.close ? `${d.open} – ${d.close}` : "—";
    let j = i;
    while (
      j + 1 < OPERATING_HOURS_DAYS.length &&
      (() => {
        const next = hours[OPERATING_HOURS_DAYS[j + 1]!];
        const nextStr = next.closed ? "Closed" : next.open && next.close ? `${next.open} – ${next.close}` : "—";
        return nextStr === valueStr;
      })()
    ) {
      j++;
    }
    const startLabel = OPERATING_HOURS_DAY_LABELS[day];
    const endLabel = OPERATING_HOURS_DAY_LABELS[OPERATING_HOURS_DAYS[j]!];
    rows.push({ label: j === i ? startLabel : `${startLabel} – ${endLabel}`, value: valueStr });
    i = j + 1;
  }
  return rows;
}

const ROLE_BADGE: Record<string, string> = { OWNER: "badge-purple", MANAGER: "badge-blue" };

/**
 * Read-only Overview mode (§sec-restaurant-profile) — what a restaurant
 * admin lands on by default. Every editable field lives behind "Edit
 * Profile" instead, gated in restaurant/edit/page.tsx.
 */
export function RestaurantOverview({
  restaurant,
  members,
  allThemes,
  enabledThemeIds,
  documents,
  mediaItems,
  mediaTotalCount,
}: RestaurantOverviewProps) {
  const hoursRows = summarizeHours(parseOperatingHours(restaurant.operatingHours));

  return (
    <>
      {/* Edit Profile now lives in the identity header row (desktop, see
          page.tsx) and in the mobile sticky action bar at the foot of this
          scroll (§sec-restaurant-profile) - no standalone Edit row here. */}

      {/* Business Details + Contact + Hours, merged into one quiet-divider
          card (iOS-Settings-style grouped read), matching the wireframe. */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <div className="card-title" style={{ padding: 0 }}>Business Details</div>
          <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Verified at onboarding</span>
        </div>

        {restaurant.description && (
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text)", marginBottom: 6 }}>
            {restaurant.description}
          </p>
        )}
        {restaurant.address && (
          <div style={{ fontSize: 12.5, color: "var(--t3)" }}>{restaurant.address}</div>
        )}

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".05em", margin: "20px 0 10px" }}>
          Contact
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {restaurant.phone && (
            <div className="breakdown-row">
              <span className="breakdown-label">Phone</span>
              <span className="breakdown-value">{restaurant.phone}</span>
            </div>
          )}
          {restaurant.contactEmail && (
            <div className="breakdown-row">
              <span className="breakdown-label">Email</span>
              <span className="breakdown-value">
                <a href={`mailto:${restaurant.contactEmail}`} style={{ color: "var(--p)", textDecoration: "none", fontWeight: 600 }}>
                  {restaurant.contactEmail}
                </a>
              </span>
            </div>
          )}
          {restaurant.website && (
            <div className="breakdown-row">
              <span className="breakdown-label">Website</span>
              <span className="breakdown-value">
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--p)", textDecoration: "none", fontWeight: 600 }}>
                  {restaurant.website.replace(/^https?:\/\//, "")}
                </a>
              </span>
            </div>
          )}
          {!restaurant.phone && !restaurant.contactEmail && !restaurant.website && (
            <div style={{ fontSize: 12.5, color: "var(--t3)" }}>No contact details added yet.</div>
          )}
        </div>

        {hoursRows.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".05em", margin: "20px 0 10px" }}>
              Hours
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {hoursRows.map((row) => (
                <div key={row.label} className="breakdown-row">
                  <span className="breakdown-label">{row.label}</span>
                  <span className="breakdown-value" style={row.value === "Closed" ? { color: "var(--t3)" } : undefined}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {(restaurant.registrationNumber || restaurant.googleBusinessUrl || restaurant.instagramHandle) && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".05em", margin: "20px 0 10px" }}>
              From Your Application
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {restaurant.registrationNumber && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Business Registration Number</span>
                  <span className="breakdown-value">{restaurant.registrationNumber}</span>
                </div>
              )}
              {restaurant.googleBusinessUrl && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Google Business Profile</span>
                  <span className="breakdown-value">
                    <a href={restaurant.googleBusinessUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--p)", textDecoration: "none", fontWeight: 600 }}>
                      View listing →
                    </a>
                  </span>
                </div>
              )}
              {restaurant.instagramHandle && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Instagram</span>
                  <span className="breakdown-value">{restaurant.instagramHandle}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Team + Media previews, side by side, each with a link through to
          the full page. */}
      <div className="field-grid-2" style={{ marginBottom: 20, alignItems: "start" }}>
        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div className="card-title" style={{ padding: 0 }}>Team</div>
            <Link href="/admin/team" style={{ fontSize: 12, color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {members.slice(0, 4).map((member) => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div className="d-avatar" style={{ width: 32, height: 32, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {[member.user.firstName, member.user.lastName].filter(Boolean).join(" ") || member.user.email}
                  </div>
                </div>
                <span className={`badge ${ROLE_BADGE[member.role] ?? "badge-slate"}`} style={{ fontSize: 9, flexShrink: 0 }}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <div className="card-title" style={{ padding: 0 }}>Media</div>
            <Link href="/admin/media-library" style={{ fontSize: 12, color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
              View all {mediaTotalCount} →
            </Link>
          </div>
          {mediaItems.length > 0 ? (
            <div className="gallery-grid" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              {mediaItems.slice(0, 4).map((item) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={item.id} src={item.url} alt="" className="gallery-tile" style={{ height: 56, objectFit: "cover" }} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--t3)" }}>No photos yet.</div>
          )}
        </div>
      </div>

      {/* Table Themes - icon tile + description, read-only (no toggle;
          toggling lives in Edit mode). */}
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>Table Themes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allThemes.map((theme) => {
            const isEnabled = enabledThemeIds.includes(theme.id);
            return (
              <div
                key={theme.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: 12,
                  border: "1px solid var(--bdr)", borderRadius: 14, opacity: isEnabled ? 1 : 0.7,
                }}
              >
                <div
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: isEnabled ? "var(--p-tint)" : "var(--bg2)",
                    color: isEnabled ? "var(--p)" : "var(--t3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text)" }}>{theme.title}</div>
                  <div style={{ fontSize: 12, color: "var(--t3)" }}>{theme.shortDescription}</div>
                </div>
                <span className={`badge ${isEnabled ? "badge-green" : "badge-slate"}`} style={{ flexShrink: 0 }}>
                  {isEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance Documents - status only, no upload/delete (that's
          Edit-mode only). Filenames drop their extension here, per the
          wireframe - the exact filename only matters when you're about to
          act on it. */}
      <div className="card card-pad">
        <div className="card-title" style={{ marginBottom: 14 }}>Compliance Documents</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {documents.length === 0 && (
            <div style={{ fontSize: 12.5, color: "var(--t3)" }}>No documents uploaded yet.</div>
          )}
          {documents.map((doc) => {
            const badgeClass = doc.verifiedAt ? "badge-green" : doc.rejectedAt ? "badge-red" : "badge-yellow";
            const badgeText = doc.verifiedAt ? "✓ Verified" : doc.rejectedAt ? "✗ Rejected" : "⏳ Pending review";
            const nameNoExt = doc.fileName.replace(/\.[^/.]+$/, "");
            return (
              <div
                key={doc.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "10px 12px", borderRadius: 12,
                  border: doc.rejectedAt ? "1px solid var(--red-bdr)" : "1px solid var(--bdr)",
                  background: doc.rejectedAt ? "var(--red-bg2, var(--red-bg))" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ color: "var(--t3)", flexShrink: 0, display: "flex" }}>
                    <FileText size={15} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                      {COMPLIANCE_DOC_TYPE_LABELS[doc.docType] ?? nameNoExt}
                    </div>
                    {doc.rejectedAt && doc.rejectionReason && (
                      <div style={{ fontSize: 10.5, color: "var(--red-txt2, var(--red-txt))", marginTop: 1 }}>
                        Rejected: &ldquo;{doc.rejectionReason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
                <span className={`badge ${badgeClass}`} style={{ fontSize: 10, flexShrink: 0 }}>{badgeText}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile-only sticky Edit Profile bar, matching the wireframe's
          .m-action-bar at the foot of the Overview scroll (the desktop Edit
          control lives in the identity header instead). Reuses the existing
          shared .m-action-bar class (auto-hidden ≥768px). */}
      <div className="m-action-bar">
        <Link
          href="/admin/restaurant/edit"
          className="btn btn-primary btn-block"
          style={{ textDecoration: "none", justifyContent: "center" }}
        >
          ✎ Edit Profile
        </Link>
      </div>
    </>
  );
}
