import { z } from "zod";

// Feedback sentiment enum
export const feedbackSentimentSchema = z.enum([
  "GREAT",
  "GOOD",
  "NEUTRAL",
  "UNCOMFORTABLE",
]);

// Comfort level enum
export const comfortLevelSchema = z.enum([
  "FULL",
  "MOSTLY",
  "LOW",
]);

// 1-5 star rating from the Post-Dinner "How Was It?" screen
export const feedbackRatingSchema = z.number().int().min(1).max(5);

// Vibe tag chips from the same screen ("How was the vibe?" multi-select).
// Stored as a plain Postgres string array, but validated server-side
// against this fixed set so free-form values can't sneak into the column.
export const vibeTagSchema = z.enum([
  "GREAT_CONVERSATIONS",
  "GOOD_FOOD",
  "WELCOMING",
  "INTIMATE",
  "ENERGETIC",
  "RELAXED",
]);

// Reason category from the Post-Dinner "Report Something" screen. Mirrors
// the SafetyReportReason enum in prisma/schema.prisma.
export const safetyReportReasonSchema = z.enum([
  "MADE_UNCOMFORTABLE",
  "INAPPROPRIATE_BEHAVIOR",
  "SAFETY_CONCERN",
  "OTHER",
]);

// Create feedback schema
export const createFeedbackSchema = z.object({
  dinnerId: z.string().cuid("Invalid dinner ID format"),
  targetUserId: z.string().cuid("Invalid user ID format").nullable().optional(),
  overallSentiment: feedbackSentimentSchema,
  comfortLevel: comfortLevelSchema,
  wouldDineAgain: z.boolean().nullable().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").nullable().optional(),
  rating: feedbackRatingSchema.nullable().optional(),
  vibeTags: z.array(vibeTagSchema).max(6, "Too many vibe tags").optional(),
  reportReason: safetyReportReasonSchema.nullable().optional(),
});

// Update feedback schema
export const updateFeedbackSchema = z.object({
  overallSentiment: feedbackSentimentSchema.optional(),
  comfortLevel: comfortLevelSchema.optional(),
  wouldDineAgain: z.boolean().nullable().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").nullable().optional(),
});

// Feedback ID param schema
export const feedbackIdSchema = z.object({
  id: z.string().cuid("Invalid feedback ID format"),
});

// Infer types from schemas
export type FeedbackSentiment = z.infer<typeof feedbackSentimentSchema>;
export type ComfortLevel = z.infer<typeof comfortLevelSchema>;
export type VibeTag = z.infer<typeof vibeTagSchema>;
export type SafetyReportReason = z.infer<typeof safetyReportReasonSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type FeedbackIdParam = z.infer<typeof feedbackIdSchema>;
