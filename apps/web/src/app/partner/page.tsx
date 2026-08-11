import "../admin/admin-design-system.css";
import { applyToPartner } from "./actions";
import { requireAuthUser } from "@/lib/auth/server";

/**
 * /partner — wireframe §sec-partner-apply. Reachable by any signed-in diner,
 * unlike everything under /admin which requires RESTAURANT_ADMIN/
 * PLATFORM_ADMIN already (see admin/layout.tsx) — this route is deliberately
 * outside that layout so a plain diner can actually reach it, gated only on
 * being signed in at all (requireAuthUser redirects to /sign-in otherwise,
 * same as the destination onboarding flow expects). Uses the same
 * .dine-admin design-system classes as the onboarding wizard it lands on,
 * so the transition from this page into that flow feels continuous.
 */
export default async function PartnerApplyPage() {
  await requireAuthUser();

  return (
    <div className="dine-admin">
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "44px 20px 40px",
          background: "var(--bg)",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🏪</div>
        <h1 className="pg-title" style={{ textAlign: "center" }}>
          Partner With DineWithMe
        </h1>
        <p
          className="pg-sub"
          style={{ textAlign: "center", maxWidth: 460, marginBottom: 26 }}
        >
          List your restaurant, host themed dinners, and reach diners looking for exactly
          what you offer — no cost to get started.
        </p>

        <div
          className="field-grid-2"
          style={{ width: "100%", maxWidth: 760, marginBottom: 22 }}
        >
          <div className="card card-pad">
            <div style={{ fontSize: 20, marginBottom: 8 }}>🎯</div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Fill empty seats
            </div>
            <div className="card-title-sub">
              Themed dinners bring diners in on your slower nights.
            </div>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 20, marginBottom: 8 }}>💳</div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Get paid upfront
            </div>
            <div className="card-title-sub">Seats are paid for at booking, not on arrival.</div>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 20, marginBottom: 8 }}>🛡️</div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Vetted diners
            </div>
            <div className="card-title-sub">Every guest goes through identity verification.</div>
          </div>
          <div className="card card-pad only-desktop">
            <div style={{ fontSize: 20, marginBottom: 8 }}>📋</div>
            <div className="card-title" style={{ marginBottom: 4 }}>
              Free to list
            </div>
            <div className="card-title-sub">No subscription required to get started today.</div>
          </div>
        </div>

        <form action={applyToPartner}>
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 32px" }}>
            Apply to List Your Restaurant
          </button>
        </form>
        <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 10, textAlign: "center" }}>
          Takes about 5 minutes. Your restaurant goes live once our team reviews it — usually
          within a day or two.
        </div>
      </div>
    </div>
  );
}
