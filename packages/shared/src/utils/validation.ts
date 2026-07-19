import { z } from "zod";
import type { ApiError } from "../types";

// Validate data against a Zod schema
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ApiError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: result.error.format(),
    },
  };
}

// Async validation helper
export async function validateAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  return schema.parseAsync(data);
}
