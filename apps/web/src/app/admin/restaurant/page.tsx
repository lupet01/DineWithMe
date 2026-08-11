import Link from "next/link";
import { Lock } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  themeRepository,
  complianceDocumentRepository,
  dinnerRepository,
  feedbackRepository,
  mediaAssetRepository,
} from "@dinewithme/db";
import { RestaurantOverview } from "./components/restaurant-overview";
import { RestaurantOnboardingWizard } from "./components/restaurant-onboarding-wizard";
import { IconSprite } from "./components/icon-sprite";
import { MobileSubTabs } from "../components/mobile-sub-tabs";

const profileTabs = [
  { label: "Profile", href: "/admin/restaurant" },
  { label: "Team", href: "/admin/team" },
  { label: "Media Library", href: "/admin/media-library" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function RestaurantProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    return null;
  }

  // Get user's restaurant with media
  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  // Onboarding mode: no restaurant yet
  if (!restaurant) {
    return <RestaurantOnboardingWizard />;
  }

  // Edit mode: restaurant exists
  // Get all active themes
  const allThemes = await themeRepository.findActive();

  // Get enabled themes for this restaurant
  const enabledThemes = await themeRepository.findByRestaurant(restaurant.id);
  const enabledThemeIds = enabledThemes.map((t) => t.id);

  // Get compliance documents for this restaurant
  const complianceDocuments = await complianceDocumentRepository.findByRestaurant(restaurant.id);

  // Profile header stats (§16.1 wireframe's "premium header" stat row)
  const [restaurantWithMembers, dinners, avgRating, mediaItems] = await Promise.all([
    restaurantRepository.findByIdWithMembers(restaurant.id),
    dinnerRepository.findByRestaurant(restaurant.id),
    feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
    mediaAssetRepository.findLibraryByRestaurant(restaurant.id),
  ]);
  const teamCount = restaurantWithMembers?.members.length ?? 0;

  // Archived: permanently closed (§16.7, only reachable via an approved
  // RestaurantClosureRequest). Read-only from here on - no edit forms, just
  // a summary and a pointer to preserved history, matching Settings' and
  // the Dashboard's own locked treatment for this status.
  if (restaurant.status === "ARCHIVED") {
    return (
      <div>
        <MobileSubTabs tabs={profileTabs} marginBottom={14} />
        <h1 className="pg-title" style={{ marginBottom: 16 }}>
          Restaurant Profile
        </h1>

        <div className="alert alert-slate" style={{ marginBottom: 16 }}>
          <Lock className="alert-icon h-4 w-4" />
          <div>
            <div className="alert-title">This restaurant is closed</div>
            <div className="alert-body">
              {restaurant.name} was permanently closed and its profile can no longer be edited.
              Your dinner history remains visible from the{" "}
              <Link href="/admin" style={{ color: "var(--p)", fontWeight: 600 }}>
                Dashboard
              </Link>
              .
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="breakdown-row">
            <span className="breakdown-label">Name</span>
            <span className="breakdown-value">{restaurant.name}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Cuisine</span>
            <span className="breakdown-value">{restaurant.cuisine || "—"}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">City</span>
            <span className="breakdown-value">{restaurant.city || "—"}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Address</span>
            <span className="breakdown-value">{restaurant.address || "—"}</span>
          </div>
        </div>
      </div>
    );
  }

  const statusBadgeClass: Record<string, string> = {
    PENDING: "badge-yellow",
    ACTIVE: "badge-green",
    PAUSED: "badge-red",
  };
  const cuisineTags = (restaurant.cuisine || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const partnerSince = new Date(restaurant.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rp">
      <IconSprite />
      <MobileSubTabs tabs={profileTabs} marginBottom={14} />

      {/*
        Single flat scrolling column, matching the wireframe's "restructured
        again" premium-header + stacked-cards layout (§sec-restaurant-profile)
        - no sticky rail, no in-page anchor nav. Those existed here from an
        earlier, since-superseded "restaurant-profile.html" Apple mockup (see
        the CSS comment above .dine-admin .rp); the canonical wireframe
        dropped that shell entirely once Team/Media Library/Settings were
        promoted to their own sidebar destinations, leaving this page as one
        continuous identity+compliance story. As of 2026-08-08 the header,
        Table Themes, and Compliance Documents sections were further rebuilt
        to match the wireframe's literal markup 1:1 (plain .card + inline
        styles / shared .badge/.toggle, not the old bespoke .idcard/.tgrid/
        .drow component classes) - only Business Details, Contact
        Information, and the two non-wireframe states of "From Your
        Application" (the pre-verification prompt + its edit form) still use
        the original .rp-scoped .sec/.rp-card/.frow system, which is
        unchanged.
      */}
      <div className="col" style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {/* Premium profile header - banner, avatar, name, tags, stat row.
            Desktop and mobile are two literal wireframe frames (only-desktop /
            only-mobile, same pattern as admin/page.tsx), not one DOM reflowed
            by CSS - the wireframe's mobile frame drops "Manage in Media
            Library", drops "Partner Since" from the stat row (3-up instead of
            4), and uses shorter stat labels ("Dinners"/"Rating"/"Team"). */}
        <div className="card only-desktop" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: 110, background: "linear-gradient(150deg,#3d2b1f,#5c3d28)", position: "relative" }}>
            <Link
              href="/admin/media-library"
              style={{
                position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,.92)",
                borderRadius: 20, padding: "4px 10px", fontSize: 10.5, fontWeight: 600,
                color: "var(--text)", textDecoration: "none",
              }}
            >
              Manage in Media Library →
            </Link>
          </div>
          <div style={{ padding: "0 20px 18px", position: "relative" }}>
            <div
              style={{
                width: 68, height: 68, borderRadius: 16,
                background: "linear-gradient(135deg,#8b6b4a,#5c3d28)", border: "4px solid var(--white)",
                marginTop: -34, marginBottom: 12, boxShadow: "0 4px 10px rgba(0,0,0,.15)",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <h1 className="pg-title" style={{ margin: 0 }}>{restaurant.name}</h1>
                  <span className={`badge ${statusBadgeClass[restaurant.status] ?? "badge-slate"}`}>
                    {restaurant.status}
                  </span>
                </div>
                {cuisineTags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {cuisineTags.map((tag) => (
                      <span key={tag} className="badge badge-slate">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", borderTop: "1px solid var(--bdr)", paddingTop: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{dinners.length}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>Dinners Hosted</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                  {avgRating ? avgRating.average.toFixed(1) : "—"} ★
                </div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>Avg Rating</div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{teamCount}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>
                  <Link href="/admin/team" style={{ color: "inherit", textDecoration: "none" }}>
                    Team Members →
                  </Link>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{partnerSince}</div>
                <div style={{ fontSize: 11, color: "var(--t3)" }}>Partner Since</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card only-mobile" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ height: 90, background: "linear-gradient(150deg,#3d2b1f,#5c3d28)" }} />
          <div style={{ padding: "0 14px 14px" }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: "linear-gradient(135deg,#8b6b4a,#5c3d28)", border: "3px solid var(--white)",
                marginTop: -28, marginBottom: 10, boxShadow: "0 3px 8px rgba(0,0,0,.15)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{restaurant.name}</div>
              <span className={`badge ${statusBadgeClass[restaurant.status] ?? "badge-slate"}`}>
                {restaurant.status}
              </span>
            </div>
            {cuisineTags.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {cuisineTags.map((tag) => (
                  <span key={tag} className="badge badge-slate">{tag}</span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 16, borderTop: "1px solid var(--bdr)", paddingTop: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{dinners.length}</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>Dinners</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                  {avgRating ? avgRating.average.toFixed(1) : "—"}★
                </div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>Rating</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{teamCount}</div>
                <div style={{ fontSize: 10, color: "var(--t3)" }}>Team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Read-only Overview - identity, business details, team/media
            previews, table themes, compliance documents. Every editable
            field lives behind Edit Profile → /admin/restaurant/edit
            instead (§sec-restaurant-profile, "two modes, not one"). */}
        <RestaurantOverview
          restaurant={restaurant}
          members={restaurantWithMembers?.members ?? []}
          allThemes={allThemes}
          enabledThemeIds={enabledThemeIds}
          documents={complianceDocuments}
          mediaItems={mediaItems}
          mediaTotalCount={mediaItems.length}
        />
      </div>
    </div>
  );
}
