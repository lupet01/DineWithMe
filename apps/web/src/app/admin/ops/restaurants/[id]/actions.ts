"use server";

import { auth } from "@clerk/nextjs/server";
import {
  userRepository,
  restaurantRepository,
  complianceDocumentRepository,
} from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { getStorage } from "@dinewithme/storage";
import { revalidatePath } from "next/cache";
import type { ComplianceDocType } from "@prisma/client";

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Prisma generates ComplianceDocType as a value-level enum too, but the rest
// of this codebase (see restaurant.repository.ts's updateStatus) prefers
// plain string-literal unions over importing generated enums as values, so
// this stays consistent with that convention.
const COMPLIANCE_DOC_TYPES: ComplianceDocType[] = [
  "BUSINESS_REGISTRATION",
  "FOOD_SAFETY_CERTIFICATE",
  "LIQUOR_LICENSE",
  "OTHER",
];

// PDFs and scanned images cover the realistic set of compliance document
// formats (business registration certificates, food safety certs, liquor
// licenses) - mirrors the image-only allowlist in /api/uploads/sign but
// widened to include application/pdf.
const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

async function requirePlatformAdmin() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { error: "Unauthorized" as const };
  }
  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser || dbUser.role !== Role.PLATFORM_ADMIN) {
    return { error: "Only platform admins can manage compliance documents" as const };
  }
  return { dbUser };
}

/**
 * Build a storage key for a compliance document upload and mint a signed
 * PUT URL for it. Deliberately does not go through /api/uploads/sign (that
 * route's schema is hard-coded to type: "hero" | "gallery" and image
 * content-types only) - this calls the same underlying @dinewithme/storage
 * primitives directly instead of widening that route for a document type
 * it was never meant to handle.
 */
export async function requestComplianceUploadUrl(
  restaurantId: string,
  filename: string,
  contentType: string
): Promise<ActionResult<{ uploadUrl: string; key: string; publicUrl: string }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported file type. Upload a PDF, JPG, PNG, or WEBP." };
  }

  try {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `restaurants/${restaurantId}/compliance/${timestamp}-${sanitized}`;

    const storage = getStorage();
    const signature = await storage.getSignedUploadUrl(key, contentType, 3600);

    return {
      success: true,
      data: {
        uploadUrl: signature.url,
        key: signature.key,
        publicUrl: storage.getPublicUrl(key),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to prepare upload",
    };
  }
}

/**
 * Persist a compliance document record after the file has already been
 * PUT to storage via the signed URL from requestComplianceUploadUrl.
 */
export async function saveComplianceDocument(
  restaurantId: string,
  docType: ComplianceDocType,
  fileName: string,
  key: string,
  url: string
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!COMPLIANCE_DOC_TYPES.includes(docType)) {
    return { success: false, error: "Invalid document type" };
  }

  try {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return { success: false, error: "Restaurant not found" };
    }

    const document = await complianceDocumentRepository.create({
      restaurant: { connect: { id: restaurantId } },
      docType,
      fileName,
      key,
      url,
    });

    revalidatePath(`/admin/ops/restaurants/${restaurantId}`);

    return { success: true, data: { id: document.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save document",
    };
  }
}

/**
 * Delete a compliance document (both the DB record and the stored file).
 */
export async function deleteComplianceDocument(
  documentId: string,
  restaurantId: string
): Promise<ActionResult> {
  const authResult = await requirePlatformAdmin();
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  try {
    const document = await complianceDocumentRepository.findById(documentId);
    if (!document || document.restaurantId !== restaurantId) {
      return { success: false, error: "Document not found" };
    }

    const storage = getStorage();
    await storage.deleteObject(document.key);
    await complianceDocumentRepository.delete(documentId);

    revalidatePath(`/admin/ops/restaurants/${restaurantId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}
