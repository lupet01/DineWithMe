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
import { OperatingHoursCard } from "./components/operating-hours-card";
import { ThemeManager } from "./components/theme-manager";
import { ComplianceDocumentsManager } from "./components/compliance-documents-manager";
import { IconSprite } from "./components/icon-sprite";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0];
  if (!first) return "?";
  if (words.length === 1) return first.slice(0, 2).toUpperCase();
  const last = words[words.length - 1] ?? first;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

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
  const clearedDocuments = complianceDocuments.filter((d) => d.verifiedAt).length;

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

  const statusPillClass: Record<string, string> = {
    PENDING: "yellow",
    ACTIVE: "green",
    PAUSED: "red",
  };
  const cuisineTags = (restaurant.cuisine || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return (
    <div className="rp">
      <IconSprite />

      {/*
        Single flat scrolling column, matching the wireframe's "restructured
        again" premium-header + stacked-cards layout (§sec-restaurant-profile)
        - no sticky rail, no in-page anchor nav. Those existed here from an
        earlier, since-superseded "restaurant-profile.html" Apple mockup
        (see the CSS comment above .dine-admin .rp); the canonical wireframe
        dropped that shell entirely once Team/Media Library/Settings were
        promoted to their own sidebar destinations, leaving this page as one
        continuous identity+compliance story. The .rp-scoped classes below
        (idcard, rp-card, sec, etc.) are kept as-is - only the shell around
        them changed.
      */}
      <div className="col" style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        {/* Premium profile header - banner, avatar, name, tags, stat row */}
        <div className="idcard">
          <div className="cover">
            <Link href="/admin/media-library" className="cover-edit">
              Manage in Media Library →
            </Link>
          </div>
          <div className="id-body">
            <div className="avatar">{getInitials(restaurant.name)}</div>
            <div className="id-name">
              <h2>{restaurant.name}</h2>
              <span className={`rp-pill ${statusPillClass[restaurant.status] ?? "grey"}`}>
                {restaurant.status === "ACTIVE" && <svg><use href="#ic-check" /></svg>}
                {restaurant.status}
              </span>
            </div>
            {cuisineTags.length > 0 && (
              <div className="taglist">
                {cuisineTags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="stats">
            <div className="stat">
              <div className="stat-l">Dinners hosted</div>
              <div className="stat-v">{dinners.length}</div>
            </div>
            <div className="stat">
              <div className="stat-l">Avg rating</div>
              <div className="stat-v">
                {avgRating ? avgRating.average.toFixed(1) : "—"} <svg><use href="#ic-star" /></svg>
              </div>
            </div>
            <div className="stat">
              <div className="stat-l">Team members</div>
              <div className="stat-v">{teamCount}</div>
              <Link className="stat-link" href="/admin/team">
                Manage <svg><use href="#ic-chev" /></svg>
              </Link>
            </div>
            <div className="stat">
              <div className="stat-l">Partner since</div>
              <div className="stat-v sm">
                {new Date(restaurant.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>

        {/* From Your Application - identity-first, ahead of the editable form (§16.1) */}
        <ApplicationInfoCard restaurant={restaurant} />

        {/* Business Details + Contact Information */}
        <RestaurantForm restaurant={restaurant} />

        {/* Operating Hours - §6.2 wireframe, "NEW" badge; built but never
            rendered on this page until now */}
        <OperatingHoursCard restaurantId={restaurant.id} operatingHours={restaurant.operatingHours} />

        {/* Table Themes */}
        <section className="sec" id="sec-themes">
          <div className="sec-head">
            <div className="sec-label">Table themes</div>
            <span className="sec-aside">Hosting {enabledThemeIds.length} of {allThemes.length}</span>
          </div>
          <div className="rp-card">
            <ThemeManager
              restaurantId={restaurant.id}
              allThemes={allThemes}
              enabledThemeIds={enabledThemeIds}
            />
          </div>
          <p className="foot">
            Themes you host become selectable when you create a dinner. Turning one off never
            affects dinners already on the calendar.
          </p>
        </section>

        {/* Compliance Documents */}
        <section className="sec" id="sec-docs">
          <div className="sec-head">
            <div className="sec-label">Compliance documents</div>
            {complianceDocuments.length > 0 ? (
              <span className="sec-aside">
                {clearedDocuments} of {complianceDocuments.length} cleared
              </span>
            ) : (
              <span className="sec-aside" style={{ color: "var(--t3w)", fontWeight: 500 }}>None yet</span>
            )}
          </div>
          <div className="rp-card">
            <ComplianceDocumentsManager restaurantId={restaurant.id} documents={complianceDocuments} />
          </div>
          <p className="foot">
            Business registration and food safety must be cleared before your first dinner goes
            live. A liquor license is only needed if you plan to serve alcohol at the table.
          </p>
        </section>
      </div>
    </div>
  );
}
