"use server";

import { restaurantRepository, complianceDocumentRepository } from "@dinewithme/db";
import { actionFailure, type ActionResult } from "@dinewithme/shared";
import { getStorage } from "@dinewithme/storage";
import { requireAuthUser } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import type { ComplianceDocType } from "@prisma/client";
import {
  COMPLIANCE_DOC_TYPES,
  ALLOWED_COMPLIANCE_CONTENT_TYPES,
} from "@/lib/compliance-document";

/**
 * Restaurant-owner-facing compliance document actions. Deliberately a
 * separate auth boundary from the platform-ops actions in
 * admin/ops/restaurants/[id]/actions.ts (requireAuthUser + isUserOwner here,
 * vs requirePlatformAdmin there) - the two portals should never share an
 * auth-check function even though they share the pure constants above.
 */
async function requireOwner(restaurantId: string) {
  const user = await requireAuthUser();
  const isOwner = await restaurantRepository.isUserOwner(restaurantId, user.id);
  if (!isOwner) {
    return { error: "You do not have permission to manage documents for this restaurant" as const };
  }
  return { user };
}

export async function requestComplianceUploadUrl(
  restaurantId: string,
  filename: string,
  contentType: string
): Promise<ActionResult<{ uploadUrl: string; key: string; publicUrl: string }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!ALLOWED_COMPLIANCE_CONTENT_TYPES.includes(contentType)) {
    return { success: false, error: "Unsupported file type. Upload a PDF, JPG, PNG, or WEBP." };
  }

  try {
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
    return actionFailure(error, "Failed to prepare upload");
  }
}

/**
 * Persist a compliance document record after the file has already been PUT
 * to storage via the signed URL from requestComplianceUploadUrl. Uploading
 * again after a rejection is this same flow - there's no separate
 * "resubmit" action, the new row just appears alongside the rejected one.
 */
export async function saveComplianceDocument(
  restaurantId: string,
  docType: ComplianceDocType,
  fileName: string,
  key: string,
  url: string
): Promise<ActionResult<{ id: string }>> {
  const authResult = await requireOwner(restaurantId);
  if ("error" in authResult) {
    return { success: false, error: authResult.error };
  }

  if (!COMPLIANCE_DOC_TYPES.includes(docType)) {
    return { success: false, error: "Invalid document type" };
  }

  try {
    const document = await complianceDocumentRepository.create({
      restaurant: { connect: { id: restaurantId } },
      docType,
      fileName,
      key,
      url,
    });

    revalidatePath("/admin/restaurant");

    return { success: true, data: { id: document.id } };
  } catch (error) {
    return actionFailure(error, "Failed to save document");
  }
}

export async function deleteComplianceDocument(
  documentId: string,
  restaurantId: string
): Promise<ActionResult> {
  const authResult = await requireOwner(restaurantId);
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

    revalidatePath("/admin/restaurant");

    return { success: true };
  } catch (error) {
    return actionFailure(error, "Failed to delete document");
  }
}
