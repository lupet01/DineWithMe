"use client";

import { useState } from "react";
import type { RestaurantMedia } from "@prisma/client";
import { ImageUpload } from "./image-upload";
import { X, Loader2 } from "lucide-react";
import { deleteMedia } from "../media-actions";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface GalleryManagerProps {
  restaurantId: string;
  media: RestaurantMedia[];
}

export function GalleryManager({ restaurantId, media }: GalleryManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const galleryImages = media.filter((m) => m.type === "GALLERY");
  const canAddMore = galleryImages.length < 10;

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    const mediaId = pendingDeleteId;
    setDeleting(mediaId);
    try {
      const result = await deleteMedia(mediaId);
      if (result.success) {
        setPendingDeleteId(null);
        toast.success("Photo deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const handleUploadComplete = () => {
    toast.success("Photo uploaded");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">
            Gallery Images
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {galleryImages.length} of 10 images
          </p>
        </div>
      </div>

      {/* Existing Images */}
      {galleryImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((image) => (
            <div key={image.id} className="relative group">
              <img
                src={image.url}
                alt="Gallery image"
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(image.id)}
                  disabled={deleting === image.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting === image.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload New Image */}
      {canAddMore && (
        <div>
          <ImageUpload
            restaurantId={restaurantId}
            type="gallery"
            onUploadComplete={handleUploadComplete}
          />
        </div>
      )}

      {!canAddMore && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Maximum of 10 gallery images reached. Delete an image to add more.
          </p>
        </div>
      )}

      <ConfirmModal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
        tone="red"
        title="Delete Image"
        description="Are you sure you want to delete this image? This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}
