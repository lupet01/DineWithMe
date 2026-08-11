import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, themeRepository, complianceDocumentRepository } from "@dinewithme/db";
import { EditRestaurantForm } from "./components/edit-restaurant-form";
import { ThemeManager } from "../components/theme-manager";
import { ComplianceDocumentsManager } from "../components/compliance-documents-manager";
import { IconSprite } from "../components/icon-sprite";

/**
 * Edit destination for Restaurant Profile (§sec-restaurant-profile) -
 * reached only via the "Edit Profile" button on the Overview page
 * (../page.tsx). Strips the rich banner header entirely: mid-edit, not
 * browsing, matching how Meal Editor and Edit Dinner also strip their
 * chrome down to just the form and a Save.
 */
export default async function EditRestaurantProfilePage() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0] || null;

  // No restaurant yet - nothing to edit, send back to the page that
  // renders the onboarding wizard instead.
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  // Archived is permanent and read-only (§16.7) - same enforcement as the
  // actions themselves, so a direct hit on this URL can't bypass it.
  if (restaurant.status === "ARCHIVED") {
    redirect("/admin/restaurant");
  }

  const [allThemes, enabledThemes, complianceDocuments] = await Promise.all([
    themeRepository.findActive(),
    themeRepository.findByRestaurant(restaurant.id),
    complianceDocumentRepository.findByRestaurant(restaurant.id),
  ]);
  const enabledThemeIds = enabledThemes.map((t) => t.id);

  return (
    <div className="rp">
      <IconSprite />
      <div className="col" style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Link
            href="/admin/restaurant"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700,
              color: "var(--p)", textDecoration: "none", padding: "5px 12px 5px 8px",
              border: "1px solid var(--bdr)", borderRadius: 20,
            }}
          >
            ← Restaurant Profile
          </Link>
          <span style={{ fontSize: 12, color: "var(--t3)" }}>/ Edit</span>
        </div>
        <div style={{ marginBottom: 20 }}>
          <h1 className="pg-title" style={{ fontSize: 20, margin: 0 }}>Edit Profile</h1>
          <p className="pg-sub" style={{ marginTop: 2 }}>
            Owner and Manager only — changes here are visible to every guest browsing Discover
          </p>
        </div>

        <EditRestaurantForm restaurant={restaurant} />

        <div className="card card-pad" style={{ marginTop: 20, marginBottom: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Table Themes</div>
            <div className="card-title-sub">Choose which types of dining experiences you&apos;d like to host</div>
          </div>
          <ThemeManager restaurantId={restaurant.id} allThemes={allThemes} enabledThemeIds={enabledThemeIds} />
        </div>

        <div className="card card-pad">
          <div style={{ marginBottom: 16 }}>
            <div className="card-title">Compliance Documents</div>
            <div className="card-title-sub">
              Part of the same identity story as the rest of this page, not a separate tab
            </div>
          </div>
          <ComplianceDocumentsManager restaurantId={restaurant.id} documents={complianceDocuments} />
        </div>
      </div>
    </div>
  );
}
