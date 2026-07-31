"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@dinewithme/db";
import { updateRestaurant } from "../actions";

interface ApplicationInfoCardProps {
  restaurant: Restaurant;
}

const REFERRAL_SOURCES = [
  "Google Search",
  "Instagram",
  "Facebook",
  "Word of Mouth",
  "Another Restaurant",
  "Other",
];

/**
 * Summary of the Onboarding Verification step (§16.1 wireframe). Once a
 * registrationNumber exists, these fields went through Platform Ops
 * verification and become read-only - "contact support" rather than a
 * self-serve edit, so a verified badge stays trustworthy. Restaurants that
 * predate the Verification step (registrationNumber null) get an inline
 * "add this info" form instead of an empty locked card - nothing was ever
 * verified there, so there's nothing to protect.
 */
export function ApplicationInfoCard({ restaurant }: ApplicationInfoCardProps) {
  const router = useRouter();
  const predatesVerification = !restaurant.registrationNumber;
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    registrationNumber: restaurant.registrationNumber || "",
    googleBusinessUrl: restaurant.googleBusinessUrl || "",
    instagramHandle: restaurant.instagramHandle || "",
    facebookUrl: restaurant.facebookUrl || "",
    referralSource: restaurant.referralSource || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateRestaurant(restaurant.id, formData);
      if (result.success) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    });
  };

  if (predatesVerification && !editing) {
    return (
      <div className="alert alert-yellow" style={{ marginBottom: 20, justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10 }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <div className="alert-title">Add your verification info</div>
            <div className="alert-body">
              Your restaurant predates our verification step. Adding a business registration
              number and a link or two helps our team keep the platform trustworthy — it&apos;s
              optional and won&apos;t affect your listing.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="btn btn-outline btn-sm"
          style={{ flexShrink: 0, alignSelf: "flex-start" }}
        >
          Add info
        </button>
      </div>
    );
  }

  if (predatesVerification && editing) {
    return (
      <div style={{ marginBottom: 20 }}>
        <div className="group-label">VERIFICATION INFO</div>
        <div className="card card-pad">
        {error && (
          <div
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid var(--red-bg)",
              background: "var(--red-bg)",
              padding: "12px 14px",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="registrationNumber" className="field-label">
              Business Registration Number
            </label>
            <input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="field-input field-cap"
              disabled={isPending}
            />
            {fieldErrors.registrationNumber && (
              <p className="field-error">{fieldErrors.registrationNumber[0]}</p>
            )}
          </div>

          <div className="field-grid-2">
            <div>
              <label htmlFor="googleBusinessUrl" className="field-label">
                Google Business URL
              </label>
              <input
                type="url"
                id="googleBusinessUrl"
                name="googleBusinessUrl"
                value={formData.googleBusinessUrl}
                onChange={handleChange}
                className="field-input"
                disabled={isPending}
              />
              {fieldErrors.googleBusinessUrl && (
                <p className="field-error">{fieldErrors.googleBusinessUrl[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="instagramHandle" className="field-label">
                Instagram Handle
              </label>
              <input
                type="text"
                id="instagramHandle"
                name="instagramHandle"
                value={formData.instagramHandle}
                onChange={handleChange}
                placeholder="@yourrestaurant"
                className="field-input"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="facebookUrl" className="field-label">
                Facebook URL
              </label>
              <input
                type="url"
                id="facebookUrl"
                name="facebookUrl"
                value={formData.facebookUrl}
                onChange={handleChange}
                className="field-input"
                disabled={isPending}
              />
              {fieldErrors.facebookUrl && <p className="field-error">{fieldErrors.facebookUrl[0]}</p>}
            </div>

            <div>
              <label htmlFor="referralSource" className="field-label">
                How did you hear about us?
              </label>
              <select
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                className="field-input"
                disabled={isPending}
              >
                <option value="">Select one</option>
                {REFERRAL_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-outline btn-sm"
              disabled={isPending}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
        </div>
        <div className="group-footnote">Helps our team verify your business — all fields optional.</div>
      </div>
    );
  }

  // Verified - read-only. Contact support rather than a self-serve edit, so
  // a "Verified" badge stays trustworthy (§16.1 wireframe).
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="group-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        FROM YOUR APPLICATION
        <span className="badge badge-green" style={{ fontSize: 10, textTransform: "none", letterSpacing: 0 }}>
          ✓ Verified
        </span>
      </div>
      <div className="card card-pad">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="breakdown-row">
          <span className="breakdown-label">Business Registration Number</span>
          <span className="breakdown-value">{restaurant.registrationNumber || "—"}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Google Business Profile</span>
          <span className="breakdown-value">
            {restaurant.googleBusinessUrl ? (
              <a
                href={restaurant.googleBusinessUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--p)", fontWeight: 600 }}
              >
                View listing →
              </a>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Instagram</span>
          <span className="breakdown-value">{restaurant.instagramHandle || "—"}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Facebook</span>
          <span className="breakdown-value">
            {restaurant.facebookUrl ? (
              <a
                href={restaurant.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--p)", fontWeight: 600 }}
              >
                View page →
              </a>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Referral Source</span>
          <span className="breakdown-value">{restaurant.referralSource || "—"}</span>
        </div>
      </div>
      </div>
      <div className="group-footnote">
        Submitted during onboarding — shown here so you never re-enter it. Need to correct
        something? These went through Platform Ops verification, so contact support rather than
        editing directly — that keeps your verified status trustworthy.
      </div>
    </div>
  );
}
