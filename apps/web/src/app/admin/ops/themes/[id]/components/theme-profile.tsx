"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateThemeContent,
  addIcebreaker,
  updateIcebreaker,
  deleteIcebreaker,
  type ThemeContentInput,
} from "../../actions";

interface ThemePerformanceData {
  totalDinners: number;
  totalSeatsBooked: number;
  avgFillRate: number | null;
  avgAttendanceRate: number | null;
  avgFeedbackScore: number | null;
  avgConnectionRate: number | null;
  avgWouldReturnRate: number | null;
}

interface Icebreaker {
  id: string;
  text: string;
  usageCount: number;
  avgRating: number | null;
}

interface ThemeProfileProps {
  theme: {
    id: string;
    key: string;
    title: string;
    shortDescription: string;
    whatToExpect: string;
    boundaries: string;
    isActive: boolean;
    performance: ThemePerformanceData | null;
  };
  icebreakers: Icebreaker[];
  enabledRestaurants: Array<{ id: string; name: string }>;
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

export function ThemeProfile({ theme, icebreakers, enabledRestaurants }: ThemeProfileProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Performance */}
      <Card padding="lg" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
        {theme.performance ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PerformanceStat label="Dinners Completed" value={String(theme.performance.totalDinners)} />
            <PerformanceStat label="Seats Booked" value={String(theme.performance.totalSeatsBooked)} />
            <PerformanceStat label="Avg Fill Rate" value={formatPercent(theme.performance.avgFillRate)} />
            <PerformanceStat label="Avg Attendance" value={formatPercent(theme.performance.avgAttendanceRate)} />
            <PerformanceStat
              label="Avg Rating"
              value={theme.performance.avgFeedbackScore != null ? `${theme.performance.avgFeedbackScore.toFixed(1)}/5` : "—"}
            />
            <PerformanceStat label="Would Return" value={formatPercent(theme.performance.avgWouldReturnRate)} />
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            No completed dinners for this theme yet - stats appear once one wraps up.
          </p>
        )}
      </Card>

      {/* Content */}
      <ContentSection theme={theme} onSaved={() => router.refresh()} />

      {/* Icebreakers */}
      <IcebreakersSection themeId={theme.id} icebreakers={icebreakers} onChanged={() => router.refresh()} />

      {/* Where It Runs */}
      <Card padding="lg" className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Where It Runs</h3>
        {enabledRestaurants.length === 0 ? (
          <p className="text-xs text-gray-400">No restaurants have enabled this theme yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {enabledRestaurants.map((r) => (
              <span key={r.id} className="rounded-full bg-cream-200 px-3 py-1.5 text-xs font-medium text-gray-700">
                {r.name}
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ContentSection({
  theme,
  onSaved,
}: {
  theme: ThemeProfileProps["theme"];
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<ThemeContentInput>({
    title: theme.title,
    shortDescription: theme.shortDescription,
    whatToExpect: theme.whatToExpect,
    boundaries: theme.boundaries,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    const result = await updateThemeContent(theme.id, values);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save");
      return;
    }
    setEditing(false);
    onSaved();
  };

  return (
    <Card padding="lg" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Content</h3>
        <div className="flex items-center gap-2">
          <Badge tone={theme.isActive ? "success" : "neutral"}>{theme.isActive ? "Active" : "Archived"}</Badge>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-400">Key: {theme.key} (cannot be changed)</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!editing ? (
        <div className="space-y-2 text-sm text-gray-700">
          <p className="font-medium">{theme.shortDescription}</p>
          <p className="whitespace-pre-wrap text-gray-600">{theme.whatToExpect}</p>
          <p className="whitespace-pre-wrap text-gray-500">
            <span className="font-medium text-gray-700">Boundaries: </span>
            {theme.boundaries}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
            <input
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Short Description</label>
            <input
              value={values.shortDescription}
              onChange={(e) => setValues((v) => ({ ...v, shortDescription: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">What to Expect</label>
            <textarea
              rows={3}
              value={values.whatToExpect}
              onChange={(e) => setValues((v) => ({ ...v, whatToExpect: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Boundaries</label>
            <textarea
              rows={3}
              value={values.boundaries}
              onChange={(e) => setValues((v) => ({ ...v, boundaries: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setValues({
                  title: theme.title,
                  shortDescription: theme.shortDescription,
                  whatToExpect: theme.whatToExpect,
                  boundaries: theme.boundaries,
                });
              }}
              disabled={saving}
              className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function IcebreakersSection({
  themeId,
  icebreakers,
  onChanged,
}: {
  themeId: string;
  icebreakers: Icebreaker[];
  onChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ranked = [...icebreakers].sort((a, b) => b.usageCount - a.usageCount);

  const handleAdd = async () => {
    setError(null);
    setBusy(true);
    const result = await addIcebreaker(themeId, newText);
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Failed to add");
      return;
    }
    setNewText("");
    setAdding(false);
    onChanged();
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    setBusy(true);
    const result = await updateIcebreaker(themeId, id, editingText);
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Failed to update");
      return;
    }
    setEditingId(null);
    onChanged();
  };

  const handleDelete = async (id: string, text: string) => {
    if (!confirm(`Delete "${text}"?`)) return;
    setBusy(true);
    const result = await deleteIcebreaker(themeId, id);
    setBusy(false);
    if (!result.success) {
      setError(result.error || "Failed to delete");
      return;
    }
    onChanged();
  };

  return (
    <Card padding="lg" className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">Icebreakers</h3>
      <p className="text-xs text-gray-500">Ranked by how often each question is shown to a confirmed guest.</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {ranked.length === 0 ? (
        <p className="text-xs text-gray-400">No icebreaker questions yet.</p>
      ) : (
        <div className="space-y-2">
          {ranked.map((ib) =>
            editingId === ib.id ? (
              <div key={ib.id} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  disabled={busy}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => handleUpdate(ib.id)}
                  disabled={busy}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  disabled={busy}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div key={ib.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white p-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">{ib.text}</p>
                  <p className="text-xs text-gray-500">
                    Used {ib.usageCount}× {ib.avgRating != null && `· ${ib.avgRating.toFixed(1)} avg rating`}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(ib.id);
                      setEditingText(ib.text);
                    }}
                    disabled={busy}
                    aria-label={`Edit "${ib.text}"`}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-cream-200 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ib.id, ib.text)}
                    disabled={busy}
                    aria-label={`Delete "${ib.text}"`}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="New icebreaker question"
            disabled={busy}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewText("");
            }}
            disabled={busy}
            aria-label="Cancel"
            className="rounded-full p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-semibold text-primary-600 hover:text-primary-700"
        >
          + Add Icebreaker
        </button>
      )}
    </Card>
  );
}
