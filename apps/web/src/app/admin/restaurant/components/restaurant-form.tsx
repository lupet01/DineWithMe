"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@dinewithme/db";
import { updateRestaurant } from "../actions";
import type { UpdateRestaurantInput } from "@dinewithme/shared";

interface RestaurantFormProps {
  restaurant: Restaurant;
}

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

const DESCRIPTION_MAX = 400;

/**
 * Edit-only - the initial create flow is its own 4-step
 * RestaurantOnboardingWizard now (§16.1), with a Verification step this
 * flat form was never meant to grow.
 */
export function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const initialCuisines = (restaurant.cuisine || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const [cuisines, setCuisines] = useState<string[]>(initialCuisines);

  const initialFormData: UpdateRestaurantInput = {
    name: restaurant.name || "",
    description: restaurant.description || "",
    cuisine: restaurant.cuisine || "",
    city: restaurant.city || "",
    address: restaurant.address || "",
    phone: restaurant.phone || "",
    website: restaurant.website || "",
  };
  const [formData, setFormData] = useState<UpdateRestaurantInput>(initialFormData);

  const isDirty = Object.keys(initialFormData).some(
    (key) => formData[key as keyof UpdateRestaurantInput] !== initialFormData[key as keyof UpdateRestaurantInput]
  );
  const dirtyFieldLabels: Record<string, string> = {
    name: "Restaurant name",
    description: "Description",
    cuisine: "Cuisine type",
    city: "City",
    address: "Address",
    phone: "Phone number",
    website: "Website",
  };
  const dirtyFields = Object.keys(initialFormData).filter(
    (key) => formData[key as keyof UpdateRestaurantInput] !== initialFormData[key as keyof UpdateRestaurantInput]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateRestaurant(restaurant.id, formData);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleDiscard = () => {
    setFormData(initialFormData);
    setCuisines(initialCuisines);
    setError(null);
    setFieldErrors({});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev: Record<string, string[]>) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
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

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ marginBottom: 16, borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "12px 14px" }}>
          <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      {/* BUSINESS DETAILS */}
      <section className="sec" id="sec-biz">
        <div className="sec-head">
          <div className="sec-label">Business details</div>
          <span className="sec-aside" style={{ fontWeight: 500, color: "var(--t3w)" }}>Shown to guests</span>
        </div>
        <div className="rp-card">
          <div className="frow">
            <label className="rlabel" htmlFor="name">
              Restaurant name <span className="req" />
            </label>
            <div className="rctl">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="inp"
                placeholder="e.g., The Gourmet Kitchen"
                required
                disabled={isPending}
              />
              {fieldErrors.name && <p className="field-error">{fieldErrors.name[0]}</p>}
            </div>
          </div>

          <div className="frow stack">
            <label className="rlabel" htmlFor="description">Description</label>
            <div className="rctl">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="inp"
                placeholder="Describe your restaurant's atmosphere, specialties, and what makes it unique..."
                disabled={isPending}
                maxLength={DESCRIPTION_MAX}
              />
              <div className="ctl-row">
                <div className="hint">The first two lines appear on your dinner cards.</div>
                <div className="hint right">{(formData.description ?? "").length} / {DESCRIPTION_MAX}</div>
              </div>
              {fieldErrors.description && <p className="field-error">{fieldErrors.description[0]}</p>}
            </div>
          </div>

          <div className="frow stack">
            <div className="rlabel">Cuisine type</div>
            <div className="rctl">
              <div className="chips">
                {CUISINE_OPTIONS.map((option) => {
                  const selected = cuisines.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className="rp-chip"
                      aria-pressed={selected}
                      onClick={() => !isPending && toggleCuisine(option)}
                    >
                      <svg><use href="#ic-check" /></svg>
                      {option}
                    </button>
                  );
                })}
              </div>
              <div className="hint">Pick up to three. Guests filter dinners by these.</div>
              {fieldErrors.cuisine && <p className="field-error">{fieldErrors.cuisine[0]}</p>}
            </div>
          </div>

          <div className="frow">
            <label className="rlabel" htmlFor="city">City</label>
            <div className="rctl">
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="inp"
                placeholder="e.g., Cape Town"
                disabled={isPending}
              />
              {fieldErrors.city && <p className="field-error">{fieldErrors.city[0]}</p>}
            </div>
          </div>

          <div className="frow">
            <label className="rlabel" htmlFor="address">Address</label>
            <div className="rctl">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="inp"
                placeholder="e.g., 123 Main Street"
                disabled={isPending}
              />
              {fieldErrors.address && <p className="field-error">{fieldErrors.address[0]}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="sec" id="sec-contact">
        <div className="sec-head">
          <div className="sec-label">Contact information</div>
        </div>
        <div className="rp-card">
          <div className="frow">
            <label className="rlabel" htmlFor="phone">Phone number</label>
            <div className="rctl">
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="inp"
                placeholder="e.g., +27 21 123 4567"
                disabled={isPending}
              />
              {fieldErrors.phone && <p className="field-error">{fieldErrors.phone[0]}</p>}
            </div>
          </div>

          <div className="frow">
            <label className="rlabel" htmlFor="website">Website</label>
            <div className="rctl">
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="inp"
                placeholder="e.g., https://yourrestaurant.com"
                disabled={isPending}
              />
              {fieldErrors.website && <p className="field-error">{fieldErrors.website[0]}</p>}
            </div>
          </div>
        </div>
        <p className="foot">Used by our team to reach you about a booking. Guests only ever see your website.</p>
      </section>

      {isDirty && (
        <div className="savebar">
          <div className="savebar-in">
            <div className="dirty">
              <span className="pulse" />
              <b>{dirtyFields.length} unsaved change{dirtyFields.length === 1 ? "" : "s"}</b>
              &nbsp;·&nbsp;
              {dirtyFields.map((f) => dirtyFieldLabels[f]).join(", ")}
            </div>
            <button type="button" onClick={handleDiscard} className="rp-btn rp-btn-q" disabled={isPending}>
              Discard
            </button>
            <button type="submit" className="rp-btn rp-btn-p" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
