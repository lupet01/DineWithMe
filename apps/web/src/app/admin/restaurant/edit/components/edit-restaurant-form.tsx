"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@dinewithme/db";
import { updateRestaurant, updateOperatingHours } from "../../actions";
import type { UpdateRestaurantInput } from "@dinewithme/shared";
import {
  OPERATING_HOURS_DAYS,
  OPERATING_HOURS_DAY_LABELS,
  type OperatingHours,
  type DayHours,
} from "@dinewithme/shared";

interface EditRestaurantFormProps {
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
const CUISINE_VISIBLE_UNSELECTED = 4;
const emptyDay: DayHours = { open: "", close: "", closed: false };

function parseOperatingHours(value: unknown): OperatingHours {
  const parsed = (value ?? {}) as Partial<Record<string, Partial<DayHours>>>;
  return OPERATING_HOURS_DAYS.reduce((acc, day) => {
    const d = parsed[day];
    acc[day] = { open: d?.open ?? "", close: d?.close ?? "", closed: d?.closed ?? false };
    return acc;
  }, {} as OperatingHours);
}

/**
 * Business Details + Contact Information + Operating Hours, one page-level
 * Save Changes — folded into a single form this pass (§sec-restaurant-
 * profile). Used to be two independently-saving pieces (RestaurantForm's
 * own save bar + OperatingHoursCard's separate "Save Hours" button); the
 * wireframe never shows two save affordances on one page. No Cancel button
 * either — the breadcrumb/back-chevron above is the only exit, matching
 * every other full-page edit form in this file.
 */
export function EditRestaurantForm({ restaurant }: EditRestaurantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const initialCuisines = (restaurant.cuisine || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const [cuisines, setCuisines] = useState<string[]>(initialCuisines);
  const [showAllCuisines, setShowAllCuisines] = useState(false);

  const [formData, setFormData] = useState<UpdateRestaurantInput>({
    name: restaurant.name || "",
    description: restaurant.description || "",
    cuisine: restaurant.cuisine || "",
    city: restaurant.city || "",
    address: restaurant.address || "",
    phone: restaurant.phone || "",
    contactEmail: restaurant.contactEmail || "",
    website: restaurant.website || "",
  });

  const [hours, setHours] = useState<OperatingHours>(() => parseOperatingHours(restaurant.operatingHours));

  const setDay = (day: (typeof OPERATING_HOURS_DAYS)[number], patch: Partial<DayHours>) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const unselectedCuisines = CUISINE_OPTIONS.filter((option) => !cuisines.includes(option));
  const visibleUnselectedCuisines = showAllCuisines
    ? unselectedCuisines
    : unselectedCuisines.slice(0, CUISINE_VISIBLE_UNSELECTED);
  const hiddenCuisineCount = unselectedCuisines.length - visibleUnselectedCuisines.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const [restaurantResult, hoursResult] = await Promise.all([
        updateRestaurant(restaurant.id, formData),
        updateOperatingHours(restaurant.id, hours),
      ]);

      if (!restaurantResult.success) {
        setError(restaurantResult.error);
        if (restaurantResult.fieldErrors) setFieldErrors(restaurantResult.fieldErrors);
        return;
      }
      if (!hoursResult.success) {
        setError(hoursResult.error);
        return;
      }
      router.push("/admin/restaurant");
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ marginBottom: 16, borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "12px 14px" }}>
          <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <div className="card-title">Business Details</div>
          <div className="card-title-sub">The freely-editable parts of your public profile</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="field-label" htmlFor="name">
              Restaurant Name <span className="req">*</span>
            </label>
            <input
              id="name"
              name="name"
              className={`field-input${fieldErrors.name ? " error" : ""}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., The Gourmet Kitchen"
              required
              disabled={isPending}
            />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className={`field-input ta${fieldErrors.description ? " error" : ""}`}
              rows={3}
              value={formData.description}
              onChange={handleChange}
              maxLength={DESCRIPTION_MAX}
              placeholder="Describe your restaurant's atmosphere, specialties, and what makes it unique..."
              disabled={isPending}
            />
            {fieldErrors.description && <p className="field-error">{fieldErrors.description[0]}</p>}
          </div>

          <div>
            <label className="field-label">
              Cuisine Type{" "}
              <span style={{ color: "var(--t3)", fontWeight: 400 }}>(multi-select — was a single free-text field)</span>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {cuisines.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="badge"
                  style={{ background: "var(--p-tint)", color: "var(--p)", border: "1px solid var(--p)", cursor: "pointer" }}
                  onClick={() => !isPending && toggleCuisine(option)}
                >
                  {option} ✕
                </button>
              ))}
              {visibleUnselectedCuisines.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="badge badge-slate"
                  style={{ cursor: "pointer" }}
                  onClick={() => !isPending && toggleCuisine(option)}
                >
                  {option}
                </button>
              ))}
              {hiddenCuisineCount > 0 && (
                <button
                  type="button"
                  className="badge badge-slate"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowAllCuisines(true)}
                >
                  + More
                </button>
              )}
            </div>
            {fieldErrors.cuisine && <p className="field-error">{fieldErrors.cuisine[0]}</p>}
          </div>

          <div className="field-grid-2">
            <div>
              <label className="field-label" htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                className="field-input"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Cape Town"
                disabled={isPending}
              />
              {fieldErrors.city && <p className="field-error">{fieldErrors.city[0]}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="address">Address</label>
              <input
                id="address"
                name="address"
                className="field-input"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g., 123 Main Street"
                disabled={isPending}
              />
              {fieldErrors.address && <p className="field-error">{fieldErrors.address[0]}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 18 }}>
          <div className="card-title">Contact Information</div>
          <div className="card-title-sub">How can guests reach you?</div>
        </div>
        <div className="field-grid-2">
          <div>
            <label className="field-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="field-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g., +27 21 123 4567"
              disabled={isPending}
            />
            {fieldErrors.phone && <p className="field-error">{fieldErrors.phone[0]}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="contactEmail">Email</label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              className={`field-input${fieldErrors.contactEmail ? " error" : ""}`}
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="hello@yourrestaurant.com"
              disabled={isPending}
            />
            {fieldErrors.contactEmail && <p className="field-error">{fieldErrors.contactEmail[0]}</p>}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="url"
            className="field-input"
            value={formData.website}
            onChange={handleChange}
            placeholder="e.g., https://yourrestaurant.com"
            disabled={isPending}
          />
          {fieldErrors.website && <p className="field-error">{fieldErrors.website[0]}</p>}
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div className="card-title">Operating Hours</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {OPERATING_HOURS_DAYS.map((day) => {
            const d = hours[day] ?? emptyDay;
            return (
              <div key={day} className="hours-row">
                <span className="hours-day-label">{OPERATING_HOURS_DAY_LABELS[day]}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="11:00"
                  maxLength={5}
                  className="field-input hours-time-input"
                  value={d.open}
                  disabled={isPending || d.closed}
                  onChange={(e) => setDay(day, { open: e.target.value })}
                />
                <span className="hours-sep">to</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="22:00"
                  maxLength={5}
                  className="field-input hours-time-input"
                  value={d.close}
                  disabled={isPending || d.closed}
                  onChange={(e) => setDay(day, { close: e.target.value })}
                />
                <label className="hours-closed-label">
                  <input
                    type="checkbox"
                    checked={d.closed}
                    disabled={isPending}
                    onChange={(e) => setDay(day, { closed: e.target.checked })}
                  />
                  Closed
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
