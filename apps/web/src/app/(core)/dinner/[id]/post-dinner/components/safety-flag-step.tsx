"use client";

import { useState } from "react";

export type SafetyOption = "comfortable" | "okay" | "report";

interface SafetyStepProps {
  onContinue: (option: SafetyOption) => void;
}

const OPTIONS: Array<{
  value: SafetyOption;
  emoji: string;
  title: string;
  description: string;
  border: string;
  bg: string;
  selectedBorder: string;
  selectedBg: string;
  text: string;
}> = [
  {
    value: "comfortable",
    emoji: "😊",
    title: "Yes, I felt comfortable",
    description: "Everyone was respectful",
    border: "border-green-200",
    bg: "bg-green-50",
    selectedBorder: "border-green-500",
    selectedBg: "bg-green-100",
    text: "text-green-700",
  },
  {
    value: "okay",
    emoji: "😐",
    title: "It was okay",
    description: "Nothing concerning but room to improve",
    border: "border-gray-200",
    bg: "bg-gray-50",
    selectedBorder: "border-gray-500",
    selectedBg: "bg-gray-100",
    text: "text-gray-700",
  },
  {
    value: "report",
    emoji: "🚩",
    title: "I want to report something",
    description: "Something made me uncomfortable",
    border: "border-red-200",
    bg: "bg-red-50",
    selectedBorder: "border-red-500",
    selectedBg: "bg-red-100",
    text: "text-red-700",
  },
];

/**
 * Screen 2 "Safety Check" - its own screen, always shown after the rating
 * screen (not conditional on a prior "comfort" answer). The old ComfortStep
 * (FULL/MOSTLY/LOW) has been folded into this screen: these three options
 * map onto that same enum one-to-one (comfortable -> FULL, okay -> MOSTLY,
 * report -> LOW), so feedback-flow.tsx derives comfortLevel and
 * wouldDineAgain from whichever option is selected here rather than
 * collecting them from a separate step.
 */
export function SafetyFlagStep({ onContinue }: SafetyStepProps) {
  const [selected, setSelected] = useState<SafetyOption | null>(null);

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <div className="mb-3 text-5xl">🛡️</div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          Did you feel safe?
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
          Your safety matters. This is anonymous and helps us keep the community safe.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all active:scale-[0.98] ${
                isSelected ? `${opt.selectedBorder} ${opt.selectedBg}` : `${opt.border} ${opt.bg} hover:brightness-95`
              }`}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div>
                <p className={`text-[15px] font-semibold ${opt.text}`}>{opt.title}</p>
                <p className="text-[13px] text-gray-500">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => selected && onContinue(selected)}
        disabled={!selected}
        className="w-full rounded-full bg-primary-500 py-4 text-[15px] font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
