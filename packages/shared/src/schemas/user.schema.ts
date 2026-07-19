import { z } from "zod";

// User creation schema
export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// User update schema
export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
});

// User ID param schema
export const userIdSchema = z.object({
  id: z.string().cuid("Invalid user ID format"),
});

// Infer types from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserIdParam = z.infer<typeof userIdSchema>;
