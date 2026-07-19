import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function handleApiError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "A record with this value already exists",
            code: "DUPLICATE_ENTRY",
            details: error.meta,
          },
        },
        { status: 409 }
      );
    }

    // Record not found
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Record not found",
            code: "NOT_FOUND",
          },
        },
        { status: 404 }
      );
    }

    // Foreign key constraint violation
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid reference to related record",
            code: "INVALID_REFERENCE",
          },
        },
        { status: 400 }
      );
    }
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid data provided",
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 }
    );
  }

  // Generic error
  return NextResponse.json(
    {
      success: false,
      error: {
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
    },
    { status: 500 }
  );
}
