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

  const [formData, setFormData] = useState<UpdateRestaurantInput>({
    name: restaurant.name || "",
    description: restaurant.description || "",
    cuisine: restaurant.cuisine || "",
    city: restaurant.city || "",
    address: restaurant.address || "",
    phone: restaurant.phone || "",
    website: restaurant.website || "",
  });

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

      {/* Business Details */}
      <div style={{ marginBottom: 4 }}>
        <div className="group-label">BUSINESS DETAILS</div>
      </div>
      <div className="card card-pad" style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="name" className="field-label">
              Restaurant Name <span className="req">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="field-input field-cap"
              placeholder="e.g., The Gourmet Kitchen"
              required
              disabled={isPending}
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
              className="field-input ta"
              placeholder="Describe your restaurant's atmosphere, specialties, and what makes it unique..."
              disabled={isPending}
            />
            {fieldErrors.description && <p className="field-error">{fieldErrors.description[0]}</p>}
          </div>

          <div>
            <label className="field-label">
              Cuisine Type{" "}
              <span style={{ color: "var(--t3)", fontWeight: 400 }}>(multi-select)</span>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CUISINE_OPTIONS.map((option) => (
                <span
                  key={option}
                  role="button"
                  tabIndex={0}
                  onClick={() => !isPending && toggleCuisine(option)}
                  className={`chip-select ${cuisines.includes(option) ? "selected" : ""}`}
                >
                  {option}
                  {cuisines.includes(option) ? " ✕" : ""}
                </span>
              ))}
            </div>
            {fieldErrors.cuisine && <p className="field-error">{fieldErrors.cuisine[0]}</p>}
          </div>

          <div className="field-grid-2">
            <div>
              <label htmlFor="city" className="field-label">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="field-input"
                placeholder="e.g., Cape Town"
                disabled={isPending}
              />
              {fieldErrors.city && <p className="field-error">{fieldErrors.city[0]}</p>}
            </div>

            <div>
              <label htmlFor="address" className="field-label">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="field-input"
                placeholder="e.g., 123 Main Street"
                disabled={isPending}
              />
              {fieldErrors.address && <p className="field-error">{fieldErrors.address[0]}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="group-label" style={{ marginTop: 24 }}>
        CONTACT INFORMATION
      </div>
      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div className="field-grid-2">
          <div>
            <label htmlFor="phone" className="field-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="field-input"
              placeholder="e.g., +27 21 123 4567"
              disabled={isPending}
            />
            {fieldErrors.phone && <p className="field-error">{fieldErrors.phone[0]}</p>}
          </div>

          <div>
            <label htmlFor="website" className="field-label">
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="field-input"
              placeholder="e.g., https://yourrestaurant.com"
              disabled={isPending}
            />
            {fieldErrors.website && <p className="field-error">{fieldErrors.website[0]}</p>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
          disabled={isPending}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
