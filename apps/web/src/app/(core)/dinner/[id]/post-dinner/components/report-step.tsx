"use client";

import { useState } from "react";
import type { SafetyReportReason } from "@dinewithme/shared";

interface ReasonOption {
  value: SafetyReportReason;
  label: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: "MADE_UNCOMFORTABLE", label: "Made me uncomfortable" },
  { value: "INAPPROPRIATE_BEHAVIOR", label: "Inappropriate behavior" },
  { value: "SAFETY_CONCERN", label: "Safety concern" },
  { value: "OTHER", label: "Other" },
];

const PREFER_NOT_TO_SAY = "__prefer_not_to_say__";

interface ReportAttendee {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface ReportStepProps {
  attendees: ReportAttendee[];
  onSubmit: (reason: SafetyReportReason, details: string, reportedUserId: string | null) => void;
  onBack: () => void;
}

function displayName(attendee: ReportAttendee): string {
  const name = [attendee.firstName, attendee.lastName].filter(Boolean).join(" ");
  return name || "Guest";
}

/**
 * Screen 3 "Report Something" - only reached from the Safety Check screen
 * when "I want to report something" is selected and Continue is tapped.
 * Adds a reason-tag picker on top of the free-text notes the old inline
 * safety-flag-step sub-view had. SafetyReportReason is a single enum
 * column server-side, so this is a single-select (radio-like) picker even
 * though the tags are visually chips, rather than a true multi-select.
 *
 * "Who is this about?" picker: single-select over the dinner's other
 * attendees, plus an explicit "Someone not at the table / prefer not to
 * say" option that keeps reportedUserId null. Nothing is pre-selected -
 * for a safety-report picker specifically, an apparently-pre-chosen name
 * is a real misread risk, so Submit stays disabled until a reason AND a
 * who-selection (including "prefer not to say") are both made.
 */
export function ReportStep({ attendees, onSubmit, onBack }: ReportStepProps) {
  const [reason, setReason] = useState<SafetyReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [who, setWho] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!reason || !who) return;
    const reportedUserId = who === PREFER_NOT_TO_SAY ? null : who;
    onSubmit(reason, details.trim(), reportedUserId);
  };

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <div className="mb-3 text-5xl">🚩</div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          Tell us what happened
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          This report is confidential and reviewed by our Trust &amp; Safety team.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-[15px] font-semibold text-gray-900">What best describes it?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REASON_OPTIONS.map((opt) => {
            const active = reason === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setReason(opt.value)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-[15px] font-semibold text-gray-900">Who is this about?</p>
        <div className="mt-3 space-y-2">
          {attendees.map((attendee) => {
            const active = who === attendee.id;
            return (
              <button
                key={attendee.id}
                type="button"
                onClick={() => setWho(attendee.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active ? "border-red-500 bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[13px] font-semibold text-gray-600">
                  {displayName(attendee).charAt(0).toUpperCase()}
                </div>
                <span className="text-[14px] font-medium text-gray-900">
                  {displayName(attendee)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setWho(PREFER_NOT_TO_SAY)}
            className={`w-full rounded-xl border p-3 text-left text-[14px] font-medium transition-colors ${
              who === PREFER_NOT_TO_SAY
                ? "border-red-500 bg-red-50 text-gray-900"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Someone not at the table / prefer not to say
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-gray-900">
          Details
        </label>
        <textarea
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Share any details that might help us..."
          className="w-full rounded-xl border border-gray-200 bg-cream-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
          maxLength={1000}
        />
        <p className="mt-1 text-xs text-gray-400">{details.length}/1000</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSubmit}
          disabled={!reason || !who}
          className="w-full rounded-full bg-red-600 py-4 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Report
        </button>
        <button
          onClick={onBack}
          className="w-full rounded-full border-2 border-gray-200 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
        >
          Back to Safety Check
        </button>
      </div>
    </div>
  );
}
