import { z } from "zod";

// Restaurant member role enum
export const restaurantMemberRoleSchema = z.enum(["OWNER", "MANAGER"]);

// Restaurant creation schema
export const createRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  heroImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

// Restaurant update schema
export const updateRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").optional(),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  heroImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

// Restaurant ID param schema
export const restaurantIdSchema = z.object({
  id: z.string().cuid("Invalid restaurant ID format"),
});

// Infer types from schemas
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantIdParam = z.infer<typeof restaurantIdSchema>;
export type RestaurantMemberRole = z.infer<typeof restaurantMemberRoleSchema>;
