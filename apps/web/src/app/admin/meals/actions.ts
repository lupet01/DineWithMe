"use server";

import { revalidatePath } from "next/cache";
import { mealRepository, restaurantRepository, menuItemRepository } from "@dinewithme/db";
import { requireAuthUser } from "@/lib/auth/server";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage meals for this restaurant" as const };
  }
  return { user };
}

async function requireMealOwner(mealId: string) {
  const meal = await mealRepository.findById(mealId);
  if (!meal) {
    return { error: "Meal not found" as const, meal: null };
  }
  const authResult = await requireOwner(meal.restaurantId);
  if ("error" in authResult) {
    return { error: authResult.error, meal: null };
  }
  return { error: null, meal };
}

export async function createMeal(
  restaurantId: string,
  name: string
): Promise<ActionResult<{ mealId: string }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!name.trim()) {
    return { success: false, error: "Meal name is required" };
  }

  try {
    const meal = await mealRepository.create({
      restaurant: { connect: { id: restaurantId } },
      name: name.trim(),
      suggestedPricePerSeatCents: 0,
      isActive: true,
    });

    revalidatePath("/admin/meals");
    return { success: true, data: { mealId: meal.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create meal",
    };
  }
}

export async function updateMeal(
  mealId: string,
  input: { name: string; suggestedPricePerSeatCents: number; isActive: boolean }
): Promise<ActionResult> {
  const { error: authError } = await requireMealOwner(mealId);
  if (authError) {
    return { success: false, error: authError };
  }

  if (!input.name.trim()) {
    return { success: false, error: "Meal name is required" };
  }
  if (!Number.isInteger(input.suggestedPricePerSeatCents) || input.suggestedPricePerSeatCents < 0) {
    return { success: false, error: "Price must be a non-negative amount" };
  }

  try {
    await mealRepository.update(mealId, {
      name: input.name.trim(),
      suggestedPricePerSeatCents: input.suggestedPricePerSeatCents,
      isActive: input.isActive,
    });

    revalidatePath("/admin/meals");
    revalidatePath(`/admin/meals/${mealId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update meal",
    };
  }
}

export async function deleteMeal(mealId: string): Promise<ActionResult> {
  const { error: authError } = await requireMealOwner(mealId);
  if (authError) {
    return { success: false, error: authError };
  }

  try {
    await mealRepository.delete(mealId);
    revalidatePath("/admin/meals");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete meal",
    };
  }
}

export async function addCourseOption(
  mealId: string,
  mealCourseId: string,
  menuItemId: string
): Promise<ActionResult> {
  const { error: authError, meal } = await requireMealOwner(mealId);
  if (authError || !meal) {
    return { success: false, error: authError || "Meal not found" };
  }

  try {
    const course = await mealRepository.findCourseById(mealCourseId);
    if (!course || course.mealId !== mealId) {
      return { success: false, error: "Course not found" };
    }
    if (course.options.length >= 3) {
      return { success: false, error: "A course can have at most 3 dish options" };
    }

    const menuItem = await menuItemRepository.findById(menuItemId);
    if (!menuItem || menuItem.restaurantId !== meal.restaurantId) {
      return { success: false, error: "Dish not found" };
    }
    if (menuItem.course !== course.courseType) {
      return { success: false, error: `That dish isn't in the ${course.courseType} course` };
    }

    await mealRepository.addCourseOption(mealCourseId, menuItemId);
    revalidatePath(`/admin/meals/${mealId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add dish option",
    };
  }
}

export async function removeCourseOption(mealId: string, optionId: string): Promise<ActionResult> {
  const { error: authError } = await requireMealOwner(mealId);
  if (authError) {
    return { success: false, error: authError };
  }

  try {
    // Re-scope the child to the authorized parent: the option must belong to
    // a course of THIS meal. Without this, meal ownership alone would let an
    // owner delete an option on another restaurant's meal by id.
    const ownerMealId = await mealRepository.findMealIdForOption(optionId);
    if (ownerMealId !== mealId) {
      return { success: false, error: "Dish option not found" };
    }

    await mealRepository.removeCourseOption(optionId);
    revalidatePath(`/admin/meals/${mealId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove dish option",
    };
  }
}
