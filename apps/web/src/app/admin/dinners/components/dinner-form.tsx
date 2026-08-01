"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createDinner } from "../create-actions";
import { saveDinnerListingPhotos } from "../media-actions";

interface DinnerFormProps {
  restaurantId: string;
  restaurantName: string;
  enabledThemes: Array<{
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  }>;
  photoPool: Array<{ id: string; url: string }>;
  meals: Array<{ id: string; name: string; suggestedPricePerSeatCents: number }>;
}

export function DinnerForm({
  restaurantId,
  restaurantName,
  enabledThemes,
  photoPool,
  meals,
}: DinnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [showThemeDetails, setShowThemeDetails] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("");

  const handleMealChange = (mealId: string) => {
    setSelectedMealId(mealId);
    const meal = meals.find((m) => m.id === mealId);
    if (meal) {
      setPricePerSeat((meal.suggestedPricePerSeatCents / 100).toFixed(2));
    }
  };

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const startsAtDate = formData.get("startsAtDate") as string;
    const startsAtTime = formData.get("startsAtTime") as string;
    const endsAtTime = formData.get("endsAtTime") as string;

    // Combine date and time
    const startsAt = new Date(`${startsAtDate}T${startsAtTime}`);
    const endsAt = new Date(`${startsAtDate}T${endsAtTime}`);

    const priceCents = pricePerSeat ? Math.round(parseFloat(pricePerSeat) * 100) : undefined;

    const result = await createDinner({
      restaurantId,
      themeId: formData.get("themeId") as string,
      mealId: selectedMealId || undefined,
      pricePerSeatCents: priceCents !== undefined && !Number.isNaN(priceCents) ? priceCents : undefined,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      description: formData.get("description") as string || undefined,
      seatCount: parseInt(formData.get("seatCount") as string),
    });

    if (result.success) {
      if (selectedPhotoIds.length > 0) {
        await saveDinnerListingPhotos(result.data.dinnerId, selectedPhotoIds);
      }
      setLoading(false);
      router.push("/admin/dinners");
      router.refresh();
    } else {
      setLoading(false);
      setError(result.error);
    }
  };

  const selectedThemeData = enabledThemes.find((t) => t.id === selectedTheme);

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div style={{ borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "12px 14px" }}>
          <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
        </div>
      )}

      {/* Restaurant Info */}
      <div className="alert alert-slate">
        <p style={{ fontSize: 13, color: "var(--t2)" }}>
          Creating dinner for: <span style={{ fontWeight: 600, color: "var(--text)" }}>{restaurantName}</span>
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label htmlFor="themeId" className="field-label">
          Table Theme <span className="req">*</span>
        </label>
        {enabledThemes.length === 0 ? (
          <div className="alert alert-yellow">
            <div className="alert-body" style={{ color: "var(--yellow-txt2)" }}>
              No themes are enabled for your restaurant. Please enable at least
              one theme in your{" "}
              <Link href="/admin/restaurant" style={{ color: "inherit", textDecoration: "underline" }}>
                restaurant settings
              </Link>
              .
            </div>
          </div>
        ) : (
          <>
            <select
              id="themeId"
              name="themeId"
              required
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="field-input"
            >
              <option value="">Select a theme...</option>
              {enabledThemes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.title}
                </option>
              ))}
            </select>

            {selectedThemeData && (
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowThemeDetails(!showThemeDetails)}
                  style={{ background: "none", border: 0, padding: 0, cursor: "pointer", fontSize: 13, color: "var(--t2)", font: "inherit" }}
                >
                  {showThemeDetails ? "▾" : "▸"} View theme details
                </button>
                {showThemeDetails && (
                  <div style={{ marginTop: 8, padding: 12, background: "var(--bg2)", border: "1px solid var(--bdr)", borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: "var(--t2)" }}>{selectedThemeData.shortDescription}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Meal */}
      <div>
        <label htmlFor="mealId" className="field-label">Meal</label>
        {meals.length === 0 ? (
          <div className="alert alert-slate">
            <p style={{ fontSize: 13, color: "var(--t2)" }}>
              No Meals yet. Build one in{" "}
              <Link href="/admin/meals" style={{ color: "var(--p)", fontWeight: 600 }}>
                Meals
              </Link>{" "}
              to show a real menu on this dinner&apos;s listing, or leave this blank.
            </p>
          </div>
        ) : (
          <select
            id="mealId"
            name="mealId"
            value={selectedMealId}
            onChange={(e) => handleMealChange(e.target.value)}
            className="field-input"
          >
            <option value="">No meal</option>
            {meals.map((meal) => (
              <option key={meal.id} value={meal.id}>
                {meal.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Price per Seat */}
      <div>
        <label htmlFor="pricePerSeat" className="field-label">Price per Seat (ZAR)</label>
        <input
          type="number"
          id="pricePerSeat"
          name="pricePerSeat"
          min="0"
          step="0.01"
          value={pricePerSeat}
          onChange={(e) => setPricePerSeat(e.target.value)}
          placeholder="0.00"
          className="field-input"
        />
        <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>
          Pre-fills from the selected Meal&apos;s suggested price — still editable per dinner.
        </p>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="startsAtDate" className="field-label">
          Date <span className="req">*</span>
        </label>
        <input
          type="date"
          id="startsAtDate"
          name="startsAtDate"
          required
          min={minDate}
          className="field-input"
        />
      </div>

      {/* Time Range */}
      <div className="field-grid-2">
        <div>
          <label htmlFor="startsAtTime" className="field-label">
            Start Time <span className="req">*</span>
          </label>
          <input
            type="time"
            id="startsAtTime"
            name="startsAtTime"
            required
            defaultValue="19:00"
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="endsAtTime" className="field-label">
            End Time <span className="req">*</span>
          </label>
          <input
            type="time"
            id="endsAtTime"
            name="endsAtTime"
            required
            defaultValue="21:00"
            className="field-input"
          />
        </div>
      </div>

      {/* Seat Count */}
      <div>
        <label htmlFor="seatCount" className="field-label">
          Number of Seats <span className="req">*</span>
        </label>
        <input
          type="number"
          id="seatCount"
          name="seatCount"
          required
          min="2"
          max="20"
          defaultValue="6"
          className="field-input field-cap"
        />
        <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>Between 2 and 20 seats</p>
      </div>

      {/* Description (Optional) */}
      <div>
        <label htmlFor="description" className="field-label">Description (Optional)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add any special notes about this dinner..."
          className="field-input ta"
        />
      </div>

      {/* Listing Photos */}
      <div>
        <label className="field-label">Listing Photos</label>
        {photoPool.length === 0 ? (
          <div className="alert alert-slate">
            <p style={{ fontSize: 13, color: "var(--t2)" }}>
              No photos yet. Upload some to your{" "}
              <Link href="/admin/media-library" style={{ color: "var(--p)", fontWeight: 600 }}>
                Media Library
              </Link>{" "}
              first, then pick them here.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "var(--t3)", marginBottom: 8 }}>
              Pick photos from your library. The first one you select becomes the header photo guests see on Discover.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
              {photoPool.map((photo) => {
                const selectedIndex = selectedPhotoIds.indexOf(photo.id);
                const isSelected = selectedIndex !== -1;
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => togglePhoto(photo.id)}
                    style={{
                      position: "relative",
                      aspectRatio: "1 / 1",
                      overflow: "hidden",
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? "var(--p)" : "transparent"}`,
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
                    {isSelected && (
                      <span
                        style={{
                          position: "absolute", top: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "center",
                          height: 20, width: 20, borderRadius: "50%", background: "var(--p)", color: "#fff", fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {selectedIndex === 0 ? "★" : selectedIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid var(--hair)" }}>
        <button type="button" onClick={() => router.back()} disabled={loading} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" disabled={loading || enabledThemes.length === 0} className="btn btn-primary">
          {loading ? "Creating..." : "Create Dinner"}
        </button>
      </div>
    </form>
  );
}
