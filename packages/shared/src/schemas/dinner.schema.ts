import { z } from "zod";

// Dinner status enum
export const dinnerStatusSchema = z.enum([
  "DRAFT",
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
]);

// Dinner creation schema
export const createDinnerSchema = z.object({
  restaurantId: z.string().cuid("Invalid restaurant ID format"),
  startsAt: z.coerce.date().refine((date) => date > new Date(), {
    message: "Start time must be in the future",
  }),
  endsAt: z.coerce.date(),
  theme: z.string().min(1, "Theme is required").optional(),
  description: z.string().optional(),
  // Matches the live create/update rule enforced in the dinner actions
  // (2-20). Previously 1-100 here, which silently disagreed with the
  // shipping validation — a trap for anyone who adopted this schema.
  seatCount: z.number().int().min(2, "Must have at least 2 seats").max(20, "Maximum 20 seats"),
}).refine((data) => data.endsAt > data.startsAt, {
  message: "End time must be after start time",
  path: ["endsAt"],
});

// Dinner update schema
export const updateDinnerSchema = z.object({
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  theme: z.string().min(1, "Theme is required").optional(),
  description: z.string().optional(),
  seatCount: z.number().int().min(2).max(20).optional(),
  status: dinnerStatusSchema.optional(),
}).refine((data) => {
  if (data.startsAt && data.endsAt) {
    return data.endsAt > data.startsAt;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endsAt"],
});

// Dinner ID param schema
export const dinnerIdSchema = z.object({
  id: z.string().cuid("Invalid dinner ID format"),
});

// Dinner status update schema
export const updateDinnerStatusSchema = z.object({
  status: dinnerStatusSchema,
});

// Infer types from schemas
export type CreateDinnerInput = z.infer<typeof createDinnerSchema>;
export type UpdateDinnerInput = z.infer<typeof updateDinnerSchema>;
export type DinnerIdParam = z.infer<typeof dinnerIdSchema>;
export type DinnerStatus = z.infer<typeof dinnerStatusSchema>;
export type UpdateDinnerStatusInput = z.infer<typeof updateDinnerStatusSchema>;
