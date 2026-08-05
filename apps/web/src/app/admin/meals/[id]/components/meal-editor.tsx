"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import type { MenuItem } from "@prisma/client";
import type { MealWithCourses } from "@dinewithme/db";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { updateMeal, deleteMeal, addCourseOption, removeCourseOption } from "../../actions";

const COURSE_LABELS: Record<string, string> = {
  STARTER: "Starter",
  MAIN: "Main",
  DESSERT: "Dessert",
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatPercent(value: number | null | undefined): string {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

interface PhotoPoolEntry {
  id: string;
  url: string;
}

interface MealEditorProps {
  meal: MealWithCourses;
  dishLibrary: MenuItem[];
  photoPool: PhotoPoolEntry[];
}

function DishThumb({
  mediaAssetId,
  photoPool,
  size,
}: {
  mediaAssetId: string | null;
  photoPool: PhotoPoolEntry[];
  size: number;
}) {
  const url = mediaAssetId ? photoPool.find((p) => p.id === mediaAssetId)?.url : null;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: "var(--bg2)",
        border: "1px solid var(--bdr)",
        flexShrink: 0,
      }}
    />
  );
}

export function MealEditor({ meal, dishLibrary, photoPool }: MealEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(meal.name);
  const [price, setPrice] = useState(formatPrice(meal.suggestedPricePerSeatCents));
  const [isActive, setIsActive] = useState(meal.isActive);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerCourseId, setPickerCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyOptionId, setBusyOptionId] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const priceCents = Math.round(parseFloat(price) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Enter a valid price");
      return;
    }

    setSaving(true);
    const result = await updateMeal(meal.id, { name, suggestedPricePerSeatCents: priceCents, isActive });
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save meal");
      return;
    }
    router.refresh();
  };

  const handleCancel = () => {
    setName(meal.name);
    setPrice(formatPrice(meal.suggestedPricePerSeatCents));
    setIsActive(meal.isActive);
    setError(null);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${meal.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const result = await deleteMeal(meal.id);
    setDeleting(false);

    if (!result.success) {
      setError(result.error || "Failed to delete meal");
      return;
    }
    router.push("/admin/meals");
  };

  const handleAddOption = async (mealCourseId: string, menuItemId: string) => {
    setBusyOptionId(menuItemId);
    const result = await addCourseOption(meal.id, mealCourseId, menuItemId);
    setBusyOptionId(null);

    if (!result.success) {
      setError(result.error || "Failed to add dish option");
      return;
    }
    setPickerCourseId(null);
    router.refresh();
  };

  const handleRemoveOption = async (optionId: string) => {
    setBusyOptionId(optionId);
    const result = await removeCourseOption(meal.id, optionId);
    setBusyOptionId(null);

    if (!result.success) {
      setError(result.error || "Failed to remove dish option");
      return;
    }
    router.refresh();
  };

  const usedElsewhereInMeal = useMemo(
    () => new Set(meal.courses.flatMap((c) => c.options.map((o) => o.menuItemId))),
    [meal.courses]
  );

  const pickerCourse = meal.courses.find((c) => c.id === pickerCourseId);
  const alreadyInPickerCourse = useMemo(
    () => new Set(pickerCourse?.options.map((o) => o.menuItemId) ?? []),
    [pickerCourse]
  );
  const pickerChoices = pickerCourse
    ? dishLibrary
        .filter((dish) => dish.course === pickerCourse.courseType && !alreadyInPickerCourse.has(dish.id))
        .filter((dish) => dish.name.toLowerCase().includes(search.trim().toLowerCase()))
    : [];

  const fillRate = meal.performance?.avgFillRate ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      <div>
        <div style={{ fontSize: 12, color: "var(--t3)", marginBottom: 14 }}>
          <Link href="/admin/meals" style={{ color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
            Meals
          </Link>{" "}
          / {meal.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="field-input"
              style={{ fontSize: 16, fontWeight: 700, maxWidth: 280 }}
            />
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              disabled={saving}
              className={`badge ${isActive ? "badge-green" : "badge-slate"}`}
              style={{ border: 0, cursor: "pointer" }}
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={handleCancel} disabled={saving} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="section-block-title" style={{ marginBottom: 10, opacity: 0.6 }}>
          Performance (read-only)
        </div>
        {meal.performance ? (
          <div className="stat-grid-4">
            <div className="stat-card">
              <div className="stat-label">Dinners Served</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {meal.performance.totalDinners}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Fill Rate</div>
              <div
                className="stat-value"
                style={{ fontSize: 18, color: fillRate != null && fillRate >= 0.7 ? "var(--green-txt)" : undefined }}
              >
                {formatPercent(fillRate)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Feedback</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {meal.performance.avgFeedbackScore != null ? `${meal.performance.avgFeedbackScore.toFixed(1)} ★` : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Would Return</div>
              <div className="stat-value" style={{ fontSize: 18 }}>
                {formatPercent(meal.performance.avgWouldReturnRate)}
              </div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--t3)" }}>
            No completed dinners for this Meal yet - stats appear once one wraps up.
          </p>
        )}
      </div>

      <div>
        <div className="section-block-title" style={{ marginBottom: 10 }}>
          Suggested Price per Seat
        </div>
        <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={saving}
            className="field-input"
            style={{ maxWidth: 140 }}
          />
          <p style={{ fontSize: 11.5, color: "var(--t3)", margin: 0, flex: 1, minWidth: 200 }}>
            Pre-fills Create Dinner&apos;s price field — the restaurant confirms or overrides the actual charge per
            dinner there. This is a starting suggestion, not a binding price.
          </p>
        </div>
      </div>

      <div>
        <div className="section-block-title" style={{ marginBottom: 10 }}>
          Courses
        </div>
        <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {meal.courses.map((course) => (
            <div key={course.id}>
              <div className="meal-editor-course-label">
                {COURSE_LABELS[course.courseType] || course.courseType} (up to 3 options)
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                {course.options.map((option) => (
                  <div key={option.id} className="meal-editor-dish-chip">
                    <DishThumb mediaAssetId={option.menuItem.mediaAssetId} photoPool={photoPool} size={48} />
                    <div className="meal-editor-dish-chip-body">
                      <div className="meal-editor-dish-chip-name">{option.menuItem.name}</div>
                      <div className="meal-editor-dish-chip-caption">from Dish Library</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(option.id)}
                      disabled={busyOptionId === option.id}
                      aria-label={`Remove ${option.menuItem.name}`}
                      className="m-icon-btn"
                      style={{ width: 22, height: 22, color: "var(--red-txt)", marginLeft: 4 }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {course.options.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickerCourseId(course.id);
                      setSearch("");
                    }}
                    className="btn btn-sm btn-outline"
                  >
                    + Add Option ({course.options.length} of 3 used)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--red-txt)",
            background: "none",
            border: 0,
            cursor: "pointer",
            padding: 0,
          }}
        >
          {deleting ? "Deleting…" : "Delete Meal"}
        </button>
      </div>

      <FilterSheet
        open={pickerCourseId !== null}
        onClose={() => setPickerCourseId(null)}
        title={`Choose a ${pickerCourse ? COURSE_LABELS[pickerCourse.courseType] : ""}`}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your Dish Library…"
          className="field-input"
          style={{ marginBottom: 12 }}
        />
        {pickerChoices.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ marginBottom: 12, fontSize: 13, color: "var(--t3)" }}>
              No available dishes in this course yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
            {pickerChoices.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => pickerCourseId && handleAddOption(pickerCourseId, dish.id)}
                disabled={busyOptionId === dish.id}
                className="meal-editor-picker-row"
              >
                <DishThumb mediaAssetId={dish.mediaAssetId} photoPool={photoPool} size={40} />
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
                    {dish.name}
                    {usedElsewhereInMeal.has(dish.id) && (
                      <span style={{ color: "var(--p)", fontWeight: 700, marginLeft: 8, fontSize: 11.5 }}>
                        ✓ already used above
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--p)", flexShrink: 0 }}>
                  {busyOptionId === dish.id ? "Adding…" : "Add"}
                </span>
              </button>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10, textAlign: "center" }}>
          Dish missing?{" "}
          <Link href="/admin/dish-library" style={{ color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
            Add it to your Dish Library first →
          </Link>
        </p>
      </FilterSheet>
    </div>
  );
}
