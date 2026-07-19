"use client";

import { CheckCircle } from "lucide-react";

interface CompletionStepProps {
  onClose: () => void;
}

export function CompletionStep({ onClose }: CompletionStepProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="h-12 w-12 text-green-600" />
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Thank you for your feedback
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Your input helps us create better dining experiences
        </p>
      </div>

      <button
        onClick={onClose}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        Back to My Dinners
      </button>
    </div>
  );
}
