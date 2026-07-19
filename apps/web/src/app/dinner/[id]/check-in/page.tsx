"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

interface CheckInDetails {
  status: string;
  checkedInAt: string;
  minutesUntilStart?: number;
}

/**
 * QR Check-in Page
 * 
 * This page handles QR code check-ins for dinners.
 * Users scan a QR code that contains a token, and this page
 * automatically checks them in.
 * 
 * URL: /dinner/[id]/check-in?token=...
 */
export default function CheckInPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const dinnerId = params.id as string;
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<CheckInDetails | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No check-in token provided");
      return;
    }

    // Perform check-in
    async function checkIn() {
      try {
        const response = await fetch("/api/seats/check-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Successfully checked in!");
          setDetails(data.data);
        } else {
          setStatus("error");
          setMessage(data.error?.message || "Check-in failed");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred during check-in");
      }
    }

    checkIn();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === "loading" && (
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            {status === "success" && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === "loading" && "Checking in..."}
              {status === "success" && "Check-in Successful!"}
              {status === "error" && "Check-in Failed"}
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>

            {/* Success Details */}
            {status === "success" && details && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">
                      {details.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checked in at:</span>
                    <span className="font-medium">
                      {new Date(details.checkedInAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {details.minutesUntilStart !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dinner starts:</span>
                      <span className="font-medium">
                        {details.minutesUntilStart > 0
                          ? `In ${Math.round(details.minutesUntilStart)} minutes`
                          : `${Math.abs(Math.round(details.minutesUntilStart))} minutes ago`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {status === "success" && (
                <button
                  onClick={() => (window.location.href = `/dinner/${dinnerId}`)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View Dinner Details
                </button>
              )}
              {status === "error" && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Having trouble? Contact support for assistance.
        </p>
      </div>
    </div>
  );
}
