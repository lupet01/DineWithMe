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
  // a "Verified" badge stays trustworthy (§16.1 wireframe).
  return (
    <section className="sec" id="sec-app">
      <div className="sec-head">
        <div className="sec-label">From your application</div>
        <span className="seal"><svg><use href="#ic-check" /></svg> Verified by Platform Ops</span>
      </div>
      <div className="rp-card">
        <div className="frow">
          <div className="rlabel">Business registration <svg className="lockicon"><use href="#ic-lock" /></svg></div>
          <div className="rval mono">{restaurant.registrationNumber || "—"}</div>
        </div>
        <div className="frow">
          <div className="rlabel">Google Business Profile <svg className="lockicon"><use href="#ic-lock" /></svg></div>
          <div className="rval">
            {restaurant.googleBusinessUrl ? (
              <a className="rlink" href={restaurant.googleBusinessUrl} target="_blank" rel="noopener noreferrer">
                View listing <svg><use href="#ic-ext" /></svg>
              </a>
            ) : "—"}
          </div>
        </div>
        <div className="frow">
          <div className="rlabel">Instagram <svg className="lockicon"><use href="#ic-lock" /></svg></div>
          <div className="rval">{restaurant.instagramHandle || "—"}</div>
        </div>
        <div className="frow">
          <div className="rlabel">Facebook <svg className="lockicon"><use href="#ic-lock" /></svg></div>
          <div className="rval">
            {restaurant.facebookUrl ? (
              <a className="rlink" href={restaurant.facebookUrl} target="_blank" rel="noopener noreferrer">
                View page <svg><use href="#ic-ext" /></svg>
              </a>
            ) : "—"}
          </div>
        </div>
        <div className="frow">
          <div className="rlabel">Heard about us via <svg className="lockicon"><use href="#ic-lock" /></svg></div>
          <div className="rval">{restaurant.referralSource || "—"}</div>
        </div>
      </div>
      <p className="foot">
        Collected during onboarding so you never re-enter it. These went through verification, so
        they are locked here — contact support to correct one and keep your verified badge intact.
      </p>
    </section>
  );
}
