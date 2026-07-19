import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@dinewithme/db";
import { createUserSchema, validate, Role } from "@dinewithme/shared";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../lib/error-handler";
import { requireRole, isErrorResponse } from "@/lib/auth";

// GET /api/users - List all users (Admin only)
export async function GET(request: NextRequest) {
  // Require PLATFORM_ADMIN role
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  try {
    const users = await userRepository.findMany();

    return NextResponse.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/users - Create a new user (Admin only)
export async function POST(request: NextRequest) {
  // Require PLATFORM_ADMIN role
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(createUserSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Call repository layer
    const user = await userRepository.create({
      email: validation.data.email,
      authProviderId: `manual_${Date.now()}`, // Manual creation
    });

    // Emit analytics event
    await track(AnalyticsEvents.USER_CREATED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
