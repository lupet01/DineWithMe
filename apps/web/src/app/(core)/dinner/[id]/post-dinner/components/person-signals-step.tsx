"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";

interface ConnectionsStepProps {
  attendees: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
  }>;
  onComplete: (targetUserIds: string[]) => void;
  onSkip: () => void;
  submitting: boolean;
}

/**
 * Screen 4 "Connections" - a simpler binary tap-to-connect toggle per
 * person, replacing the old per-person "would you dine again" thumbs
 * up/down picker. Rather than inventing a new signal type server-side,
 * tapping a person is sent as personSignals: [{ targetUserId, wouldDineAgain:
 * true }] - the existing mutual-interest and trust-event logic in
 * api/feedback/submit/route.ts already treats wouldDineAgain: true as "this
 * person stood out to me", which is exactly what a tap means here. People
 * who aren't tapped are simply omitted from personSignals (no explicit
 * "no" is recorded, matching "It's mutual - they won't know unless they
 * tap you too").
 */
export function PersonSignalsStep({ attendees, onComplete, onSkip, submitting }: ConnectionsStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (userId: string) => {
    const next = new Set(selected);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelected(next);
  };

  const handleSubmit = () => {
    onComplete(Array.from(selected));
  };

  const getDisplayName = (attendee: (typeof attendees)[0]) => {
    if (attendee.firstName && attendee.lastName) {
      return `${attendee.firstName} ${attendee.lastName}`;
    }
    if (attendee.firstName) {
      return attendee.firstName;
    }
    return "Guest";
  };

  const getInitial = (attendee: (typeof attendees)[0]) => {
    const name = getDisplayName(attendee);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <div className="mb-3 text-5xl">✨</div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          Did anyone stand out?
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          Tap people you&apos;d like to connect with. It&apos;s mutual — they won&apos;t know
          unless they tap you too.
        </p>
      </div>

      <div className="space-y-3">
        {attendees.map((attendee, index) => {
          const isSelected = selected.has(attendee.id);
          return (
            <button
              key={attendee.id}
              onClick={() => toggle(attendee.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                isSelected ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-[15px] font-semibold text-gray-600">
                {getInitial(attendee)}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium text-gray-900">{getDisplayName(attendee)}</p>
                <p className="text-[13px] text-gray-500">Seat {index + 1}</p>
              </div>

              {isSelected ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white">
                  <Check className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400">
                  <Plus className="h-4 w-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-full bg-primary-500 py-4 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Connections"}
        </button>
        <button
          onClick={onSkip}
          disabled={submitting}
          className="w-full rounded-full border-2 border-gray-200 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          No connections tonight
        </button>
      </div>
    </div>
  );
}
