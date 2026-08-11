"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { MenuItem } from "@prisma/client";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  type MenuItemInput,
} from "../actions";
import {
  COURSES,
  DIETARY_TAG_LABELS,
  DishFormSheet,
  emptyDishFormValues,
  type DishFormValues,
} from "./dish-form-sheet";
import { ConfirmModal } from "../../components/confirm-modal";

interface DishLibraryManagerProps {
  restaurantId: string;
  menuItems: MenuItem[];
  photoPool: Array<{ id: string; url: string }>;
  usageCounts: Record<string, number>;
}

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

export function DishLibraryManager({ restaurantId, menuItems, photoPool, usageCounts }: DishLibraryManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [sheet, setSheet] = useState<{ mode: "add" } | { mode: "edit"; item: MenuItem } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const parsePrice = (price: string): number | null => {
    const parsed = Math.round(parseFloat(price) * 100);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const toInput = (values: DishFormValues): MenuItemInput | null => {
    const priceCents = parsePrice(values.price);
    if (priceCents === null) {
      setFormError("Enter a valid price");
      return null;
    }
    return {
      course: values.course,
      name: values.name,
      description: values.description || null,
      ingredients: values.ingredients || null,
      priceCents,
      isAvailable: values.isAvailable,
      mediaAssetId: values.mediaAssetId,
      dietaryTags: values.dietaryTags,
    };
  };

  const handleCreate = async (values: DishFormValues) => {
    setFormError(null);
    const input = toInput(values);
    if (!input) return;

    setIsSaving(true);
    const result = await createMenuItem(restaurantId, input);
    setIsSaving(false);

    if (!result.success || !result.data) {
      setFormError(result.error || "Failed to create dish");
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: result.data!.menuItemId,
        restaurantId,
        course: input.course,
        name: input.name.trim(),
        description: input.description ?? null,
        ingredients: input.ingredients ?? null,
        priceCents: input.priceCents,
        position:
          prev.filter((i) => i.course === input.course).length > 0
            ? Math.max(...prev.filter((i) => i.course === input.course).map((i) => i.position)) + 1
            : 0,
        isAvailable: input.isAvailable,
        mediaAssetId: input.mediaAssetId ?? null,
        dietaryTags: input.dietaryTags,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    setSheet(null);
  };

  const handleUpdate = async (item: MenuItem, values: DishFormValues) => {
    setFormError(null);
    const input = toInput(values);
    if (!input) return;

    setIsSaving(true);
    const result = await updateMenuItem(item.id, input);
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error || "Failed to update dish");
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              course: input.course,
              name: input.name.trim(),
              description: input.description ?? null,
              ingredients: input.ingredients ?? null,
              priceCents: input.priceCents,
              isAvailable: input.isAvailable,
              mediaAssetId: input.mediaAssetId ?? null,
              dietaryTags: input.dietaryTags,
            }
          : i
      )
    );
    setSheet(null);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    setListError(null);
    setTogglingId(item.id);
    const result = await toggleMenuItemAvailability(item.id, !item.isAvailable);
    setTogglingId(null);

    if (!result.success) {
      setListError(result.error || "Failed to update availability");
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i)));
  };

  const handleDelete = async (item: MenuItem) => {
    setListError(null);
    setDeletingId(item.id);
    const result = await deleteMenuItem(item.id);
    setDeletingId(null);

    if (!result.success) {
      setListError(result.error || "Failed to delete dish");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setPendingDelete(null);
  };

  const photo = (item: MenuItem) => (item.mediaAssetId ? photoPool.find((p) => p.id === item.mediaAssetId) : undefined);

  return (
    <>
      {/* Desktop: breadcrumb line above the title row, matching the Meal
          Editor's own "← Meals / …" pattern. Mobile: Meals and Dish Library
          are peer destinations switched via the MobileSubTabs pill row
          (page.tsx) now, not a drill-down — so mobile gets the same plain
          title + "+" icon button treatment as Meals' own header, no
          back-chevron (that used to point back to Meals, which now reads
          as a lateral switch, not "back"). */}
      <div className="only-desktop" style={{ fontSize: 12, color: "var(--t3)", marginBottom: 14 }}>
        ←{" "}
        <Link href="/admin/meals" style={{ color: "var(--p)", fontWeight: 600, textDecoration: "none" }}>
          Meals
        </Link>{" "}
        / Dish Library
      </div>
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
        <h1 className="pg-title" style={{ flex: 1 }}>
          Dish Library
        </h1>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setSheet({ mode: "add" });
          }}
          className="m-icon-btn"
          aria-label="Add Dish"
        >
          +
        </button>
      </div>
      <div className="only-desktop-flex" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <h1 className="pg-title">Dish Library</h1>
          <p className="pg-sub">Your dish roster — photographed once, reused in every Meal</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setSheet({ mode: "add" });
          }}
          className="btn btn-primary"
          style={{ fontSize: 12, flexShrink: 0 }}
        >
          + Add Dish
        </button>
      </div>

      {listError && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{listError}</p>
        </div>
      )}

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {COURSES.map(({ key: course, label }) => {
          const courseItems = items
            .filter((item) => item.course === course)
            .sort((a, b) => a.position - b.position);

          return (
            <div key={course}>
              <div className="dish-library-group-label">{label}s</div>
              {courseItems.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--t3)" }}>No {label.toLowerCase()}s yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {courseItems.map((item) => {
                    const photoAsset = photo(item);
                    const usageCount = usageCounts[item.id] ?? 0;
                    return (
                      <div key={item.id} className="dish-library-row">
                        {photoAsset ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photoAsset.url} alt="" className="dish-library-thumb" />
                        ) : (
                          <div className="dish-library-thumb dish-library-thumb-empty" />
                        )}
                        <div className="dish-library-row-body">
                          <div className="dish-library-row-title">{item.name}</div>
                          {/* Desktop: description + dietary/usage badge row, price shown
                              trailing in dish-library-row-actions. Mobile: wireframe
                              collapses name + price + usage into one subtitle line
                              instead ("R 95" / "R 185 · used in 2 Meals"), so description
                              and the tag row are desktop-only. */}
                          <div className="only-desktop">
                            {item.description && <div className="dish-library-row-desc">{item.description}</div>}
                            {(item.dietaryTags.length > 0 || usageCount > 0) && (
                              <div className="dish-library-row-tags">
                                {item.dietaryTags.map((tag) => (
                                  <span key={tag} className="badge badge-slate">
                                    {DIETARY_TAG_LABELS[tag]}
                                  </span>
                                ))}
                                {usageCount > 0 && (
                                  <span className="badge badge-slate">
                                    Used in {usageCount} {usageCount === 1 ? "Meal" : "Meals"}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="only-mobile dish-library-row-subtitle-mobile">
                            {formatPrice(item.priceCents)}
                            {usageCount > 0 ? ` · used in ${usageCount} ${usageCount === 1 ? "Meal" : "Meals"}` : ""}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item)}
                            disabled={togglingId === item.id}
                            className={`badge ${item.isAvailable ? "badge-green" : "badge-slate"}`}
                            style={{ marginTop: 6, border: "none", cursor: "pointer" }}
                          >
                            {togglingId === item.id ? "…" : item.isAvailable ? "Available" : "86'd — tap to restore"}
                          </button>
                        </div>
                        <div className="dish-library-row-actions">
                          <span className="dish-library-row-price only-desktop-flex">{formatPrice(item.priceCents)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setSheet({ mode: "edit", item });
                            }}
                            className="m-icon-btn"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {/* Delete is desktop-only per the wireframe's mobile frame
                              (mobile row gets a single edit-only icon button) — the
                              action itself is untouched, still reachable from desktop. */}
                          <button
                            type="button"
                            onClick={() => setPendingDelete(item)}
                            disabled={deletingId === item.id}
                            className="m-icon-btn only-desktop-flex"
                            style={{ color: "var(--red-txt)" }}
                            aria-label={`Delete ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DishFormSheet
        key={sheet?.mode === "edit" ? sheet.item.id : "add"}
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.mode === "edit" ? "Edit Dish" : "Add Dish"}
        restaurantId={restaurantId}
        photoPool={photoPool}
        initialValues={
          sheet?.mode === "edit"
            ? {
                course: sheet.item.course,
                name: sheet.item.name,
                description: sheet.item.description ?? "",
                ingredients: sheet.item.ingredients ?? "",
                price: (sheet.item.priceCents / 100).toFixed(2),
                isAvailable: sheet.item.isAvailable,
                mediaAssetId: sheet.item.mediaAssetId,
                dietaryTags: sheet.item.dietaryTags,
              }
            : emptyDishFormValues
        }
        onSubmit={(values) => (sheet?.mode === "edit" ? handleUpdate(sheet.item, values) : handleCreate(values))}
        isSaving={isSaving}
        error={formError}
      />

      {pendingDelete && (
        <ConfirmModal
          open
          onClose={() => setPendingDelete(null)}
          onConfirm={() => handleDelete(pendingDelete)}
          tone="red"
          title={`Remove "${pendingDelete.name}"?`}
          description={
            (usageCounts[pendingDelete.id] ?? 0) > 0
              ? `Used in ${usageCounts[pendingDelete.id]} ${usageCounts[pendingDelete.id] === 1 ? "Meal" : "Meals"} — those Meals simply lose this option, they aren't deleted. Removing it from the Dish Library only, not from any dinner that's already happened.`
              : "Removing it from the Dish Library only, not from any dinner that's already happened."
          }
          confirmLabel="Remove"
        />
      )}
    </>
  );
}
