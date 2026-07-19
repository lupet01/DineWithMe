import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/auth";
import { restaurantRepository } from "@dinewithme/db";
import { getStorage, generateStorageKey } from "@dinewithme/storage";
import { z } from "zod";

const signRequestSchema = z.object({
  restaurantId: z.string().cuid(),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|webp|gif)$/),
  type: z.enum(["hero", "gallery"]),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (isErrorResponse(authResult)) {
      return authResult.error;
    }

    const { user } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const validation = signRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid request",
            code: "VALIDATION_ERROR",
            details: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { restaurantId, filename, contentType, type } = validation.data;

    // Verify user owns the restaurant
    const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "You do not have permission to upload media for this restaurant",
            code: "FORBIDDEN",
          },
        },
        { status: 403 }
      );
    }

    // Check gallery limit (max 10 images)
    if (type === "gallery") {
      const restaurant = await restaurantRepository.findByIdWithMedia(restaurantId);
      const galleryCount = restaurant?.media?.filter((m) => m.type === "GALLERY").length || 0;
      
      if (galleryCount >= 10) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: "Maximum of 10 gallery images allowed",
              code: "GALLERY_LIMIT_EXCEEDED",
            },
          },
          { status: 400 }
        );
      }
    }

    // Generate storage key
    const key = generateStorageKey(restaurantId, filename, type);

    // Get signed upload URL
    const storage = getStorage();
    const signature = await storage.getSignedUploadUrl(key, contentType, 3600); // 1 hour expiry

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: signature.url,
        key: signature.key,
        publicUrl: storage.getPublicUrl(key),
      },
    });
  } catch (error) {
    console.error("[Upload Sign] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to generate upload signature",
          code: "INTERNAL_ERROR",
        },
      },
      { status: 500 }
    );
  }
}
