"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRestaurant } from "../actions";
import { requestComplianceUploadUrl, saveComplianceDocument } from "../compliance-actions";
import type { CreateRestaurantInput } from "@dinewithme/shared";

const REFERRAL_SOURCES = [
  "Google search",
  "Social media",
  "Word of mouth / another restaurant",
  "Other",
];

const CUISINE_OPTIONS = [
  "Italian",
  "Japanese",
  "French",
  "Indian",
  "Mexican",
  "Mediterranean",
  "Fusion",
  "South African",
];

const emptyForm: CreateRestaurantInput = {
  name: "",
  description: "",
  cuisine: "",
  city: "",
  address: "",
  phone: "",
  website: "",
  registrationNumber: "",
  googleBusinessUrl: "",
  instagramHandle: "",
  facebookUrl: "",
  referralSource: "",
};

const STEP_LABELS = ["Basic Info", "Location & Contact", "Verification", "Review"];

function StepBreadcrumb({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="onboarding-progress">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const cls = n < step ? "step-done" : n === step ? "step-current" : "step-pending";
        const marker = n < step ? "✓" : ["①", "②", "③", "④"][i];
        return (
          <span key={label}>
            <span className={cls}>
              {marker} {label}
            </span>
            {i < STEP_LABELS.length - 1 && <span className="step-sep"> →</span>}
          </span>
        );
      })}
    </div>
  );
}

function StepDots({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className="onboarding-dots">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={`onboarding-dot ${n <= step ? "filled" : ""}`} />
      ))}
    </div>
  );
}

/**
 * 4-step onboarding wizard (§16.1) - Business Registration Number and
 * Business Registration Document are the required anti-spam fields on
 * Step 3; everything else there is optional attribution. Food Safety
 * Certificate/Liquor License deliberately stay out of this wizard - they
 * lag real applicants by days, so gating signup on them would cost
 * legitimate restaurants along with spam. Those are uploaded post-approval
 * via the existing Compliance Documents section. Step 4 (Review) is the
 * only step that actually calls createRestaurant() - an abandoned wizard
 * leaves no partial Restaurant row behind. The registration document is
 * uploaded right after that call succeeds, reusing the existing
 * ComplianceDocument signed-upload pipeline (it can't be attached earlier,
 * since it requires a restaurantId that doesn't exist until then).
 */
export function RestaurantOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [formData, setFormData] = useState<CreateRestaurantInput>(emptyForm);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [regDoc, setRegDoc] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState<{ name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const toggleCuisine = (option: string) => {
    setCuisines((prev) => {
      const next = prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option];
      setFormData((f) => ({ ...f, cuisine: next.join(", ") }));
      return next;
    });
  };

  const goNext = () => {
    setError(null);
    if (step === 1 && !formData.name.trim()) {
      setFieldErrors({ name: ["Restaurant name is required"] });
      return;
    }
    if (step === 3 && !formData.registrationNumber?.trim()) {
      setFieldErrors({ registrationNumber: ["Business registration number is required"] });
      return;
    }
    if (step === 3 && !regDoc) {
      setFieldErrors((prev) => ({
        ...prev,
        registrationDocument: ["Business registration document is required"],
      }));
      return;
    }
    setStep((s) => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await createRestaurant(formData);
      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
          if (result.fieldErrors.name) setStep(1);
          else if (result.fieldErrors.registrationNumber) setStep(3);
        }
        return;
      }

      if (regDoc) {
        try {
          const signed = await requestComplianceUploadUrl(
            result.data.restaurantId,
            regDoc.name,
            regDoc.type
          );
          if (signed.success && signed.data) {
            await fetch(signed.data.uploadUrl, {
              method: "PUT",
              body: regDoc,
              headers: { "Content-Type": regDoc.type },
            });
            await saveComplianceDocument(
              result.data.restaurantId,
              "BUSINESS_REGISTRATION",
              regDoc.name,
              signed.data.key,
              signed.data.publicUrl
            );
          }
        } catch {
          // Restaurant creation already succeeded - the doc can be
          // re-uploaded from Restaurant Profile, so this stays non-fatal.
        }
      }

      setSubmitted({ name: formData.name });
    });
  };

  if (submitted) {
    return (
      <div className="onboarding-confirm">
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>
          Application submitted!
        </div>
        <div
          style={{
            fontSize: "12.5px",
            color: "var(--t2)",
            marginTop: 8,
            lineHeight: 1.5,
            maxWidth: 400,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {submitted.name} is under review. We&apos;ll email you within a day or two — meanwhile
          you can explore your dashboard and get a head start on your menu.
        </div>
        <span className="badge badge-tint" style={{ marginTop: 14, display: "inline-block" }}>
          Status: Pending Review
        </span>
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ marginTop: 18 }}
          onClick={() => router.push("/admin")}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="onboarding-wrap">
      <StepBreadcrumb step={step} />
      <StepDots step={step} />

      {step === 1 && (
        <>
          <div className="onboarding-emoji">🍽️</div>
          <h1 className="pg-title" style={{ textAlign: "center" }}>
            Welcome to DineWithMe
          </h1>
          <p className="pg-sub" style={{ textAlign: "center", maxWidth: 420, marginBottom: 24 }}>
            Let&apos;s set up your restaurant profile to start hosting amazing dining experiences
          </p>
        </>
      )}

      {step === 2 && (
        <p className="pg-sub" style={{ textAlign: "center", marginBottom: 12 }}>
          Step 2 of 4 — where can diners find you?
        </p>
      )}
      {step === 3 && (
        <p className="pg-sub" style={{ textAlign: "center", marginBottom: 12 }}>
          Step 3 of 4 — help us verify you&apos;re real
        </p>
      )}
      {step === 4 && (
        <p className="pg-sub" style={{ textAlign: "center", marginBottom: 12 }}>
          Step 4 of 4 — review &amp; submit
        </p>
      )}

      {error && (
        <div
          className="onboarding-card"
          style={{
            marginBottom: 14,
            borderRadius: 12,
            border: "1px solid var(--red-bg)",
            background: "var(--red-bg)",
            padding: "12px 14px",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      {step === 1 && (
        <div className="card card-pad onboarding-card">
          <div className="card-title" style={{ marginBottom: 2 }}>
            Basic Information
          </div>
          <p className="card-title-sub" style={{ marginBottom: 16 }}>
            Tell us about your restaurant
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="name" className="field-label">
                Restaurant Name <span className="req">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., The Gourmet Kitchen"
                disabled={isPending}
                className="field-input"
              />
              {fieldErrors.name && <p className="field-error">{fieldErrors.name[0]}</p>}
            </div>
            <div>
              <label htmlFor="description" className="field-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe your restaurant's atmosphere, specialties, and what makes it unique..."
                disabled={isPending}
                className="field-input ta"
              />
            </div>
            <div>
              <label className="field-label">
                Cuisine Type <span style={{ color: "var(--t3)", fontWeight: 400 }}>(multi-select)</span>
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CUISINE_OPTIONS.map((option) => (
                  <span
                    key={option}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleCuisine(option)}
                    className={`chip-select ${cuisines.includes(option) ? "selected" : ""}`}
                  >
                    {option}
                    {cuisines.includes(option) ? " ✕" : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="onboarding-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/discover")}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={isPending}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card card-pad onboarding-card">
          <div className="card-title" style={{ marginBottom: 2 }}>
            Location &amp; Contact
          </div>
          <p className="card-title-sub" style={{ marginBottom: 16 }}>
            Where can diners find and reach you?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field-grid-2">
              <div>
                <label htmlFor="city" className="field-label">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Cape Town"
                  disabled={isPending}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="address" className="field-label">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g., 123 Main Street"
                  disabled={isPending}
                  className="field-input"
                />
              </div>
            </div>
            <div className="field-grid-2">
              <div>
                <label htmlFor="phone" className="field-label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g., +27 21 123 4567"
                  disabled={isPending}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="website" className="field-label">
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="e.g., https://yourrestaurant.com"
                  disabled={isPending}
                  className="field-input"
                />
                {fieldErrors.website && <p className="field-error">{fieldErrors.website[0]}</p>}
              </div>
            </div>
          </div>
          <div className="onboarding-actions" style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 22 }}>
            <button type="button" className="btn btn-outline" onClick={goBack} disabled={isPending}>
              ← Back
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={isPending}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card card-pad onboarding-card">
          <div className="card-title" style={{ marginBottom: 2 }}>
            Help Us Verify You&apos;re Real
          </div>
          <p className="card-title-sub" style={{ marginBottom: 16 }}>
            The faster we can confirm this, the faster we can approve you
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label htmlFor="registrationNumber" className="field-label">
                Business Registration Number <span className="req">*</span>
              </label>
              <input
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g., 2019/123456/07"
                disabled={isPending}
                className="field-input"
              />
              {fieldErrors.registrationNumber && (
                <p className="field-error">{fieldErrors.registrationNumber[0]}</p>
              )}
            </div>
            <div>
              <label className="field-label">
                Business Registration Document <span className="req">*</span>
              </label>
              <label className={`upload-dropzone ${regDoc ? "has-file" : ""}`}>
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  style={{ display: "none" }}
                  disabled={isPending}
                  onChange={(e) => {
                    setRegDoc(e.target.files?.[0] ?? null);
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.registrationDocument;
                      return next;
                    });
                  }}
                />
                <div style={{ fontSize: 20, marginBottom: 4 }}>{regDoc ? "✅" : "📄"}</div>
                <div style={{ fontSize: "12.5px", color: "var(--t2)" }}>
                  {regDoc ? regDoc.name : "Click to upload PDF, JPG, or PNG"}
                </div>
              </label>
              {fieldErrors.registrationDocument && (
                <p className="field-error">{fieldErrors.registrationDocument[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="googleBusinessUrl" className="field-label">
                Google Business Profile{" "}
                <span style={{ color: "var(--t3)", fontWeight: 400 }}>
                  (strongly recommended — speeds up review)
                </span>
              </label>
              <input
                id="googleBusinessUrl"
                name="googleBusinessUrl"
                type="url"
                value={formData.googleBusinessUrl}
                onChange={handleChange}
                placeholder="e.g., https://g.page/your-restaurant"
                disabled={isPending}
                className="field-input"
              />
              {fieldErrors.googleBusinessUrl && (
                <p className="field-error">{fieldErrors.googleBusinessUrl[0]}</p>
              )}
            </div>
            <div className="field-grid-2">
              <div>
                <label htmlFor="instagramHandle" className="field-label">
                  Instagram <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="instagramHandle"
                  name="instagramHandle"
                  value={formData.instagramHandle}
                  onChange={handleChange}
                  placeholder="e.g., @yourrestaurant"
                  disabled={isPending}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="facebookUrl" className="field-label">
                  Facebook <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={handleChange}
                  placeholder="e.g., facebook.com/yourrestaurant"
                  disabled={isPending}
                  className="field-input"
                />
                {fieldErrors.facebookUrl && <p className="field-error">{fieldErrors.facebookUrl[0]}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="referralSource" className="field-label">
                How did you hear about DineWithMe?{" "}
                <span style={{ color: "var(--t3)", fontWeight: 400 }}>(optional)</span>
              </label>
              <select
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleChange}
                disabled={isPending}
                className="field-input"
              >
                <option value="">Select one…</option>
                {REFERRAL_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="onboarding-actions" style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 22 }}>
            <button type="button" className="btn btn-outline" onClick={goBack} disabled={isPending}>
              ← Back
            </button>
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={isPending}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <>
          <div className="card card-pad onboarding-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="card-title">Review Your Details</div>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ fontSize: 12, color: "var(--p)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
              >
                ← Edit any field
              </button>
            </div>
            <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 4 }}>
              {[
                ["Restaurant Name", formData.name],
                ["Description", formData.description],
                ["Cuisine", formData.cuisine],
                ["City", formData.city],
                ["Address", formData.address],
                ["Phone", formData.phone],
                ["Website", formData.website],
                ["Registration Number", formData.registrationNumber],
                ["Registration Document", regDoc ? "✓ Uploaded" : ""],
                ["Google Business Profile", formData.googleBusinessUrl],
                ["Instagram", formData.instagramHandle],
                ["Facebook", formData.facebookUrl],
                ["Referral Source", formData.referralSource],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="breakdown-row">
                    <span className="breakdown-label">{label}</span>
                    <span
                      className="breakdown-value"
                      style={label === "Registration Document" ? { color: "var(--green-txt)" } : undefined}
                    >
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div
            className="card card-pad onboarding-card"
            style={{ marginTop: 14, background: "var(--bg2)" }}
          >
            <div className="card-title" style={{ marginBottom: 10, fontSize: 13 }}>
              What happens next
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                "Our team reviews your application — usually within a day or two, faster than before since you've already verified your business",
                "Once approved, upload your remaining compliance documents (food safety certificate, liquor license if applicable)",
                "Add your menu, hero photo, and gallery images",
                "Create your first themed dinner and go live",
              ].map((text, i) => (
                <div key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, color: "var(--p)", fontWeight: 700 }}>{i + 1}</span>
                  <div style={{ fontSize: "12.5px", color: "var(--t2)", lineHeight: 1.4 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="onboarding-card onboarding-actions"
            style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}
          >
            <button type="button" className="btn btn-outline" onClick={goBack} disabled={isPending}>
              ← Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
