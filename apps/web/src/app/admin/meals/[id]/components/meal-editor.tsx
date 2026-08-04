"use client";

import { useState } from "react";
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

interface MealEditorProps {
  meal: MealWithCourses;
  dishLibrary: MenuItem[];
}

export function MealEditor({ meal, dishLibrary }: MealEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(meal.name);
  const [price, setPrice] = useState(formatPrice(meal.suggestedPricePerSeatCents));
  const [isActive, setIsActive] = useState(meal.isActive);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerCourseId, setPickerCourseId] = useState<string | null>(null);
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

  const pickerCourse = meal.courses.find((c) => c.id === pickerCourseId);
  const pickerChoices = pickerCourse
    ? dishLibrary.filter(
        (dish) =>
          dish.course === pickerCourse.courseType &&
          !pickerCourse.options.some((o) => o.menuItemId === dish.id)
      )
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label className="field-label">Meal Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="field-input"
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label className="field-label">Suggested Price / Seat (ZAR)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={saving}
              className="field-input"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 9 }}>
            <span style={{ fontSize: 13, color: "var(--t2)" }}>Active</span>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              disabled={saving}
              className={`toggle ${isActive ? "on" : "off"}`}
              role="switch"
              aria-checked={isActive}
              aria-label="Active"
            >
              <span className="toggle-dot" />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, paddingTop: 2 }}>
          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={handleDelete} disabled={deleting} className="btn btn-red btn-sm">
            {deleting ? "Deleting…" : "Delete Meal"}
          </button>
        </div>
      </div>

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="card-title">Performance</div>
        {meal.performance ? (
          <div className="stat-grid-4">
            <div className="stat-card">
              <div className="stat-label">Dinners Completed</div>
              <div className="stat-value">{meal.performance.totalDinners}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Seats Booked</div>
              <div className="stat-value">{meal.performance.totalSeatsBooked}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Fill Rate</div>
              <div className="stat-value">{formatPercent(meal.performance.avgFillRate)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Attendance</div>
              <div className="stat-value">{formatPercent(meal.performance.avgAttendanceRate)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Rating</div>
              <div className="stat-value">
                {meal.performance.avgFeedbackScore != null ? `${meal.performance.avgFeedbackScore.toFixed(1)}/5` : "—"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Would Return</div>
              <div className="stat-value">{formatPercent(meal.performance.avgWouldReturnRate)}</div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: "var(--t3)" }}>
            No completed dinners for this Meal yet - stats appear once one wraps up.
          </p>
        )}
      </div>

      {meal.courses.map((course) => (
        <div key={course.id} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="card-title">{COURSE_LABELS[course.courseType] || course.courseType}</div>
            {course.options.length < 3 && (
              <button
                type="button"
                onClick={() => setPickerCourseId(course.id)}
                style={{ fontSize: 12, fontWeight: 600, color: "var(--p)", background: "none", border: 0, cursor: "pointer" }}
              >
                + Add Option
              </button>
            )}
          </div>

          {course.options.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--t3)" }}>No dishes assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {course.options.map((option) => (
                <div key={option.id} className="live-guest-row">
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{option.menuItem.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--t3)" }}>R{formatPrice(option.menuItem.priceCents)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(option.id)}
                    disabled={busyOptionId === option.id}
                    aria-label={`Remove ${option.menuItem.name}`}
                    className="m-icon-btn"
                    style={{ color: "var(--red-txt)" }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <FilterSheet
        open={pickerCourseId !== null}
        onClose={() => setPickerCourseId(null)}
        title={`Add ${pickerCourse ? COURSE_LABELS[pickerCourse.courseType] : ""} Option`}
      >
        {pickerChoices.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <p style={{ marginBottom: 12, fontSize: 13, color: "var(--t3)" }}>
              No available dishes in this course yet.
            </p>
            <Link href="/admin/dish-library" style={{ fontSize: 13, fontWeight: 600, color: "var(--p)" }}>
              Add it to your Dish Library first →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pickerChoices.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => pickerCourseId && handleAddOption(pickerCourseId, dish.id)}
                disabled={busyOptionId === dish.id}
                className="live-guest-row"
                style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{dish.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--t3)" }}>R{formatPrice(dish.priceCents)}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--p)" }}>
                  {busyOptionId === dish.id ? "Adding…" : "Add"}
                </span>
              </button>
            ))}
          </div>
        )}
      </FilterSheet>
    </div>
  );
}
