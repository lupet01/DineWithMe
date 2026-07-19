"use client";

import { useState } from "react";
import { Users, Check, X } from "lucide-react";

interface PersonSignalsStepProps {
  attendees: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  }>;
  onComplete: (signals: Array<{ targetUserId: string; wouldDineAgain: boolean }>) => void;
  onSkip: () => void;
  submitting: boolean;
}

export function PersonSignalsStep({ attendees, onComplete, onSkip, submitting }: PersonSignalsStepProps) {
  const [signals, setSignals] = useState<Map<string, boolean>>(new Map());

  const handleToggle = (userId: string, value: boolean) => {
    const newSignals = new Map(signals);
    if (newSignals.get(userId) === value) {
      newSignals.delete(userId);
    } else {
      newSignals.set(userId, value);
    }
    setSignals(newSignals);
  };

  const handleSubmit = () => {
    const signalsArray = Array.from(signals.entries()).map(([targetUserId, wouldDineAgain]) => ({
      targetUserId,
      wouldDineAgain,
    }));
    onComplete(signalsArray);
  };

  const getDisplayName = (attendee: typeof attendees[0]) => {
    if (attendee.firstName && attendee.lastName) {
      return `${attendee.firstName} ${attendee.lastName}`;
    }
    if (attendee.firstName) {
      return attendee.firstName;
    }
    return attendee.email.split("@")[0];
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Who would you dine with again?
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Tap to indicate interest • Completely private
        </p>
      </div>

      <div className="space-y-3">
        {attendees.map((attendee) => {
          const signal = signals.get(attendee.id);
          const hasYes = signal === true;
          const hasNo = signal === false;

          return (
            <div
              key={attendee.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {getDisplayName(attendee)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(attendee.id, true)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    hasYes
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-gray-200 bg-white text-gray-400 hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                  }`}
                  aria-label="Would dine again"
                >
                  <Check className="h-5 w-5" />
                </button>

                <button
                  onClick={() => handleToggle(attendee.id, false)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    hasNo
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  }`}
                  aria-label="Would not dine again"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          disabled={submitting}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || signals.size === 0}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
