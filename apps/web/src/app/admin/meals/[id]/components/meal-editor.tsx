"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, Plus, X } from "lucide-react";
import type { MenuItem } from "@prisma/client";
import type { MealWithCourses } from "@dinewithme/db";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { updateMeal, deleteMeal, addCourseOption, removeCourseOption } from "../../actions";
import { ConfirmModal } from "../../../components/confirm-modal";
import { DishFormSheet, emptyDishFormValues, type DishFormValues } from "../../../dish-library/components/dish-form-sheet";
import { createMenuItem, type MenuItemInput } from "../../../dish-library/actions";
import { useToast } from "@/components/ui/toast";

const COURSE_LABELS: Record<string, string> = {
  STARTER: "Starter",
  MAIN: "Main",
  DESSERT: "Dessert",
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2);
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
  className,
}: {
  mediaAssetId: string | null;
  photoPool: PhotoPoolEntry[];
  className: string;
}) {
  const url = mediaAssetId ? photoPool.find((p) => p.id === mediaAssetId)?.url : null;
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={className} />;
  }
  return <div className={`${className} meal-editor-dish-thumb-empty`} />;
}

export function MealEditor({ meal, dishLibrary, photoPool }: MealEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(meal.name);
  const [price, setPrice] = useState(formatPrice(meal.suggestedPricePerSeatCents));
  const [isActive, setIsActive] = useState(meal.isActive);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerCourseId, setPickerCourseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyOptionId, setBusyOptionId] = useState<string | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [addDishError, setAddDishError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [unsavedNavTarget, setUnsavedNavTarget] = useState<string | null>(null);

  const isDirty =
    name !== meal.name || price !== formatPrice(meal.suggestedPricePerSeatCents) || isActive !== meal.isActive;

  // Guards actual tab close/reload. Guarding in-app navigation (the
  // back-chevron/breadcrumb below, which is the common case) is handled
  // separately since Next.js Link clicks don't fire beforeunload — the
  // sidebar/bottom-nav links rendered by AdminShell are outside this
  // component's reach and aren't guarded.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const closePicker = () => {
    setPickerCourseId(null);
    setSelectedDishId(null);
  };

  const handleBackNav = (href: string) => (e: React.MouseEvent) => {
    if (isDirty) {
      e.preventDefault();
      setUnsavedNavTarget(href);
    }
  };

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
      const message = result.error || "Failed to save meal";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Saved");
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteMeal(meal.id);
    setDeleting(false);

    if (!result.success) {
      const message = result.error || "Failed to delete meal";
      setError(message);
      toast.error(message);
      setDeleteConfirmOpen(false);
      return;
    }
    toast.success("Meal deleted");
    router.push("/admin/meals");
  };

  const handleAddOption = async (mealCourseId: string, menuItemId: string) => {
    setBusyOptionId(menuItemId);
    const result = await addCourseOption(meal.id, mealCourseId, menuItemId);
    setBusyOptionId(null);

    if (!result.success) {
      const message = result.error || "Failed to add dish option";
      setError(message);
      toast.error(message);
      return;
    }
    closePicker();
    toast.success("Dish added");
    router.refresh();
  };

  const handleCreateDish = async (values: DishFormValues) => {
    setAddDishError(null);
    const priceCents = Math.round(parseFloat(values.price) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setAddDishError("Enter a valid price");
      return;
    }
    if (!pickerCourseId) return;

    const input: MenuItemInput = {
      course: values.course,
      name: values.name,
      description: values.description || null,
      ingredients: values.ingredients || null,
      priceCents,
      isAvailable: values.isAvailable,
      mediaAssetId: values.mediaAssetId,
      dietaryTags: values.dietaryTags,
    };

    setIsSavingDish(true);
    const result = await createMenuItem(meal.restaurantId, input);
    setIsSavingDish(false);

    if (!result.success || !result.data) {
      const message = result.error || "Failed to create dish";
      setAddDishError(message);
      toast.error(message);
      return;
    }

    setAddDishOpen(false);
    // Adds the new dish straight to the course it was created for, so the
    // in-progress Meal picker never loses state to the round trip.
    await handleAddOption(pickerCourseId, result.data.menuItemId);
  };

  const handleRemoveOption = async (optionId: string) => {
    setBusyOptionId(optionId);
    const result = await removeCourseOption(meal.id, optionId);
    setBusyOptionId(null);

    if (!result.success) {
      const message = result.error || "Failed to remove dish option";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Dish removed");
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {error && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      <div>
        <div className="only-desktop-flex" style={{ alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Link
            href="/admin/meals"
            onClick={handleBackNav("/admin/meals")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--p)",
              textDecoration: "none",
              padding: "5px 12px 5px 8px",
              border: "1px solid var(--bdr)",
              borderRadius: 20,
            }}
          >
            <ArrowLeft style={{ width: 12, height: 12 }} /> Meals
          </Link>
          <span style={{ fontSize: 12, color: "var(--t3)" }}>/ {meal.name}</span>
        </div>
        <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Link
            href="/admin/meals"
            onClick={handleBackNav("/admin/meals")}
            className="m-icon-btn"
            aria-label="Back to Meals"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>
            Edit Meal
          </h1>
          <div style={{ width: 44 }} />
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
          {/* Desktop: Save only, no Cancel — the wireframe's rule is a
              full-page edit form reached via its own back-chevron doesn't
              need a redundant Cancel next to Save. The old Cancel button
              here did an in-place field reset (not just "leave the page"),
              but the new unsaved-changes guard on the back-chevron now
              covers that same "don't lose my edits by accident" concern
              more completely (it also catches navigating away, which
              in-place reset never did). */}
          <div className="only-desktop-flex" style={{ alignItems: "center", gap: 10 }}>
            <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
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
                    <DishThumb
                      mediaAssetId={option.menuItem.mediaAssetId}
                      photoPool={photoPool}
                      className="meal-editor-dish-chip-thumb"
                    />
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
                    className={`meal-add-option ${course.options.length === 0 ? "meal-add-option-empty" : ""}`}
                    title={`${course.options.length} of 3 used`}
                  >
                    <Plus style={{ width: 15, height: 15 }} />
                    <span>{course.options.length === 0 ? "Add from Dish Library" : "Add"}</span>
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
          onClick={() => setDeleteConfirmOpen(true)}
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

      <div className="m-action-bar">
        <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary btn-block">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <FilterSheet
        open={pickerCourseId !== null}
        onClose={closePicker}
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
            {pickerChoices.map((dish) => {
              const alreadyUsed = usedElsewhereInMeal.has(dish.id);
              const highlighted = alreadyUsed || selectedDishId === dish.id;
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => setSelectedDishId(dish.id)}
                  className="meal-editor-picker-row"
                  style={
                    highlighted
                      ? { borderColor: "var(--p)", background: "var(--p-tint)" }
                      : undefined
                  }
                >
                  <DishThumb
                    mediaAssetId={dish.mediaAssetId}
                    photoPool={photoPool}
                    className="meal-editor-picker-thumb"
                  />
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
                      {dish.name}
                      {alreadyUsed && (
                        <span style={{ color: "var(--p)", fontWeight: 700, marginLeft: 8, fontSize: 11.5 }}>
                          ✓ already used above
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 10, textAlign: "center" }}>
          Dish missing?{" "}
          <button
            type="button"
            onClick={() => {
              setAddDishError(null);
              setAddDishOpen(true);
            }}
            style={{ color: "var(--p)", fontWeight: 600, background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}
          >
            + Add a new dish
          </button>
        </p>
        <button
          type="button"
          onClick={() => pickerCourseId && selectedDishId && handleAddOption(pickerCourseId, selectedDishId)}
          disabled={!selectedDishId || busyOptionId === selectedDishId}
          className="btn btn-primary btn-block"
          style={{ marginTop: 14 }}
        >
          {busyOptionId === selectedDishId ? "Adding…" : "Add to Meal"}
        </button>
      </FilterSheet>

      {/* Nested on top of the picker above — creating a dish here never
          navigates away from Meal Editor, so in-progress course selections
          survive the round trip. Saving returns to the picker with the new
          dish pre-selected via handleCreateDish -> handleAddOption. */}
      {pickerCourseId && (
        <DishFormSheet
          key={pickerCourseId}
          open={addDishOpen}
          onClose={() => setAddDishOpen(false)}
          title="Add New Dish"
          restaurantId={meal.restaurantId}
          photoPool={photoPool}
          initialValues={{ ...emptyDishFormValues, course: pickerCourse?.courseType ?? emptyDishFormValues.course }}
          onSubmit={handleCreateDish}
          isSaving={isSavingDish}
          error={addDishError}
        />
      )}

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        tone="red"
        title={`Delete "${meal.name}"?`}
        description={
          meal.performance && meal.performance.totalDinners > 0
            ? `This Meal is used in ${meal.performance.totalDinners} past ${meal.performance.totalDinners === 1 ? "dinner" : "dinners"} — those records are unaffected. It won't be selectable for any new Create Dinner going forward. This cannot be undone.`
            : "It won't be selectable for any new Create Dinner going forward. This cannot be undone."
        }
        confirmLabel="Delete"
      />

      <ConfirmModal
        open={unsavedNavTarget !== null}
        onClose={() => setUnsavedNavTarget(null)}
        onConfirm={() => {
          const target = unsavedNavTarget;
          setUnsavedNavTarget(null);
          if (target) router.push(target);
        }}
        tone="yellow"
        title="Discard unsaved changes?"
        description="You've made changes that haven't been saved yet. Leaving now discards them."
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
      />
    </div>
  );
}
