"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMeal } from "../actions";

export function NewMealButton({ restaurantId, block = false }: { restaurantId: string; block?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createMeal(restaurantId, name);
    setSaving(false);

    if (!result.success || !result.data) {
      setError(result.error || "Failed to create meal");
      return;
    }

    router.push(`/admin/meals/${result.data.mealId}`);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={block ? "btn btn-primary btn-block" : "btn btn-primary btn-sm"}
        style={block ? undefined : { alignSelf: "flex-start" }}
      >
        + New Meal
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="field-label">Meal Name</label>
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Autumn Tasting Menu"
          disabled={saving}
          className="field-input"
        />
        {error && <p className="field-error">{error}</p>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
          {saving ? "Creating…" : "Create & Edit"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={saving}
          className="btn btn-outline btn-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
