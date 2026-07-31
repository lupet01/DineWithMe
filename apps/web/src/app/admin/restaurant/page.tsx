import Link from "next/link";
import { Lock } from "lucide-react";
import { getAuthUser } from "@/lib/auth/server";
import {
  restaurantRepository,
  themeRepository,
  complianceDocumentRepository,
  dinnerRepository,
  feedbackRepository,
} from "@dinewithme/db";
import { RestaurantForm } from "./components/restaurant-form";
import { ApplicationInfoCard } from "./components/application-info-card";
import { RestaurantOnboardingWizard } from "./components/restaurant-onboarding-wizard";
import { ThemeManager } from "./components/theme-manager";
import { ComplianceDocumentsManager } from "./components/compliance-documents-manager";

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
  const [restaurantWithMembers, dinners, avgRating] = await Promise.all([
    restaurantRepository.findByIdWithMembers(restaurant.id),
    dinnerRepository.findByRestaurant(restaurant.id),
    feedbackRepository.getAverageRatingForRestaurant(restaurant.id),
  ]);
  const teamCount = restaurantWithMembers?.members.length ?? 0;

  // Archived: permanently closed (§16.7, only reachable via an approved
  // RestaurantClosureRequest). Read-only from here on - no edit forms, just
  // a summary and a pointer to preserved history, matching Settings' and
  // the Dashboard's own locked treatment for this status.
  if (restaurant.status === "ARCHIVED") {
    return (
      <div>
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

  const statusBadge: Record<string, string> = {
    PENDING: "badge-yellow",
    ACTIVE: "badge-green",
    PAUSED: "badge-red",
  };

  return (
    <div>
      {/* Premium Profile Header — taller cover, bigger avatar, real presence */}
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
        <div className="profile-cover" style={{ background: "linear-gradient(150deg,#3d2b1f,#5c3d28)" }}>
          <Link
            href="/admin/media-library"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(255,255,255,.92)",
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            Manage in Media Library →
          </Link>
        </div>
        <div style={{ padding: "0 22px 22px" }}>
          <div
            className="profile-avatar"
            style={{ background: "linear-gradient(135deg,#8b6b4a,#5c3d28)" }}
          />
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="pg-title" style={{ margin: 0 }}>
                {restaurant.name}
              </h1>
              <span className={`badge ${statusBadge[restaurant.status] ?? "badge-slate"}`}>
                {restaurant.status}
              </span>
            </div>
            {restaurant.cuisine && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                {restaurant.cuisine.split(",").map((c) => (
                  <span key={c.trim()} className="badge badge-slate">
                    {c.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header stats — own card, same stat-card language as the Dashboard */}
      <div className="stat-grid-4" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Dinners Hosted</div>
          <div className="stat-value">{dinners.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Rating</div>
          <div className="stat-value">{avgRating ? `${avgRating.average.toFixed(1)} ★` : "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Team</div>
          <div className="stat-value">{teamCount}</div>
          <Link href="/admin/team" className="stat-sub" style={{ display: "block" }}>
            View team →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label">Partner Since</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {new Date(restaurant.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* From Your Application - identity-first, ahead of the editable form (§16.1) */}
      <ApplicationInfoCard restaurant={restaurant} />

      {/* Business Details + Contact Information */}
      <RestaurantForm restaurant={restaurant} />

      {/* Theme Management */}
      <div style={{ marginTop: 24 }}>
        <div className="group-label">TABLE THEMES</div>
        <div className="card card-pad">
          <ThemeManager
            restaurantId={restaurant.id}
            allThemes={allThemes}
            enabledThemeIds={enabledThemeIds}
          />
        </div>
        <div className="group-footnote">
          Choose which types of dining experiences you&apos;d like to host. Enabled themes become
          available when creating new dinners; disabling one won&apos;t affect existing dinners.
        </div>
      </div>

      {/* Compliance Documents */}
      <div style={{ marginTop: 28 }}>
        <div className="group-label">COMPLIANCE DOCUMENTS</div>
        <div className="card card-pad">
          <ComplianceDocumentsManager restaurantId={restaurant.id} documents={complianceDocuments} />
        </div>
        <div className="group-footnote">
          Business registration, food safety certificate, and liquor license — reviewed by our team
          before your first dinner goes live.
        </div>
      </div>
    </div>
  );
}
