import { z } from "zod";

// Seat status enum
export const seatStatusSchema = z.enum([
  "AVAILABLE",
  "HELD",
  "CONFIRMED",
  "ATTENDED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "NO_SHOW",
  "LEFT_EARLY",
]);

// Hold seat schema
export const holdSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
  userId: z.string().cuid("Invalid user ID format"),
  holdDurationMinutes: z.number().int().min(1).max(60).default(15),
});

// Hold seat for dinner schema (by dinnerId)
export const holdSeatForDinnerSchema = z.object({
  dinnerId: z.string().cuid("Invalid dinner ID format"),
  holdDurationMinutes: z.number().int().min(1).max(60).optional().default(10),
});

// Confirm seat schema
export const confirmSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});

// Cancel seat schema
export const cancelSeatSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});

// Check-in schema
export const checkInSchema = z.object({
  seatId: z.string().cuid("Invalid seat ID format"),
});

// Seat ID param schema
export const seatIdSchema = z.object({
  id: z.string().cuid("Invalid seat ID format"),
});

// Infer types from schemas
export type SeatStatus = z.infer<typeof seatStatusSchema>;
export type HoldSeatInput = z.infer<typeof holdSeatSchema>;
export type HoldSeatForDinnerInput = z.infer<typeof holdSeatForDinnerSchema>;
export type ConfirmSeatInput = z.infer<typeof confirmSeatSchema>;
export type CancelSeatInput = z.infer<typeof cancelSeatSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type SeatIdParam = z.infer<typeof seatIdSchema>;
