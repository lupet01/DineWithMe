"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RatingStep } from "./sentiment-step";
import { SafetyFlagStep, type SafetyOption } from "./safety-flag-step";
import { ReportStep } from "./report-step";
import { PersonSignalsStep } from "./person-signals-step";
import { CompletionStep } from "./completion-step";
import { FeedbackFlowSkeleton } from "./feedback-flow-skeleton";
import { X } from "lucide-react";
import type { VibeTag, SafetyReportReason } from "@dinewithme/shared";

interface FeedbackFlowProps {
  dinnerId: string;
}

// Screen 1 "How Was It?" -> Screen 2 "Safety Check" -> (optional) Screen 3
// "Report Something" -> Screen 4 "Connections" -> Screen 5 "All Done".
// "report" is only ever visited when the Safety Check screen's "report
// something" option is selected and Continue is tapped; every other path
// skips straight from "safety" to "connections" (or to submission if the
// dinner had no other attendees).
type Step = "rating" | "safety" | "report" | "connections" | "completion";

interface FeedbackData {
  overallSentiment?: "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE";
  comfortLevel?: "FULL" | "MOSTLY" | "LOW";
  wouldDineAgain?: boolean | null;
  notes?: string | null;
  rating?: number;
  vibeTags?: VibeTag[];
  reportReason?: SafetyReportReason;
  reportedUserId?: string | null;
  personSignals?: Array<{
    targetUserId: string;
    wouldDineAgain: boolean;
  }>;
}

interface DinnerAttendee {
  id: string;
  firstName: string | null;
  lastName: string | null;
}

interface DinnerInfo {
  restaurantName: string | null;
  startsAt: string | null;
}

/**
 * Feedback.overallSentiment is still a required, non-nullable column
 * (GREAT/GOOD/NEUTRAL/UNCOMFORTABLE), but Screen 1 no longer asks for it
 * directly - it collects a 1-5 star rating instead. This derives the old
 * enum from the new rating so the rest of the pipeline (trust event rules
 * in api/feedback/submit/route.ts) keeps working unchanged.
 */
function deriveSentimentFromRating(
  rating: number
): "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE" {
  if (rating >= 5) return "GREAT";
  if (rating === 4) return "GOOD";
  if (rating === 3) return "NEUTRAL";
  return "UNCOMFORTABLE";
}

/**
 * Maps the Safety Check screen's selected option onto the pre-existing
 * comfortLevel enum (FULL/MOSTLY/LOW) and wouldDineAgain flag that used to
 * be collected by a separate ComfortStep + conditional SafetyFlagStep.
 * See feedback-flow's Step comment and the safety-flag-step.tsx doc
 * comment for why these two steps were merged into one screen.
 */
function mapSafetyOption(option: SafetyOption): {
  comfortLevel: "FULL" | "MOSTLY" | "LOW";
  wouldDineAgain: boolean | null;
} {
  switch (option) {
    case "comfortable":
      return { comfortLevel: "FULL", wouldDineAgain: true };
    case "okay":
      return { comfortLevel: "MOSTLY", wouldDineAgain: null };
    case "report":
      return { comfortLevel: "LOW", wouldDineAgain: false };
  }
}

function formatWhenLabel(startsAtIso: string | null): string | null {
  if (!startsAtIso) return null;
  const dinnerDate = new Date(startsAtIso);
  if (Number.isNaN(dinnerDate.getTime())) return null;

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(dinnerDate).getTime()) / 86_400_000
  );

  if (diffDays === 0) return "Tonight";
  if (diffDays === 1) return "Last night";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return dinnerDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function FeedbackFlow({ dinnerId }: FeedbackFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("rating");
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({});
  const [attendees, setAttendees] = useState<DinnerAttendee[]>([]);
  const [dinnerInfo, setDinnerInfo] = useState<DinnerInfo>({ restaurantName: null, startsAt: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    checkEligibilityAndLoadAttendees();
  }, []);

  const checkEligibilityAndLoadAttendees = async () => {
    try {
      // Check eligibility
      const eligibilityResponse = await fetch(
        `/api/feedback/eligibility?dinnerId=${dinnerId}`
      );
      const eligibilityData = await eligibilityResponse.json();

      if (!eligibilityData.success || !eligibilityData.data.eligible) {
        router.push(`/my-dinners`);
        return;
      }

      // Load dinner attendees for the Connections step, and dinner/restaurant
      // details for the "{Restaurant} · Last night" header on Screen 1.
      const [attendeesResponse, dinnerResponse] = await Promise.all([
        fetch(`/api/dinners/${dinnerId}/attendees`),
        fetch(`/api/dinners/${dinnerId}`),
      ]);
      const attendeesData = await attendeesResponse.json();
      const dinnerData = await dinnerResponse.json();

      if (attendeesData.success && attendeesData.data?.attendees) {
        setAttendees(attendeesData.data.attendees);
      }

      if (dinnerData.success && dinnerData.data) {
        setDinnerInfo({
          restaurantName: dinnerData.data.restaurant?.name || null,
          startsAt: dinnerData.data.startsAt || null,
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading feedback flow:", err);
      setError("Failed to load feedback form");
      setLoading(false);
    }
  };

  const handleClose = () => {
    router.push("/my-dinners");
  };

  const handleRatingSubmit = (rating: number, vibeTags: VibeTag[], comment: string) => {
    setFeedbackData({
      ...feedbackData,
      rating,
      vibeTags,
      notes: comment || null,
      overallSentiment: deriveSentimentFromRating(rating),
    });
    setCurrentStep("safety");
  };

  const handleRatingSkip = () => {
    // "Skip for now" skips the rating/vibe/comment fields entirely, but the
    // Safety Check screen that follows is unconditional - safety isn't an
    // optional question. overallSentiment is still a required column, so
    // default it to NEUTRAL when no rating was given.
    setFeedbackData({ ...feedbackData, overallSentiment: "NEUTRAL" });
    setCurrentStep("safety");
  };

  const proceedAfterSafety = (data: FeedbackData) => {
    if (attendees.length > 0) {
      setCurrentStep("connections");
    } else {
      submitFeedback(data);
    }
  };

  const handleSafetyContinue = (option: SafetyOption) => {
    const { comfortLevel, wouldDineAgain } = mapSafetyOption(option);
    const updated = { ...feedbackData, comfortLevel, wouldDineAgain };
    setFeedbackData(updated);

    if (option === "report") {
      setCurrentStep("report");
    } else {
      proceedAfterSafety(updated);
    }
  };

  const handleReportSubmit = (
    reason: SafetyReportReason,
    details: string,
    reportedUserId: string | null
  ) => {
    const updated = {
      ...feedbackData,
      reportReason: reason,
      reportedUserId,
      notes: details || feedbackData.notes || null,
    };
    setFeedbackData(updated);
    proceedAfterSafety(updated);
  };

  const handleReportBack = () => {
    setCurrentStep("safety");
  };

  const handleConnectionsComplete = (targetUserIds: string[]) => {
    const signals = targetUserIds.map((targetUserId) => ({
      targetUserId,
      wouldDineAgain: true,
    }));
    submitFeedback({ ...feedbackData, personSignals: signals });
  };

  const handleSkipConnections = () => {
    submitFeedback(feedbackData);
  };

  const submitFeedback = async (data: FeedbackData) => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dinnerId,
          overallSentiment: data.overallSentiment,
          comfortLevel: data.comfortLevel,
          wouldDineAgain: data.wouldDineAgain,
          notes: data.notes,
          rating: data.rating,
          vibeTags: data.vibeTags,
          reportReason: data.reportReason,
          reportedUserId: data.reportedUserId,
          personSignals: data.personSignals,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || "Failed to submit feedback");
      }

      setCurrentStep("completion");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <FeedbackFlowSkeleton />;
  }

  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-lg px-4 py-12">
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={handleClose}
              className="mt-4 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 2 + (feedbackData.comfortLevel === "LOW" ? 1 : 0) + (attendees.length > 0 ? 1 : 0);
  const currentStepNumber = {
    rating: 1,
    safety: 2,
    report: 3,
    connections: feedbackData.comfortLevel === "LOW" ? 4 : 3,
    completion: totalSteps + 1,
  }[currentStep];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with close button and progress */}
      {currentStep !== "completion" && (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
            <button
              onClick={handleClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>

            {/* Subtle progress indicator */}
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i < currentStepNumber ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        </header>
      )}

      {/* Step content */}
      <div className="mx-auto max-w-lg px-4 py-8">
        {currentStep === "rating" && (
          <RatingStep
            restaurantName={dinnerInfo.restaurantName}
            whenLabel={formatWhenLabel(dinnerInfo.startsAt)}
            onSubmit={handleRatingSubmit}
            onSkip={handleRatingSkip}
          />
        )}

        {currentStep === "safety" && (
          <SafetyFlagStep onContinue={handleSafetyContinue} />
        )}

        {currentStep === "report" && (
          <ReportStep
            attendees={attendees}
            onSubmit={handleReportSubmit}
            onBack={handleReportBack}
          />
        )}

        {currentStep === "connections" && (
          <PersonSignalsStep
            attendees={attendees}
            onComplete={handleConnectionsComplete}
            onSkip={handleSkipConnections}
            submitting={submitting}
          />
        )}

        {currentStep === "completion" && (
          <CompletionStep onClose={handleClose} />
        )}
      </div>
    </div>
  );
}
