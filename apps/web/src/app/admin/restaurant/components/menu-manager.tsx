"use client";

import { useState } from "react";
import type { MenuItem } from "@prisma/client";
import { MenuCourse } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  type MenuItemInput,
} from "../menu-actions";

interface MenuManagerProps {
  restaurantId: string;
  menuItems: MenuItem[];
}

const COURSES: { key: MenuCourse; label: string }[] = [
  { key: MenuCourse.STARTER, label: "Starters" },
  { key: MenuCourse.MAIN, label: "Mains" },
  { key: MenuCourse.DESSERT, label: "Desserts" },
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface DishFormValues {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
}

const emptyFormValues: DishFormValues = {
  name: "",
  description: "",
  price: "",
  isAvailable: true,
};

function DishForm({
  initialValues,
  onCancel,
  onSubmit,
  isSaving,
  error,
}: {
  initialValues: DishFormValues;
  onCancel: () => void;
  onSubmit: (values: DishFormValues) => void;
  isSaving: boolean;
  error: string | null;
}) {
  const [values, setValues] = useState<DishFormValues>(initialValues);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Dish Name
        </label>
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
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={2}
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
          placeholder="Optional — ingredients, prep style, etc."
          disabled={isSaving}
          className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
        />
      </div>

      <div className="flex items-end gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Price (USD)
          </label>
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
            onChange={(e) =>
              setValues((v) => ({ ...v, isAvailable: e.target.checked }))
            }
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

export function MenuManager({ restaurantId, menuItems }: MenuManagerProps) {
  const [items, setItems] = useState<MenuItem[]>(menuItems);
  const [addingCourse, setAddingCourse] = useState<MenuCourse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleCreate = async (course: MenuCourse, values: DishFormValues) => {
    setFormError(null);
    const priceCents = parsePrice(values.price);
    if (priceCents === null) {
      setFormError("Enter a valid price");
      return;
    }

    const input: MenuItemInput = {
      course,
      name: values.name,
      description: values.description || null,
      priceCents,
      isAvailable: values.isAvailable,
    };

    setIsSaving(true);
    const result = await createMenuItem(restaurantId, input);
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: result.data.menuItemId,
        restaurantId,
        course,
        name: input.name.trim(),
        description: input.description ?? null,
        priceCents: input.priceCents,
        position:
          prev.filter((i) => i.course === course).length > 0
            ? Math.max(
                ...prev.filter((i) => i.course === course).map((i) => i.position)
              ) + 1
            : 0,
        isAvailable: input.isAvailable,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    setAddingCourse(null);
  };

  const handleUpdate = async (item: MenuItem, values: DishFormValues) => {
    setFormError(null);
    const priceCents = parsePrice(values.price);
    if (priceCents === null) {
      setFormError("Enter a valid price");
      return;
    }

    const input: MenuItemInput = {
      course: item.course,
      name: values.name,
      description: values.description || null,
      priceCents,
      isAvailable: values.isAvailable,
    };

    setIsSaving(true);
    const result = await updateMenuItem(item.id, input);
    setIsSaving(false);

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              name: input.name.trim(),
              description: input.description ?? null,
              priceCents: input.priceCents,
              isAvailable: input.isAvailable,
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
      setListError(result.error);
      return;
    }

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
    );
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(`Remove "${item.name}" from the menu?`)) {
      return;
    }

    setListError(null);
    setDeletingId(item.id);
    const result = await deleteMenuItem(item.id);
    setDeletingId(null);

    if (!result.success) {
      setListError(result.error);
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
                <p className="text-xs text-gray-400">
                  No {label.toLowerCase()} yet.
                </p>
              )}

              {courseItems.map((item) =>
                editingId === item.id ? (
                  <DishForm
                    key={item.id}
                    initialValues={{
                      name: item.name,
                      description: item.description ?? "",
                      price: (item.priceCents / 100).toFixed(2),
                      isAvailable: item.isAvailable,
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
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <Badge tone={item.isAvailable ? "success" : "neutral"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-1 text-sm font-medium text-gray-700">
                        {formatPrice(item.priceCents)}
                      </p>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        disabled={togglingId === item.id}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      >
                        {togglingId === item.id
                          ? "…"
                          : item.isAvailable
                          ? "Mark 86'd"
                          : "Mark Available"}
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
