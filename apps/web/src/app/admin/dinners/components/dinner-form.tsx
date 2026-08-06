"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ConversationStyle } from "@prisma/client";
import { createDinner, updateDinner } from "../create-actions";
import { saveDinnerListingPhotos } from "../media-actions";
import { CONVERSATION_STYLES } from "../conversation-styles";

export interface MealDishPreview {
  course: "STARTER" | "MAIN" | "DESSERT";
  name: string;
}

export interface MealOption {
  id: string;
  name: string;
  suggestedPricePerSeatCents: number;
  dishes: MealDishPreview[];
}

export interface DinnerFormInitialValues {
  themeId: string;
  mealId: string | null;
  startsAtDate: string; // yyyy-mm-dd, local
  startsAtTime: string; // HH:mm, local
  endsAtTime: string; // HH:mm, local
  seatCount: number;
  pricePerSeatCents: number | null;
  description: string | null;
  conversationStyle: ConversationStyle | null;
  listingPhotoIds: string[];
  /** Seats already CONFIRMED/ATTENDED/COMPLETED - the seat-count floor when editing. */
  bookedSeatCount: number;
}

interface DinnerFormProps {
  mode?: "create" | "edit";
  dinnerId?: string;
  restaurantId: string;
  restaurantName: string;
  restaurantCuisine?: string | null;
  restaurantCity?: string | null;
  enabledThemes: Array<{
    id: string;
    key: string;
    title: string;
    shortDescription: string;
  }>;
  photoPool: Array<{ id: string; url: string }>;
  meals: MealOption[];
  initialValues?: DinnerFormInitialValues;
}

const COURSE_LABELS: Record<MealDishPreview["course"], string> = {
  STARTER: "Starter",
  MAIN: "Main",
  DESSERT: "Dessert",
};

export function DinnerForm({
  mode = "create",
  dinnerId,
  restaurantId,
  restaurantName,
  restaurantCuisine,
  restaurantCity,
  enabledThemes,
  photoPool,
  meals,
  initialValues,
}: DinnerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>(initialValues?.themeId ?? "");
  const [showThemeDetails, setShowThemeDetails] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>(initialValues?.listingPhotoIds ?? []);
  const [selectedMealId, setSelectedMealId] = useState<string>(initialValues?.mealId ?? "");
  const [pricePerSeat, setPricePerSeat] = useState<string>(
    initialValues?.pricePerSeatCents != null ? (initialValues.pricePerSeatCents / 100).toFixed(2) : ""
  );
  const [conversationStyle, setConversationStyle] = useState<ConversationStyle | "">(
    initialValues?.conversationStyle ?? ""
  );
  const [startsAtDate, setStartsAtDate] = useState(initialValues?.startsAtDate ?? "");
  const [startsAtTime, setStartsAtTime] = useState(initialValues?.startsAtTime ?? "19:00");
  const [endsAtTime, setEndsAtTime] = useState(initialValues?.endsAtTime ?? "21:00");
  const [seatCount, setSeatCount] = useState(String(initialValues?.seatCount ?? 6));
  const [description, setDescription] = useState(initialValues?.description ?? "");

  const bookedSeatCount = initialValues?.bookedSeatCount ?? 0;
  const seatCountFloor = Math.max(2, bookedSeatCount);

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

  const makeHeaderPhoto = (photoId: string) => {
    setSelectedPhotoIds((prev) => {
      if (!prev.includes(photoId)) return prev;
      return [photoId, ...prev.filter((id) => id !== photoId)];
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startsAt = new Date(`${startsAtDate}T${startsAtTime}`);
    const endsAt = new Date(`${startsAtDate}T${endsAtTime}`);

    if (!conversationStyle) {
      setError("Please choose a Conversation Style.");
      setLoading(false);
      return;
    }

    const priceCents = pricePerSeat ? Math.round(parseFloat(pricePerSeat) * 100) : undefined;
    const parsedSeatCount = parseInt(seatCount, 10);

    const shared = {
      themeId: selectedTheme,
      mealId: selectedMealId || undefined,
      pricePerSeatCents: priceCents !== undefined && !Number.isNaN(priceCents) ? priceCents : undefined,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      description: description || undefined,
      seatCount: parsedSeatCount,
      conversationStyle: conversationStyle || undefined,
    };

    const result =
      mode === "edit" && dinnerId
        ? await updateDinner({ dinnerId, ...shared })
        : await createDinner({ restaurantId, ...shared });

    if (result.success) {
      await saveDinnerListingPhotos(result.data.dinnerId, selectedPhotoIds);
      setLoading(false);
      router.push(mode === "edit" ? `/admin/dinners/${result.data.dinnerId}` : "/admin/dinners");
      router.refresh();
    } else {
      setLoading(false);
      setError(result.error);
    }
  };

  const selectedThemeData = enabledThemes.find((t) => t.id === selectedTheme);
  const selectedMealData = meals.find((m) => m.id === selectedMealId);

  // Get tomorrow's date as minimum (only enforced for new dinners - an
  // existing dinner being edited keeps whatever date it already has).
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const headerPhotoUrl = useMemo(() => {
    if (selectedPhotoIds.length === 0) return null;
    return photoPool.find((p) => p.id === selectedPhotoIds[0])?.url ?? null;
  }, [selectedPhotoIds, photoPool]);

  const previewSpotsTotal = Number.isFinite(parseInt(seatCount, 10)) ? parseInt(seatCount, 10) : 0;
  const previewSpotsLeft = Math.max(previewSpotsTotal - bookedSeatCount, 0);
  const previewDateStr = startsAtDate
    ? new Date(`${startsAtDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : "Pick a date";
  const previewTimeStr = startsAtTime
    ? new Date(`2000-01-01T${startsAtTime}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";
  const previewPrice = pricePerSeat ? `R ${parseFloat(pricePerSeat).toFixed(0)}` : "Free";

  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, alignItems: "start" }}
    >
      {/* auto-fit collapses this to a single column on narrower viewports
          (no media query needed) - form first, preview second, matching
          the wireframe's mobile adaptation without touching global CSS. */}
      <form onSubmit={handleSubmit} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {error && (
          <div style={{ borderRadius: 12, border: "1px solid var(--red-bg)", background: "var(--red-bg)", padding: "12px 14px" }}>
            <p style={{ fontSize: 13, color: "var(--red-txt)" }}>{error}</p>
          </div>
        )}

        {/* Restaurant Info */}
        <div className="alert alert-slate">
          <p style={{ fontSize: 13, color: "var(--t2)" }}>
            {mode === "edit" ? "Editing dinner for: " : "Creating dinner for: "}
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{restaurantName}</span>
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
          <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>
            Picking a Meal pre-fills Price per Seat below — still editable per dinner.
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
            min={mode === "create" ? minDate : undefined}
            value={startsAtDate}
            onChange={(e) => setStartsAtDate(e.target.value)}
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
              value={startsAtTime}
              onChange={(e) => setStartsAtTime(e.target.value)}
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
              value={endsAtTime}
              onChange={(e) => setEndsAtTime(e.target.value)}
              className="field-input"
            />
          </div>
        </div>

        {/* Seat Count + Price */}
        <div className="field-grid-2">
          <div>
            <label htmlFor="seatCount" className="field-label">
              Seat Count <span className="req">*</span>
            </label>
            <input
              type="number"
              id="seatCount"
              name="seatCount"
              required
              min={seatCountFloor}
              max="20"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              className="field-input field-cap"
            />
            <p style={{ fontSize: 12, color: "var(--t3)", marginTop: 6 }}>
              {bookedSeatCount > 0
                ? `${bookedSeatCount} already booked — cannot reduce below ${bookedSeatCount}.`
                : "Between 2 and 20 seats"}
            </p>
          </div>
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
          </div>
        </div>

        {/* Conversation Style */}
        <div>
          <label className="field-label">
            Conversation Style <span className="req">*</span>
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CONVERSATION_STYLES.map((style) => {
              const isSelected = conversationStyle === style.value;
              return (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setConversationStyle(style.value)}
                  className={`badge ${isSelected ? "" : "badge-slate"}`}
                  style={
                    isSelected
                      ? { background: "var(--p-tint)", color: "var(--p)", border: "1px solid var(--p)", cursor: "pointer" }
                      : { cursor: "pointer", border: "1px solid transparent" }
                  }
                >
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="description" className="field-label">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should guests expect at this dinner?"
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
                Choose from your restaurant&apos;s Media Library. Tap the star on a selected photo to make it the header
                photo — the one guests always see first when browsing Discover.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                {photoPool.map((photo) => {
                  const selectedIndex = selectedPhotoIds.indexOf(photo.id);
                  const isSelected = selectedIndex !== -1;
                  const isHeader = selectedIndex === 0;
                  return (
                    <div key={photo.id} style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => togglePhoto(photo.id)}
                        style={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          overflow: "hidden",
                          borderRadius: 10,
                          border: `2px solid ${isHeader ? "var(--p)" : isSelected ? "var(--bdr2)" : "transparent"}`,
                          padding: 0,
                          cursor: "pointer",
                          width: "100%",
                          display: "block",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.url} alt="" style={{ height: "100%", width: "100%", objectFit: "cover" }} />
                      </button>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            makeHeaderPhoto(photo.id);
                          }}
                          title={isHeader ? "Header photo" : "Make this the header photo"}
                          style={{
                            position: "absolute", top: 4, left: 4, display: "flex", alignItems: "center", justifyContent: "center",
                            height: 18, width: 18, borderRadius: "50%", border: 0, cursor: "pointer",
                            background: isHeader ? "var(--p)" : "rgba(255,255,255,.85)",
                            color: isHeader ? "#fff" : "var(--t3)", fontSize: 10,
                          }}
                        >
                          {isHeader ? "★" : "☆"}
                        </button>
                      )}
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhoto(photo.id);
                          }}
                          title="Remove"
                          style={{
                            position: "absolute", top: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "center",
                            height: 16, width: 16, borderRadius: "50%", border: 0, cursor: "pointer",
                            background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 9,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
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
            {loading ? (mode === "edit" ? "Saving..." : "Creating...") : mode === "edit" ? "Save Changes" : "Create Dinner"}
          </button>
        </div>
      </form>

      {/* Live Preview - exactly what a guest sees (§16.3 wireframe) */}
      <div style={{ position: "sticky", top: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
          Live Preview
        </div>
        <div style={{ borderRadius: 20, border: "1px solid var(--bdr)", background: "#FAF9F7", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0,0,0,.08)" }}>
          <div style={{ height: 130, position: "relative", overflow: "hidden" }}>
            {headerPhotoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={headerPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(150deg,#3d2b1f,#5c3d28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, opacity: 0.28 }}>
                🍽️
              </div>
            )}
            {selectedPhotoIds.length > 0 && (
              <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.45)", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 600 }}>
                1 / {selectedPhotoIds.length}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px 14px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{restaurantName}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>
              {[restaurantCuisine, restaurantCity].filter(Boolean).join(" · ") || " "}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF5F2", color: "#FF6B4A", fontSize: 9.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
                🧭 Directions
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FFF5F2", color: "#FF6B4A", fontSize: 9.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
                📞 Call Restaurant
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#6b7280", marginBottom: 4 }}>
              👥 {previewSpotsLeft} spots left · {previewSpotsTotal} total
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#6b7280", marginBottom: 4 }}>
              ✨ {selectedThemeData?.title ?? "Pick a theme"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#6b7280", marginBottom: 8 }}>
              🕖 {previewDateStr}{previewTimeStr ? ` · ${previewTimeStr}` : ""}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
              {previewPrice}{" "}
              <span style={{ fontSize: 10.5, fontWeight: 400, color: "#9ca3af" }}>per seat · + booking fee at checkout</span>
            </div>
            {selectedMealData && selectedMealData.dishes.length > 0 && (
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".05em" }}>
                    Tonight&apos;s Menu
                  </span>
                </div>
                {selectedMealData.dishes.map((dish) => (
                  <div key={dish.course} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#111827", padding: "4px 0" }}>
                    <span>{dish.name}</span>
                    <span style={{ color: "#9ca3af" }}>{COURSE_LABELS[dish.course]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "12px 14px", borderTop: "1px solid #f3f4f6", background: "#fff" }}>
            <button
              type="button"
              disabled
              style={{ width: "100%", background: "#FF6B4A", color: "#fff", border: "none", borderRadius: 14, padding: 10, fontSize: 12.5, fontWeight: 700 }}
            >
              Reserve Your Seat
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10 }}>
          Updates live as Theme / Meal / Date / Time / Seats / Price / Photos are filled in — exactly what a guest sees
          on Discover and the Dinner Detail page.
        </p>
      </div>
    </div>
  );
}
