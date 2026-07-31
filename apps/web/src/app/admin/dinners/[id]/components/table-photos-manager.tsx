"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, Upload, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  requestTablePhotoUploadUrl,
  saveTablePhoto,
  deleteTablePhoto,
  requestListingPromotion,
} from "../../table-photos-actions";
import { approvePhotoPromotion, rejectPhotoPromotion } from "../media-moderation-actions";

interface TablePhoto {
  id: string;
  mediaAssetId: string;
  url: string;
  promotionStatus: string;
}

interface TablePhotosManagerProps {
  dinnerId: string;
  photos: TablePhoto[];
  isPlatformAdmin: boolean;
}

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "danger"> = {
  NONE: "neutral",
  PENDING: "primary",
  APPROVED: "success",
  REJECTED: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  NONE: "Table Photo",
  PENDING: "Pending Review",
  APPROVED: "Listed",
  REJECTED: "Not Approved",
};

export function TablePhotosManager({ dinnerId, photos, isPlatformAdmin }: TablePhotosManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const signResult = await requestTablePhotoUploadUrl(dinnerId, file.name, file.type);
      if (!signResult.success || !signResult.data) {
        throw new Error(signResult.error || "Failed to get upload URL");
      }

      const uploadResponse = await fetch(signResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const saveResult = await saveTablePhoto(dinnerId, signResult.data.key, signResult.data.publicUrl);
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save photo");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (mediaAssetId: string) => {
    if (actioningId) return;
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    setActioningId(mediaAssetId);
    setError(null);
    const result = await deleteTablePhoto(dinnerId, mediaAssetId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to delete photo");
      return;
    }
    router.refresh();
  };

  const handlePromote = async (photoId: string) => {
    if (actioningId) return;
    setActioningId(photoId);
    setError(null);
    const result = await requestListingPromotion(dinnerId, photoId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to request promotion");
      return;
    }
    router.refresh();
  };

  const handleApprove = async (photoId: string) => {
    if (actioningId) return;
    setActioningId(photoId);
    setError(null);
    const result = await approvePhotoPromotion(photoId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to approve photo");
      return;
    }
    router.refresh();
  };

  const handleReject = async (photoId: string) => {
    if (actioningId) return;
    setActioningId(photoId);
    setError(null);
    const result = await rejectPhotoPromotion(photoId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to reject photo");
      return;
    }
    router.refresh();
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-lg font-semibold text-gray-900">Table Photos</h2>
      </div>
      <div className="p-6">
        {photos.length === 0 ? (
          <p className="text-sm text-gray-500">No table photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-2">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className="h-32 w-full rounded-xl border border-gray-100 object-cover"
                  />
                  {!isPlatformAdmin && (
                    <button
                      onClick={() => handleDelete(photo.mediaAssetId)}
                      disabled={actioningId === photo.id}
                      className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white disabled:opacity-50"
                      aria-label="Delete photo"
                    >
                      {actioningId === photo.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <Badge tone={STATUS_TONE[photo.promotionStatus] || "neutral"}>
                  {STATUS_LABEL[photo.promotionStatus] || photo.promotionStatus}
                </Badge>

                {!isPlatformAdmin && (photo.promotionStatus === "NONE" || photo.promotionStatus === "REJECTED") && (
                  <button
                    type="button"
                    onClick={() => handlePromote(photo.id)}
                    disabled={actioningId === photo.id}
                    className="w-full rounded-full border border-primary-500 px-3 py-1.5 text-xs font-semibold text-primary-500 hover:bg-primary-50 disabled:opacity-50"
                  >
                    Promote to Listing
                  </button>
                )}

                {isPlatformAdmin && photo.promotionStatus === "PENDING" && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApprove(photo.id)}
                      disabled={actioningId === photo.id}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-green-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(photo.id)}
                      disabled={actioningId === photo.id}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full border border-red-300 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!isPlatformAdmin && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Table Photo
                </>
              )}
            </button>
          </>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </Card>
  );
}
