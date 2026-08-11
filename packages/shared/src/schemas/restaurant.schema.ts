import { z } from "zod";

// Restaurant member role enum
export const restaurantMemberRoleSchema = z.enum(["OWNER", "MANAGER"]);

// Restaurant creation schema. registrationNumber is required - Step 3
// Verification's one required field, an instantly-checkable anti-spam
// signal a real business filing is hard to fake (§16.1). The rest are
// optional attribution/anti-spam signals, not gates.
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
  registrationNumber: z.string().min(1, "Business registration number is required"),
  googleBusinessUrl: z.string().url("Invalid Google Business URL").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  referralSource: z.string().optional(),
});

// Restaurant update schema. Verification fields stay optional here -
// editing never re-requires anything that was already accepted at
// signup, and an existing restaurant that predates these columns can add
// them later via Restaurant Profile's "From Your Application" prompt
// without it ever being a block.
export const updateRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required").optional(),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().optional(),
  contactEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  heroImageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
  registrationNumber: z.string().optional(),
  googleBusinessUrl: z.string().url("Invalid Google Business URL").optional().or(z.literal("")),
  instagramHandle: z.string().optional(),
  facebookUrl: z.string().url("Invalid Facebook URL").optional().or(z.literal("")),
  referralSource: z.string().optional(),
});

// Restaurant ID param schema
export const restaurantIdSchema = z.object({
  id: z.string().cuid("Invalid restaurant ID format"),
});

// Restaurant Profile's Operating Hours card (wireframe §6.2, marked "NEW" -
// no confirmed real-code equivalent before this pass). One row per day;
// "closed" wins over open/close when true regardless of what those two
// fields hold, so a restaurant toggling Closed doesn't need to clear times.
const dayHoursSchema = z.object({
  open: z.string().default(""),
  close: z.string().default(""),
  closed: z.boolean().default(false),
});
export const operatingHoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

// Infer types from schemas
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantIdParam = z.infer<typeof restaurantIdSchema>;
export type RestaurantMemberRole = z.infer<typeof restaurantMemberRoleSchema>;
export type DayHours = z.infer<typeof dayHoursSchema>;
export type OperatingHours = z.infer<typeof operatingHoursSchema>;
export const OPERATING_HOURS_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const OPERATING_HOURS_DAY_LABELS: Record<(typeof OPERATING_HOURS_DAYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};
