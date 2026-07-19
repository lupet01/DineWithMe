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
          Thanks for sharing!
        </h1>
      </div>

      <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-600">
          If you connected with anyone tonight, we&apos;ll only let you know once it&apos;s
          mutual. Your feedback stays private and helps us build better dinners.
        </p>
      </div>

      <button
        onClick={onClose}
        className="rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
      >
        Back to Home
      </button>
    </div>
  );
}
