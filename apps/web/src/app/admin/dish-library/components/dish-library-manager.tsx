"use client";

import { useRef, useState } from "react";
import type { MenuItem } from "@prisma/client";
import { MenuCourse, DietaryTag } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  requestDishPhotoUploadUrl,
  saveDishPhoto,
  type MenuItemInput,
} from "../actions";

interface DishLibraryManagerProps {
  restaurantId: string;
  menuItems: MenuItem[];
  photoPool: Array<{ id: string; url: string }>;
}

const COURSES: { key: MenuCourse; label: string }[] = [
  { key: MenuCourse.STARTER, label: "Starters" },
  { key: MenuCourse.MAIN, label: "Mains" },
  { key: MenuCourse.DESSERT, label: "Desserts" },
];

const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
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

function formatPrice(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

interface DishFormValues {
  name: string;
  description: string;
  ingredients: string;
  price: string;
  isAvailable: boolean;
  mediaAssetId: string | null;
  dietaryTags: DietaryTag[];
}

const emptyFormValues: DishFormValues = {
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
    } catch {
      // Silently no-op on failure - the picker just stays open for retry
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-700">Photo</label>
      <div className="flex items-center gap-3">
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-gray-300 text-xs text-gray-400">
            None
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={disabled}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
        >
          {selected ? "Change" : "Add Photo"}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null, null)}
            disabled={disabled}
            className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Remove
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3">
          {pool.length === 0 ? (
            <p className="text-xs text-gray-400">No photos in your library yet.</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {pool.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    onSelect(photo.id, photo.url);
                    setOpen(false);
                  }}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    photo.id === selectedId ? "border-primary-500" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
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
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "+ Upload New Photo"}
          </button>
        </div>
      )}
    </div>
  );
}

function DishForm({
  restaurantId,
  photoPool,
  initialValues,
  onCancel,
  onSubmit,
  isSaving,
  error,
}: {
  restaurantId: string;
  photoPool: Array<{ id: string; url: string }>;
  initialValues: DishFormValues;
  onCancel: () => void;
  onSubmit: (values: DishFormValues) => void;
  isSaving: boolean;
  error: string | null;
}) {
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4"
    >
      <PhotoPicker
        restaurantId={restaurantId}
        photoPool={photoPool}
        selectedId={values.mediaAssetId}
        onSelect={(mediaAssetId) => setValues((v) => ({ ...v, mediaAssetId }))}
        disabled={isSaving}
      />

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Dish Name</label>
        <input
          required
          autoFocus
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          placeholder="e.g. Seared Scallops"
          disabled={isSaving}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Optional — prep style, flavor notes, etc."
          disabled={isSaving}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Ingredients</label>
        <input
          value={values.ingredients}
          onChange={(e) => setValues((v) => ({ ...v, ingredients: e.target.value }))}
          placeholder="Optional — comma-separated"
          disabled={isSaving}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Dietary Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(DietaryTag).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              disabled={isSaving}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                values.dietaryTags.includes(tag)
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {DIETARY_TAG_LABELS[tag]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">Price (ZAR)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
            placeholder="0.00"
            disabled={isSaving}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
          />
        </div>

        <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={values.isAvailable}
            onChange={(e) => setValues((v) => ({ ...v, isAvailable: e.target.checked }))}
            disabled={isSaving}
            className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          Available
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
        >
          {isSaving ? "Saving…" : "Save Dish"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DishLibraryManager({ restaurantId, menuItems, photoPool }: DishLibraryManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [addingCourse, setAddingCourse] = useState<MenuCourse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [pool, setPool] = useState(photoPool);

  const parsePrice = (price: string): number | null => {
    const parsed = Math.round(parseFloat(price) * 100);
    if (Number.isNaN(parsed) || parsed < 0) return null;
    return parsed;
  };

  const toInput = (course: MenuCourse, values: DishFormValues): MenuItemInput | null => {
    const priceCents = parsePrice(values.price);
    if (priceCents === null) {
      setFormError("Enter a valid price");
      return null;
    }
    return {
      course,
      name: values.name,
      description: values.description || null,
      ingredients: values.ingredients || null,
      priceCents,
      isAvailable: values.isAvailable,
      mediaAssetId: values.mediaAssetId,
      dietaryTags: values.dietaryTags,
    };
  };

  const handleCreate = async (course: MenuCourse, values: DishFormValues) => {
    setFormError(null);
    const input = toInput(course, values);
    if (!input) return;

    if (values.mediaAssetId && !pool.some((p) => p.id === values.mediaAssetId)) {
      setPool((prev) => [{ id: values.mediaAssetId!, url: "" }, ...prev]);
    }

    setIsSaving(true);
    const result = await createMenuItem(restaurantId, input);
    setIsSaving(false);

    if (!result.success || !result.data) {
      setFormError(result.error || "Failed to create dish");
      return;
    }
    const newMenuItemId = result.data.menuItemId;

    setItems((prev) => [
      ...prev,
      {
        id: newMenuItemId,
        restaurantId,
        course,
        name: input.name.trim(),
        description: input.description ?? null,
        ingredients: input.ingredients ?? null,
        priceCents: input.priceCents,
        position:
          prev.filter((i) => i.course === course).length > 0
            ? Math.max(...prev.filter((i) => i.course === course).map((i) => i.position)) + 1
            : 0,
        isAvailable: input.isAvailable,
        mediaAssetId: input.mediaAssetId ?? null,
        dietaryTags: input.dietaryTags,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    setAddingCourse(null);
  };

  const handleUpdate = async (item: MenuItem, values: DishFormValues) => {
    setFormError(null);
    const input = toInput(item.course, values);
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
    setEditingId(null);
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
    if (!confirm(`Remove "${item.name}" from the Dish Library?`)) {
      return;
    }

    setListError(null);
    setDeletingId(item.id);
    const result = await deleteMenuItem(item.id);
    setDeletingId(null);

    if (!result.success) {
      setListError(result.error || "Failed to delete dish");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="space-y-6">
      {listError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{listError}</p>
        </div>
      )}

      {COURSES.map(({ key: course, label }) => {
        const courseItems = items
          .filter((item) => item.course === course)
          .sort((a, b) => a.position - b.position);

        return (
          <div key={course} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
              {addingCourse !== course && (
                <button
                  type="button"
                  onClick={() => {
                    setAddingCourse(course);
                    setEditingId(null);
                    setFormError(null);
                  }}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                >
                  + Add {label.slice(0, -1)}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {courseItems.length === 0 && addingCourse !== course && (
                <p className="text-xs text-gray-400">No {label.toLowerCase()} yet.</p>
              )}

              {courseItems.map((item) =>
                editingId === item.id ? (
                  <DishForm
                    key={item.id}
                    restaurantId={restaurantId}
                    photoPool={pool}
                    initialValues={{
                      name: item.name,
                      description: item.description ?? "",
                      ingredients: item.ingredients ?? "",
                      price: (item.priceCents / 100).toFixed(2),
                      isAvailable: item.isAvailable,
                      mediaAssetId: item.mediaAssetId,
                      dietaryTags: item.dietaryTags,
                    }}
                    onCancel={() => {
                      setEditingId(null);
                      setFormError(null);
                    }}
                    onSubmit={(values) => handleUpdate(item, values)}
                    isSaving={isSaving}
                    error={formError}
                  />
                ) : (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3 shadow-card"
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      {item.mediaAssetId && pool.find((p) => p.id === item.mediaAssetId)?.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={pool.find((p) => p.id === item.mediaAssetId)!.url}
                          alt=""
                          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <Badge tone={item.isAvailable ? "success" : "neutral"}>
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
                        )}
                        {item.dietaryTags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.dietaryTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600"
                              >
                                {DIETARY_TAG_LABELS[tag]}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-1 text-sm font-medium text-gray-700">
                          {formatPrice(item.priceCents)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        disabled={togglingId === item.id}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        {togglingId === item.id ? "…" : item.isAvailable ? "Mark 86'd" : "Mark Available"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setAddingCourse(null);
                          setFormError(null);
                        }}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                )
              )}

              {addingCourse === course && (
                <DishForm
                  restaurantId={restaurantId}
                  photoPool={pool}
                  initialValues={emptyFormValues}
                  onCancel={() => {
                    setAddingCourse(null);
                    setFormError(null);
                  }}
                  onSubmit={(values) => handleCreate(course, values)}
                  isSaving={isSaving}
                  error={formError}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
