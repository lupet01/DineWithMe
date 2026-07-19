import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ConfirmationErrorProps {
  error: string;
  onRetry: () => void;
  onBackToDinner: () => void;
}

export function ConfirmationError({
  error,
  onRetry,
  onBackToDinner,
}: ConfirmationErrorProps) {
  // Determine error type and provide appropriate recovery
  const isExpiredError = error.toLowerCase().includes("expired");
  const isAlreadyConfirmed = error.toLowerCase().includes("not held");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Header */}
      <div className="bg-gradient-to-b from-red-50 to-gray-50 px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Confirmation Failed
        </h1>
        <p className="text-gray-600">
          {isExpiredError
            ? "Your hold has expired"
            : isAlreadyConfirmed
            ? "This seat is no longer available"
            : "Something went wrong"}
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 pb-6">
        {/* Error Details */}
        <Card className="mb-4">
          <h3 className="mb-2 font-semibold text-gray-900">What happened?</h3>
          <p className="text-sm text-gray-700">{error}</p>
        </Card>

        {/* Recovery Options */}
        <Card className="mb-6">
          <h3 className="mb-3 font-semibold text-gray-900">What can you do?</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {isExpiredError && (
              <>
                <p>
                  • Seat holds expire after 10 minutes
                </p>
                <p>
                  • Return to the dinner page to try again
                </p>
                <p>
                  • Other seats may still be available
                </p>
              </>
            )}
            {isAlreadyConfirmed && (
              <>
                <p>
                  • This seat has been taken by another guest
                </p>
                <p>
                  • Check if other seats are available
                </p>
                <p>
                  • Join the waitlist to be notified
                </p>
              </>
            )}
            {!isExpiredError && !isAlreadyConfirmed && (
              <>
                <p>
                  • Try confirming again
                </p>
                <p>
                  • Check your internet connection
                </p>
                <p>
                  • Contact support if the issue persists
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {/* Primary action based on error type */}
          {isExpiredError || isAlreadyConfirmed ? (
            <button
              onClick={onBackToDinner}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dinner</span>
            </button>
          ) : (
            <button
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
          )}

          {/* Secondary action */}
          {!isExpiredError && !isAlreadyConfirmed && (
            <button
              onClick={onBackToDinner}
              className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50"
            >
              Back to Dinner
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
