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

// Create feedback schema
export const createFeedbackSchema = z.object({
  dinnerId: z.string().cuid("Invalid dinner ID format"),
  targetUserId: z.string().cuid("Invalid user ID format").nullable().optional(),
  overallSentiment: feedbackSentimentSchema,
  comfortLevel: comfortLevelSchema,
  wouldDineAgain: z.boolean().nullable().optional(),
  notes: z.string().max(1000, "Notes must be 1000 characters or less").nullable().optional(),
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
export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type FeedbackIdParam = z.infer<typeof feedbackIdSchema>;
