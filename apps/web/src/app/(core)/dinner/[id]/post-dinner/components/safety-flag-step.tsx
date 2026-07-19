"use client";

import { useState } from "react";

interface SafetyFlagStepProps {
  onComplete: (wouldDineAgain: boolean | null, notes: string | null) => void;
}

export function SafetyFlagStep({ onComplete }: SafetyFlagStepProps) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  if (showNotes) {
    return (
      <div className="space-y-6">
        <div className="pt-4 text-center">
          <div className="mb-3 text-5xl">🛡️</div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
            Help us understand
          </h1>
          <p className="mt-2 text-[13px] text-gray-500">
            Your feedback is private and helps us improve safety
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-gray-900">
              What happened? (optional)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any details that might help us..."
              className="w-full rounded-xl border border-gray-200 bg-cream-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-400">{notes.length}/1000</p>
          </div>

          <button
            onClick={() => onComplete(false, notes.trim() || null)}
            className="w-full rounded-full bg-primary-500 py-4 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
          >
            Continue
          </button>
          <button
            onClick={() => onComplete(false, null)}
            className="w-full rounded-full border-2 border-gray-200 bg-white py-4 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-50"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <div className="mb-3 text-5xl">🛡️</div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          Did you feel safe?
        </h1>
        <p className="mt-2 text-[13px] text-gray-500 leading-relaxed">
          Your safety matters. This is anonymous and helps us keep the community safe.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => onComplete(true, null)}
          className="flex w-full items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-left transition-all hover:bg-green-100 active:scale-[0.98]"
        >
          <span className="text-2xl">😊</span>
          <div>
            <p className="text-[15px] font-semibold text-green-700">Yes, I felt comfortable</p>
            <p className="text-[13px] text-gray-500">Everyone was respectful</p>
          </div>
        </button>

        <button
          onClick={() => onComplete(null, null)}
          className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition-all hover:bg-gray-100 active:scale-[0.98]"
        >
          <span className="text-2xl">😐</span>
          <div>
            <p className="text-[15px] font-semibold text-gray-700">It was okay</p>
            <p className="text-[13px] text-gray-500">Nothing concerning but room to improve</p>
          </div>
        </button>

        <button
          onClick={() => setShowNotes(true)}
          className="flex w-full items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left transition-all hover:bg-red-100 active:scale-[0.98]"
        >
          <span className="text-2xl">🚩</span>
          <div>
            <p className="text-[15px] font-semibold text-red-700">I want to report something</p>
            <p className="text-[13px] text-gray-500">Something made me uncomfortable</p>
          </div>
        </button>
      </div>
    </div>
  );
}
