import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@dinewithme/db";
import { updateUserSchema, userIdSchema, validate, Role } from "@dinewithme/shared";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { handleApiError } from "../../lib/error-handler";
import { requireAuth, requireRole, isErrorResponse } from "@/lib/auth";

interface RouteContext {
  params: { id: string };
}

// GET /api/users/:id - Get user by ID (Authenticated users can view)
export async function GET(request: NextRequest, context: RouteContext) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user: currentUser } = authResult;

  try {
    const { id } = context.params;

    // Validate ID
    const validation = validate(userIdSchema, { id });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    const user = await userRepository.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Users can only view their own profile unless they're admin
    if (
      user.id !== currentUser.id &&
      currentUser.role !== Role.PLATFORM_ADMIN
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Access denied",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/users/:id - Update user (Users can update own profile, admins can update any)
export async function PATCH(request: NextRequest, context: RouteContext) {
  // Require authentication
  const authResult = await requireAuth(request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  const { user: currentUser } = authResult;

  try {
    const { id } = context.params;
    const body = await request.json();

    // Validate ID
    const idValidation = validate(userIdSchema, { id });
    if (!idValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: idValidation.error,
        },
        { status: 400 }
      );
    }

    // Validate update data
    const dataValidation = validate(updateUserSchema, body);
    if (!dataValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: dataValidation.error,
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Users can only update their own profile unless they're admin
    if (
      existingUser.id !== currentUser.id &&
      currentUser.role !== Role.PLATFORM_ADMIN
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Access denied",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // Update user
    const user = await userRepository.update(id, dataValidation.data);

    // Emit analytics event
    await track(AnalyticsEvents.USER_UPDATED, {
      userId: user.id,
      fields: Object.keys(dataValidation.data),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/users/:id - Soft-delete user (Admin only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  // Require PLATFORM_ADMIN role
  const authResult = await requireRole([Role.PLATFORM_ADMIN], request);
  if (isErrorResponse(authResult)) {
    return authResult.error;
  }

  try {
    const { id } = context.params;

    // Validate ID
    const validation = validate(userIdSchema, { id });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await userRepository.findById(id);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "User not found",
            code: "USER_NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Soft-delete: a hard delete cascades onto PaymentIntent/AuditLog/SafetyReport.reporter,
    // destroying financial, audit, and safety-report history tied to this user
    await userRepository.update(id, { status: "deleted" });

    // Emit analytics event
    await track(AnalyticsEvents.USER_DELETED, {
      userId: id,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "User deleted successfully",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
