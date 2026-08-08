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
 * "add this info" prompt instead of an empty locked card - nothing was ever
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
      <section className="sec" id="sec-app">
        <div className="sec-head">
          <div className="sec-label">From your application</div>
        </div>
        <div className="rp-card">
          <div className="prompt">
            <div className="prompt-ico"><svg><use href="#ic-shield" /></svg></div>
            <div>
              <div className="prompt-t">Add your verification info</div>
              <div className="prompt-b">
                Your profile was created before we started collecting these. A registration
                number and a link or two help us keep the platform trustworthy. It is optional
                and will not change your listing.
              </div>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rp-btn rp-btn-p rp-btn-sm"
                style={{ marginTop: 11 }}
              >
                Add details
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (predatesVerification && editing) {
    return (
      <section className="sec" id="sec-app">
        <div className="sec-head">
          <div className="sec-label">Verification info</div>
        </div>
        <div className="rp-card">
          {error && (
            <div style={{ margin: 16, marginBottom: 0, borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "12px 14px" }}>
              <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="frow">
              <label className="rlabel" htmlFor="registrationNumber">Business registration number</label>
              <div className="rctl">
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="inp"
                  disabled={isPending}
                />
                {fieldErrors.registrationNumber && (
                  <p className="field-error">{fieldErrors.registrationNumber[0]}</p>
                )}
              </div>
            </div>
            <div className="frow">
              <label className="rlabel" htmlFor="googleBusinessUrl">Google Business URL</label>
              <div className="rctl">
                <input
                  type="url"
                  id="googleBusinessUrl"
                  name="googleBusinessUrl"
                  value={formData.googleBusinessUrl}
                  onChange={handleChange}
                  className="inp"
                  disabled={isPending}
                />
                {fieldErrors.googleBusinessUrl && (
                  <p className="field-error">{fieldErrors.googleBusinessUrl[0]}</p>
                )}
              </div>
            </div>
            <div className="frow">
              <label className="rlabel" htmlFor="instagramHandle">Instagram handle</label>
              <div className="rctl">
                <input
                  type="text"
                  id="instagramHandle"
                  name="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={handleChange}
                  placeholder="@yourrestaurant"
                  className="inp"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="frow">
              <label className="rlabel" htmlFor="facebookUrl">Facebook URL</label>
              <div className="rctl">
                <input
                  type="url"
                  id="facebookUrl"
                  name="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  className="inp"
                  disabled={isPending}
                />
                {fieldErrors.facebookUrl && <p className="field-error">{fieldErrors.facebookUrl[0]}</p>}
              </div>
            </div>
            <div className="frow">
              <label className="rlabel" htmlFor="referralSource">How did you hear about us?</label>
              <div className="rctl">
                <select
                  id="referralSource"
                  name="referralSource"
                  value={formData.referralSource}
                  onChange={handleChange}
                  className="inp"
                  disabled={isPending}
                >
                  <option value="">Select one</option>
                  {REFERRAL_SOURCES.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "12px 16px" }}>
              <button type="button" onClick={() => setEditing(false)} className="rp-btn rp-btn-q rp-btn-sm" disabled={isPending}>
                Cancel
              </button>
              <button type="submit" className="rp-btn rp-btn-p rp-btn-sm" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
        <p className="foot">Helps our team verify your business — all fields optional.</p>
      </section>
    );
  }

  // Verified - read-only. Contact support rather than a self-serve edit, so
  // a "Verified" badge stays trustworthy (§16.1 wireframe). Desktop and
  // mobile are two literal wireframe frames (only-desktop / only-mobile):
  // desktop shows all 3 verified fields with a subtitle and a longer
  // footnote; mobile drops Google Business Profile and uses shorter copy
  // throughout. Facebook and "heard about us via" aren't part of the
  // wireframe's "From Your Application" card at all - they stay collected
  // (still editable via the pre-verification "Add details" path above) but
  // are no longer displayed here.
  return (
    <>
      <div className="card card-pad only-desktop" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ padding: 0 }}>From Your Application</div>
            <div className="card-title-sub" style={{ padding: 0 }}>
              Submitted during onboarding — shown here so you never re-enter it
            </div>
          </div>
          <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Verified</span>
        </div>
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
                  style={{ color: "var(--p)", textDecoration: "none", fontWeight: 600 }}
                >
                  View listing →
                </a>
              ) : "—"}
            </span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Instagram</span>
            <span className="breakdown-value">{restaurant.instagramHandle || "—"}</span>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 12 }}>
          Need to correct something here? These went through Platform Ops verification at
          onboarding — contact support rather than editing directly, so your verified status stays
          trustworthy.
        </p>
      </div>

      <div className="card card-pad only-mobile" style={{ marginBottom: 14 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>From Your Application</div>
        <div className="breakdown-row">
          <span className="breakdown-label">Registration No.</span>
          <span className="breakdown-value">{restaurant.registrationNumber || "—"}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">Instagram</span>
          <span className="breakdown-value">{restaurant.instagramHandle || "—"}</span>
        </div>
        <p style={{ fontSize: 10.5, color: "var(--t3)", marginTop: 8 }}>
          Contact support to change verified details.
        </p>
      </div>
    </>
  );
}
