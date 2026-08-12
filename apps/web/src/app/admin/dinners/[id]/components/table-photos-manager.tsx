"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "../../../components/confirm-modal";
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

const STATUS_BADGE_CLASS: Record<string, string> = {
  NONE: "badge-slate",
  PENDING: "badge-blue",
  APPROVED: "badge-green",
  REJECTED: "badge-red",
};

const STATUS_LABEL: Record<string, string> = {
  NONE: "Table Photo",
  PENDING: "Pending Review",
  APPROVED: "Listed",
  REJECTED: "Not Approved",
};

export function TablePhotosManager({ dinnerId, photos, isPlatformAdmin }: TablePhotosManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

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

      toast.success("Photo uploaded");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (mediaAssetId: string) => {
    if (actioningId) return;

    setActioningId(mediaAssetId);
    setError(null);
    const result = await deleteTablePhoto(dinnerId, mediaAssetId);
    setActioningId(null);
    if (!result.success) {
      const message = result.error || "Failed to delete photo";
      setError(message);
      toast.error(message);
      return;
    }
    setDeleteTargetId(null);
    toast.success("Photo deleted");
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
    <div className="card card-pad">
      <div className="card-title" style={{ marginBottom: 14 }}>Table Photos</div>

      {photos.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)" }}>No table photos uploaded yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  style={{ height: 128, width: "100%", borderRadius: 12, border: "1px solid var(--bdr)", objectFit: "cover" }}
                />
                {!isPlatformAdmin && (
                  <button
                    onClick={() => setDeleteTargetId(photo.mediaAssetId)}
                    disabled={actioningId === photo.id}
                    className="m-icon-btn"
                    style={{ position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,.92)", color: "var(--red-txt)" }}
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
              <span className={`badge ${STATUS_BADGE_CLASS[photo.promotionStatus] || "badge-slate"}`}>
                {STATUS_LABEL[photo.promotionStatus] || photo.promotionStatus}
              </span>

              {!isPlatformAdmin && (photo.promotionStatus === "NONE" || photo.promotionStatus === "REJECTED") && (
                <button
                  type="button"
                  onClick={() => handlePromote(photo.id)}
                  disabled={actioningId === photo.id}
                  className="btn btn-outline btn-sm btn-block"
                >
                  Promote to Listing
                </button>
              )}

              {isPlatformAdmin && photo.promotionStatus === "PENDING" && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => handleApprove(photo.id)}
                    disabled={actioningId === photo.id}
                    className="btn btn-sm btn-green"
                    style={{ flex: 1 }}
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(photo.id)}
                    disabled={actioningId === photo.id}
                    className="btn btn-sm btn-red"
                    style={{ flex: 1 }}
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
            style={{ display: "none" }}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary btn-sm"
            style={{ marginTop: 16 }}
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                Upload Table Photo
              </>
            )}
          </button>
        </>
      )}

      {error && <p className="field-error" style={{ marginTop: 8 }}>{error}</p>}

      <ConfirmModal
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) return handleDelete(deleteTargetId);
        }}
        tone="red"
        title="Delete this photo?"
        description="This photo is removed from the dinner."
        consequences={["This can't be undone"]}
        confirmLabel="Delete Photo"
      />
    </div>
  );
}
