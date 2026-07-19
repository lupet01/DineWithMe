"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SentimentStep } from "./sentiment-step";
import { ComfortStep } from "./comfort-step";
import { SafetyFlagStep } from "./safety-flag-step";
import { PersonSignalsStep } from "./person-signals-step";
import { CompletionStep } from "./completion-step";
import { FeedbackFlowSkeleton } from "./feedback-flow-skeleton";
import { X } from "lucide-react";

interface FeedbackFlowProps {
  dinnerId: string;
}

type Step = "sentiment" | "comfort" | "safety" | "person-signals" | "completion";

interface FeedbackData {
  overallSentiment?: "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE";
  comfortLevel?: "FULL" | "MOSTLY" | "LOW";
  wouldDineAgain?: boolean | null;
  notes?: string | null;
  personSignals?: Array<{
    targetUserId: string;
    wouldDineAgain: boolean;
  }>;
}

interface DinnerAttendee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export function FeedbackFlow({ dinnerId }: FeedbackFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("sentiment");
  const [feedbackData, setFeedbackData] = useState<FeedbackData>({});
  const [attendees, setAttendees] = useState<DinnerAttendee[]>([]);
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

      // Load dinner attendees for person signals step
      const attendeesResponse = await fetch(`/api/dinners/${dinnerId}/attendees`);
      const attendeesData = await attendeesResponse.json();

      if (attendeesData.success && attendeesData.data?.attendees) {
        setAttendees(attendeesData.data.attendees);
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

  const handleSentimentSelect = (sentiment: "GREAT" | "GOOD" | "NEUTRAL" | "UNCOMFORTABLE") => {
    setFeedbackData({ ...feedbackData, overallSentiment: sentiment });
    setCurrentStep("comfort");
  };

  const handleComfortSelect = (comfort: "FULL" | "MOSTLY" | "LOW") => {
    setFeedbackData({ ...feedbackData, comfortLevel: comfort });
    
    // If comfort is LOW, show safety flag step
    if (comfort === "LOW") {
      setCurrentStep("safety");
    } else if (attendees.length > 0) {
      setCurrentStep("person-signals");
    } else {
      submitFeedback({ ...feedbackData, comfortLevel: comfort });
    }
  };

  const handleSafetyFlagComplete = (wouldDineAgain: boolean | null, notes: string | null) => {
    setFeedbackData({ 
      ...feedbackData, 
      wouldDineAgain, 
      notes 
    });
    
    if (attendees.length > 0) {
      setCurrentStep("person-signals");
    } else {
      submitFeedback({ ...feedbackData, wouldDineAgain, notes });
    }
  };

  const handlePersonSignalsComplete = (signals: Array<{ targetUserId: string; wouldDineAgain: boolean }>) => {
    submitFeedback({ ...feedbackData, personSignals: signals });
  };

  const handleSkipPersonSignals = () => {
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
    sentiment: 1,
    comfort: 2,
    safety: 3,
    "person-signals": feedbackData.comfortLevel === "LOW" ? 4 : 3,
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
        {currentStep === "sentiment" && (
          <SentimentStep onSelect={handleSentimentSelect} />
        )}
        
        {currentStep === "comfort" && (
          <ComfortStep onSelect={handleComfortSelect} />
        )}
        
        {currentStep === "safety" && (
          <SafetyFlagStep onComplete={handleSafetyFlagComplete} />
        )}
        
        {currentStep === "person-signals" && (
          <PersonSignalsStep
            attendees={attendees}
            onComplete={handlePersonSignalsComplete}
            onSkip={handleSkipPersonSignals}
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
