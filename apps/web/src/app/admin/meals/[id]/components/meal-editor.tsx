"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import type { MenuItem } from "@prisma/client";
import type { MealWithCourses } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
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

function PerformanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
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
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card padding="lg" className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">Meal Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
          />
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Suggested Price / Seat (ZAR)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            Active
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete Meal"}
          </button>
        </div>
      </Card>

      <Card padding="lg" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
        {meal.performance ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PerformanceStat label="Dinners Completed" value={String(meal.performance.totalDinners)} />
            <PerformanceStat label="Seats Booked" value={String(meal.performance.totalSeatsBooked)} />
            <PerformanceStat label="Avg Fill Rate" value={formatPercent(meal.performance.avgFillRate)} />
            <PerformanceStat label="Avg Attendance" value={formatPercent(meal.performance.avgAttendanceRate)} />
            <PerformanceStat
              label="Avg Rating"
              value={meal.performance.avgFeedbackScore != null ? `${meal.performance.avgFeedbackScore.toFixed(1)}/5` : "—"}
            />
            <PerformanceStat label="Would Return" value={formatPercent(meal.performance.avgWouldReturnRate)} />
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No completed dinners for this Meal yet - stats appear once one wraps up.
          </p>
        )}
      </Card>

      {meal.courses.map((course) => (
        <Card key={course.id} padding="lg" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {COURSE_LABELS[course.courseType] || course.courseType}
            </h3>
            {course.options.length < 3 && (
              <button
                type="button"
                onClick={() => setPickerCourseId(course.id)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                + Add Option
              </button>
            )}
          </div>

          {course.options.length === 0 ? (
            <p className="text-xs text-gray-400">No dishes assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {course.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3 shadow-card"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{option.menuItem.name}</p>
                    <p className="text-xs text-gray-500">R{formatPrice(option.menuItem.priceCents)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(option.id)}
                    disabled={busyOptionId === option.id}
                    aria-label={`Remove ${option.menuItem.name}`}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      <FilterSheet
        open={pickerCourseId !== null}
        onClose={() => setPickerCourseId(null)}
        title={`Add ${pickerCourse ? COURSE_LABELS[pickerCourse.courseType] : ""} Option`}
      >
        {pickerChoices.length === 0 ? (
          <div className="py-6 text-center">
            <p className="mb-3 text-sm text-gray-500">
              No available dishes in this course yet.
            </p>
            <Link
              href="/admin/dish-library"
              className="text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              Add it to your Dish Library first →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {pickerChoices.map((dish) => (
              <button
                key={dish.id}
                type="button"
                onClick={() => pickerCourseId && handleAddOption(pickerCourseId, dish.id)}
                disabled={busyOptionId === dish.id}
                className="flex w-full items-center justify-between rounded-lg border border-gray-100 p-3 text-left transition-colors hover:bg-cream-100 disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{dish.name}</p>
                  <p className="text-xs text-gray-500">R{formatPrice(dish.priceCents)}</p>
                </div>
                <span className="text-xs font-semibold text-primary-600">
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
