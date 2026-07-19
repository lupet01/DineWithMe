"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createTheme, updateTheme, type ThemeFormInput } from "../actions";

interface ThemeFormProps {
  mode: "create" | "edit";
  themeId?: string;
  initialValues?: ThemeFormInput;
}

const emptyValues: ThemeFormInput = {
  key: "",
  title: "",
  shortDescription: "",
  whatToExpect: "",
  boundaries: "",
  conversationStarters: [],
};

export function ThemeForm({ mode, themeId, initialValues }: ThemeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ThemeFormInput>(initialValues ?? emptyValues);
  const [startersText, setStartersText] = useState(
    (initialValues?.conversationStarters ?? []).join("\n")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const conversationStarters = startersText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: ThemeFormInput = { ...values, conversationStarters };

    const result =
      mode === "create"
        ? await createTheme(payload)
        : await updateTheme(themeId!, payload);

    setIsSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save theme");
      return;
    }

    router.push("/admin/ops/themes");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card padding="lg" className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Key</label>
          <input
            required
            disabled={mode === "edit"}
            value={values.key}
            onChange={(e) => setValues((v) => ({ ...v, key: e.target.value }))}
            placeholder="e.g. tech-innovators"
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-1 text-xs text-gray-500">
            Unique, URL-safe identifier. Cannot be changed after creation.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            required
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            placeholder="e.g. Tech Innovators"
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Short Description
          </label>
          <input
            required
            value={values.shortDescription}
            onChange={(e) => setValues((v) => ({ ...v, shortDescription: e.target.value }))}
            placeholder="Brief tagline shown on dinner cards"
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            What to Expect
          </label>
          <textarea
            required
            rows={3}
            value={values.whatToExpect}
            onChange={(e) => setValues((v) => ({ ...v, whatToExpect: e.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Boundaries</label>
          <textarea
            required
            rows={3}
            value={values.boundaries}
            onChange={(e) => setValues((v) => ({ ...v, boundaries: e.target.value }))}
            placeholder="What's off-limits for this theme"
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Conversation Starters
          </label>
          <textarea
            rows={5}
            value={startersText}
            onChange={(e) => setStartersText(e.target.value)}
            placeholder={"One question per line"}
            className="w-full rounded-xl border border-gray-200 bg-cream-100 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none"
          />
        </div>
      </Card>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving…" : mode === "create" ? "Create Theme" : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/ops/themes")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
