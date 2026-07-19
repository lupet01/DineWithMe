"use client";

interface SentimentStepProps {
  onSelect: (sentiment: "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE") => void;
}

export function SentimentStep({ onSelect }: SentimentStepProps) {
  const options = [
    {
      value: "GREAT" as const,
      emoji: "😊",
      label: "Great",
      description: "Had an amazing time",
      bg: "bg-green-50",
      border: "border-green-200",
      hover: "hover:bg-green-100",
      text: "text-green-700",
    },
    {
      value: "GOOD" as const,
      emoji: "👍",
      label: "Good",
      description: "Enjoyed the experience",
      bg: "bg-primary-50",
      border: "border-primary-200",
      hover: "hover:bg-primary-100",
      text: "text-primary-700",
    },
    {
      value: "NEUTRAL" as const,
      emoji: "😐",
      label: "Neutral",
      description: "It was okay",
      bg: "bg-gray-50",
      border: "border-gray-200",
      hover: "hover:bg-gray-100",
      text: "text-gray-700",
    },
    {
      value: "UNCOMFORTABLE" as const,
      emoji: "😟",
      label: "Uncomfortable",
      description: "Didn't feel right",
      bg: "bg-red-50",
      border: "border-red-200",
      hover: "hover:bg-red-100",
      text: "text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="pt-4 text-center">
        <div className="mb-3 text-5xl">🍽️</div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-gray-900">
          How was your dinner?
        </h1>
        <p className="mt-2 text-[13px] text-gray-500">
          Your feedback helps us create better experiences
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`flex w-full items-center gap-4 rounded-2xl border ${opt.border} ${opt.bg} px-5 py-4 text-left transition-all ${opt.hover} active:scale-[0.98]`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <p className={`text-[15px] font-semibold ${opt.text}`}>{opt.label}</p>
              <p className="text-[13px] text-gray-500">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
