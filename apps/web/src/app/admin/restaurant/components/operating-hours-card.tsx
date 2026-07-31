"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  OPERATING_HOURS_DAYS,
  OPERATING_HOURS_DAY_LABELS,
  type OperatingHours,
  type DayHours,
} from "@dinewithme/shared";
import { updateOperatingHours } from "../actions";

interface OperatingHoursCardProps {
  restaurantId: string;
  operatingHours: unknown;
}

const emptyDay: DayHours = { open: "", close: "", closed: false };

function parseOperatingHours(value: unknown): OperatingHours {
  const parsed = (value ?? {}) as Partial<Record<string, Partial<DayHours>>>;
  return OPERATING_HOURS_DAYS.reduce((acc, day) => {
    const d = parsed[day];
    acc[day] = {
      open: d?.open ?? "",
      close: d?.close ?? "",
      closed: d?.closed ?? false,
    };
    return acc;
  }, {} as OperatingHours);
}

/**
 * §6.2 wireframe, marked "NEW" - no real-code equivalent before this pass.
 * Own "Save Hours" button, independent of the Business Details/Contact
 * Information form above it, same standalone-save pattern as
 * ApplicationInfoCard. Time fields are plain text inputs (not native
 * <input type="time">) to match the wireframe's field-input look exactly -
 * the browser's own time-picker chrome doesn't match the rest of the form.
 */
export function OperatingHoursCard({ restaurantId, operatingHours }: OperatingHoursCardProps) {
  const router = useRouter();
  const [hours, setHours] = useState<OperatingHours>(() => parseOperatingHours(operatingHours));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const setDay = (day: (typeof OPERATING_HOURS_DAYS)[number], patch: Partial<DayHours>) => {
    setSaved(false);
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateOperatingHours(restaurantId, hours);
      if (result.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="card-title">Operating Hours</div>
        <span className="badge badge-blue" style={{ fontSize: 10 }}>
          NEW
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {OPERATING_HOURS_DAYS.map((day) => {
          const d = hours[day] ?? emptyDay;
          return (
            <div key={day} className="hours-row">
              <span className="hours-day-label">{OPERATING_HOURS_DAY_LABELS[day]}</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="11:00"
                maxLength={5}
                className="field-input hours-time-input"
                value={d.open}
                disabled={isPending || d.closed}
                onChange={(e) => setDay(day, { open: e.target.value })}
              />
              <span className="hours-sep">to</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="22:00"
                maxLength={5}
                className="field-input hours-time-input"
                value={d.close}
                disabled={isPending || d.closed}
                onChange={(e) => setDay(day, { close: e.target.value })}
              />
              <label className="hours-closed-label">
                <input
                  type="checkbox"
                  checked={d.closed}
                  disabled={isPending}
                  onChange={(e) => setDay(day, { closed: e.target.checked })}
                />
                Closed
              </label>
            </div>
          );
        })}
      </div>
      {error && (
        <p style={{ fontSize: 12, color: "var(--red-txt)", marginTop: 10 }}>{error}</p>
      )}
      <button
        type="button"
        className="btn btn-primary btn-sm"
        style={{ marginTop: 16 }}
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? "Saving…" : saved ? "Saved ✓" : "Save Hours"}
      </button>
    </div>
  );
}
