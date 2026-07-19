"use client";

import { Check, AlertCircle } from "lucide-react";

interface ComfortStepProps {
  onSelect: (comfort: "FULL" | "MOSTLY" | "LOW") => void;
}

export function ComfortStep({ onSelect }: ComfortStepProps) {
  const options = [
    {
      value: "FULL" as const,
      label: "Completely comfortable",
      description: "Felt safe and welcome",
      icon: Check,
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      borderColor: "border-green-200",
    },
    {
      value: "MOSTLY" as const,
      label: "Mostly comfortable",
      description: "A few minor moments",
      icon: Check,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      borderColor: "border-blue-200",
    },
    {
      value: "LOW" as const,
      label: "Not comfortable",
      description: "Something felt off",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      hoverColor: "hover:bg-red-100",
      borderColor: "border-red-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          How comfortable did you feel?
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your safety and comfort are our top priority
        </p>
      </div>

      <div className="space-y-3">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`flex w-full items-center gap-4 rounded-2xl border ${option.borderColor} ${option.bgColor} p-6 text-left transition-all ${option.hoverColor} active:scale-[0.98]`}
            >
              <div className={`rounded-full ${option.bgColor} p-3`}>
                <Icon className={`h-6 w-6 ${option.color}`} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${option.color}`}>
                  {option.label}
                </div>
                <div className="text-sm text-gray-600">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
