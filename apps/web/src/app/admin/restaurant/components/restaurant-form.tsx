"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@dinewithme/db";
import { createRestaurant, updateRestaurant } from "../actions";
import type { CreateRestaurantInput } from "@dinewithme/shared";

interface RestaurantFormProps {
  restaurant?: Restaurant | null;
  mode: "create" | "edit";
}

export function RestaurantForm({ restaurant, mode }: RestaurantFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState<CreateRestaurantInput>({
    name: restaurant?.name || "",
    description: restaurant?.description || "",
    cuisine: restaurant?.cuisine || "",
    city: restaurant?.city || "",
    address: restaurant?.address || "",
    phone: restaurant?.phone || "",
    website: restaurant?.website || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRestaurant(formData)
          : await updateRestaurant(restaurant!.id, formData);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev: Record<string, string[]>) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-xl">⚠️</div>
            <div>
              <div className="font-medium text-red-900">Error</div>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Basic Information
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {mode === "create"
              ? "Tell us about your restaurant"
              : "Update your restaurant's public profile"}
          </p>
        </div>

        <div className="space-y-6">
          {/* Restaurant Name */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., The Gourmet Kitchen"
              required
              disabled={isPending}
            />
            {fieldErrors.name && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.name[0]}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
              placeholder="Describe your restaurant's atmosphere, specialties, and what makes it unique..."
              disabled={isPending}
            />
            {fieldErrors.description && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.description[0]}
              </p>
            )}
          </div>

          {/* Cuisine and City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="cuisine"
                className="text-sm font-medium text-slate-700 block mb-2"
              >
                Cuisine Type
              </label>
              <input
                type="text"
                id="cuisine"
                name="cuisine"
                value={formData.cuisine}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="e.g., Italian, French, Japanese"
                disabled={isPending}
              />
              {fieldErrors.cuisine && (
                <p className="text-sm text-red-600 mt-1">
                  {fieldErrors.cuisine[0]}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="city"
                className="text-sm font-medium text-slate-700 block mb-2"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="e.g., Cape Town"
                disabled={isPending}
              />
              {fieldErrors.city && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.city[0]}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., 123 Main Street"
              disabled={isPending}
            />
            {fieldErrors.address && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.address[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Contact Information
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            How can guests reach you?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., +27 21 123 4567"
              disabled={isPending}
            />
            {fieldErrors.phone && (
              <p className="text-sm text-red-600 mt-1">{fieldErrors.phone[0]}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label
              htmlFor="website"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., https://yourrestaurant.com"
              disabled={isPending}
            />
            {fieldErrors.website && (
              <p className="text-sm text-red-600 mt-1">
                {fieldErrors.website[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPending}
        >
          {isPending
            ? "Saving..."
            : mode === "create"
            ? "Create Restaurant"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
