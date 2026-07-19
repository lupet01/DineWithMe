"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-4">
        <h2 className="text-2xl font-semibold text-slate-900">
          Something went wrong!
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-mono break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-xs text-red-600 mt-2">Digest: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
