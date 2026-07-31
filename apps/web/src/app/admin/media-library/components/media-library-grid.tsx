"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Trash2, Upload } from "lucide-react";
import type { RestaurantGalleryItemWithAsset } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { requestMediaUploadUrl, saveMediaAsset, setFeaturedPhoto, deleteMediaAsset } from "../actions";

interface MediaLibraryGridProps {
  restaurantId: string;
  items: RestaurantGalleryItemWithAsset[];
}

export function MediaLibraryGrid({ restaurantId, items }: MediaLibraryGridProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const featured = items.find((item) => item.role === "FEATURED");
  const rest = items.filter((item) => item.id !== featured?.id);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const signResult = await requestMediaUploadUrl(restaurantId, file.name, file.type);
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

      const saveResult = await saveMediaAsset(restaurantId, signResult.data.key, signResult.data.publicUrl);
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

  const handleSetFeatured = async (itemId: string) => {
    if (actioningId) return;
    setActioningId(itemId);
    setError(null);
    const result = await setFeaturedPhoto(restaurantId, itemId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to set featured photo");
      return;
    }
    router.refresh();
  };

  const handleDelete = async (mediaAssetId: string) => {
    if (actioningId) return;
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    setActioningId(mediaAssetId);
    setError(null);
    const result = await deleteMediaAsset(mediaAssetId, restaurantId);
    setActioningId(null);
    if (!result.success) {
      setError(result.error || "Failed to delete photo");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {featured && (
        <Card padding="none" className="relative overflow-hidden">
          <img
            src={featured.mediaAsset.url}
            alt={featured.mediaAsset.caption || "Featured photo"}
            className="h-64 w-full object-cover"
          />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
            <Star className="h-3 w-3 fill-current" />
            Featured · Profile Cover
          </span>
          <button
            onClick={() => handleDelete(featured.mediaAsset.id)}
            disabled={actioningId === featured.mediaAsset.id}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-red-600 hover:bg-white disabled:opacity-50"
            aria-label="Delete featured photo"
          >
            {actioningId === featured.mediaAsset.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </Card>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rest.map((item) => (
            <div key={item.id} className="group relative">
              <button
                type="button"
                onClick={() => handleSetFeatured(item.id)}
                disabled={actioningId === item.id}
                className="block w-full"
                title="Set as featured cover photo"
              >
                <img
                  src={item.mediaAsset.url}
                  alt={item.mediaAsset.caption || "Restaurant photo"}
                  className="h-32 w-full rounded-xl border border-gray-100 object-cover transition-opacity group-hover:opacity-80"
                />
              </button>
              <button
                onClick={() => handleDelete(item.mediaAsset.id)}
                disabled={actioningId === item.mediaAsset.id}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white disabled:opacity-50"
                aria-label="Delete photo"
              >
                {actioningId === item.mediaAsset.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

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
        className="flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload Photo
          </>
        )}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
