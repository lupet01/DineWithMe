"use client";

import { useRef, useState } from "react";
import { MenuCourse, DietaryTag } from "@prisma/client";
import { FilterSheet } from "@/components/ui/filter-sheet";
import { useToast } from "@/components/ui/toast";
import { requestDishPhotoUploadUrl, saveDishPhoto } from "../actions";

export const COURSES: { key: MenuCourse; label: string }[] = [
  { key: MenuCourse.STARTER, label: "Starter" },
  { key: MenuCourse.MAIN, label: "Main" },
  { key: MenuCourse.DESSERT, label: "Dessert" },
];

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  VEGETARIAN: "Vegetarian",
  VEGAN: "Vegan",
  PESCATARIAN: "Pescatarian",
  GLUTEN_FREE: "Gluten-Free",
  DAIRY_FREE: "Dairy-Free",
  NUT_FREE: "Nut-Free",
  HALAL: "Halal",
  KOSHER: "Kosher",
  CONTAINS_SHELLFISH: "Contains Shellfish",
  SPICY: "Spicy",
};

export interface DishFormValues {
  course: MenuCourse;
  name: string;
  description: string;
  ingredients: string;
  price: string;
  isAvailable: boolean;
  mediaAssetId: string | null;
  dietaryTags: DietaryTag[];
}

export const emptyDishFormValues: DishFormValues = {
  course: MenuCourse.STARTER,
  name: "",
  description: "",
  ingredients: "",
  price: "",
  isAvailable: true,
  mediaAssetId: null,
  dietaryTags: [],
};

function PhotoPicker({
  restaurantId,
  photoPool,
  selectedId,
  onSelect,
  disabled,
}: {
  restaurantId: string;
  photoPool: Array<{ id: string; url: string }>;
  selectedId: string | null;
  onSelect: (mediaAssetId: string | null, url: string | null) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pool, setPool] = useState(photoPool);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const selected = pool.find((p) => p.id === selectedId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const signResult = await requestDishPhotoUploadUrl(restaurantId, file.name, file.type);
      if (!signResult.success || !signResult.data) {
        throw new Error(signResult.error || "Failed to get upload URL");
      }

      const uploadResponse = await fetch(signResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      const saveResult = await saveDishPhoto(restaurantId, signResult.data.key, signResult.data.publicUrl);
      if (!saveResult.success || !saveResult.data) {
        throw new Error(saveResult.error || "Failed to save photo");
      }

      const newAsset = { id: saveResult.data.mediaAssetId, url: signResult.data.publicUrl };
      setPool((prev) => [newAsset, ...prev]);
      onSelect(newAsset.id, newAsset.url);
      setOpen(false);
    } catch (error) {
      // Surface the failure instead of silently no-oping — the user would
      // otherwise see nothing after a failed upload. The picker stays open for
      // retry.
      console.error("[DishPhoto] Upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Couldn't upload photo. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="field-label">Photo</label>
      {selected ? (
        <div className="dish-form-photo-selected">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.url} alt="" className="dish-form-photo-thumb" />
          <div className="dish-form-photo-actions">
            <button type="button" onClick={() => setOpen((o) => !o)} disabled={disabled} className="dish-form-photo-link">
              Change
            </button>
            <button
              type="button"
              onClick={() => onSelect(null, null)}
              disabled={disabled}
              className="dish-form-photo-link dish-form-photo-link-remove"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="dish-form-photo-drop" onClick={() => setOpen((o) => !o)} disabled={disabled}>
          {uploading ? "Uploading…" : "Choose from Media Library, or upload new"}
        </button>
      )}

      {open && (
        <div className="dish-form-photo-pool">
          {pool.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--t3)" }}>No photos in your library yet.</p>
          ) : (
            <div className="dish-form-photo-grid">
              {pool.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    onSelect(photo.id, photo.url);
                    setOpen(false);
                  }}
                  className={`dish-form-photo-cell ${photo.id === selectedId ? "selected" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="dish-form-photo-link"
            style={{ marginTop: 8 }}
          >
            {uploading ? "Uploading…" : "+ Upload New Photo"}
          </button>
        </div>
      )}
    </div>
  );
}

export function DishFormSheet({
  open,
  onClose,
  title,
  restaurantId,
  photoPool,
  initialValues,
  onSubmit,
  isSaving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  restaurantId: string;
  photoPool: Array<{ id: string; url: string }>;
  initialValues: DishFormValues;
  onSubmit: (values: DishFormValues) => void;
  isSaving: boolean;
  error: string | null;
}) {
  // The parent remounts this component (via a `key` keyed on the editing dish's id)
  // whenever initialValues should change, so a plain useState is enough here.
  const [values, setValues] = useState<DishFormValues>(initialValues);

  const toggleTag = (tag: DietaryTag) => {
    setValues((v) => ({
      ...v,
      dietaryTags: v.dietaryTags.includes(tag)
        ? v.dietaryTags.filter((t) => t !== tag)
        : [...v.dietaryTags, tag],
    }));
  };

  return (
    <FilterSheet open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(values);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <label className="field-label">
            Dish Name <span className="req">*</span>
          </label>
          <input
            required
            autoFocus
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="e.g. Wild Mushroom Risotto"
            disabled={isSaving}
            className="field-input"
          />
        </div>

        <div className="field-grid-2">
          <div>
            <label className="field-label">Course Type</label>
            {/* Pill tabs replace the old <select>, matching the wireframe's
                sec-dish-editor Course Type control. */}
            <div className="tabs">
              {COURSES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setValues((v) => ({ ...v, course: c.key }))}
                  disabled={isSaving}
                  className={`tab ${values.course === c.key ? "active" : ""}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label">
              Reference Price <span className="req">*</span>
            </label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
              placeholder="R 165"
              disabled={isSaving}
              className="field-input"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Description</label>
          <textarea
            rows={3}
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            placeholder="Describe the dish, preparation, what makes it yours…"
            disabled={isSaving}
            className="field-input ta"
          />
        </div>

        <div>
          <label className="field-label">
            Ingredients{" "}
            <span style={{ color: "var(--t3)", fontWeight: 400 }}>
              (optional — what a guest sees on the Menu screen)
            </span>
          </label>
          <textarea
            rows={2}
            value={values.ingredients}
            onChange={(e) => setValues((v) => ({ ...v, ingredients: e.target.value }))}
            placeholder="Optional — comma-separated, e.g. porcini, taleggio, crispy sage"
            disabled={isSaving}
            className="field-input ta"
          />
        </div>

        <div>
          <label className="field-label">Dietary Tags</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.values(DietaryTag).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                disabled={isSaving}
                className={`badge ${values.dietaryTags.includes(tag) ? "badge-tint" : "badge-slate"}`}
              >
                {DIETARY_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <PhotoPicker
            restaurantId={restaurantId}
            photoPool={photoPool}
            selectedId={values.mediaAssetId}
            onSelect={(mediaAssetId) => setValues((v) => ({ ...v, mediaAssetId }))}
            disabled={isSaving}
          />
          <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 6 }}>
            Photos are shared with Media Library — managed there, referenced here.
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--t2)" }}>
          <input
            type="checkbox"
            checked={values.isAvailable}
            onChange={(e) => setValues((v) => ({ ...v, isAvailable: e.target.checked }))}
            disabled={isSaving}
          />
          Available
        </label>

        {error && <p style={{ fontSize: 12, color: "var(--red-txt)" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button type="button" onClick={onClose} disabled={isSaving} className="btn btn-outline" style={{ flex: 1 }}>
            Cancel
          </button>
          <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ flex: 1 }}>
            {isSaving ? "Saving…" : "Save Dish"}
          </button>
        </div>
      </form>
    </FilterSheet>
  );
}
