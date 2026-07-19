"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { saveMediaRecord } from "../media-actions";

interface ImageUploadProps {
  restaurantId: string;
  type: "hero" | "gallery";
  currentImage?: string | null;
  onUploadComplete?: () => void;
}

export function ImageUpload({
  restaurantId,
  type,
  currentImage,
  onUploadComplete,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Get signed upload URL
      const signResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId,
          filename: file.name,
          contentType: file.type,
          type,
        }),
      });

      if (!signResponse.ok) {
        const data = await signResponse.json();
        throw new Error(data.error?.message || "Failed to get upload URL");
      }

      const { data: signData } = await signResponse.json();

      // Upload file to storage
      const uploadResponse = await fetch(signData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Save media record
      const saveResult = await saveMediaRecord(
        restaurantId,
        signData.key,
        signData.publicUrl,
        type.toUpperCase() as "HERO" | "GALLERY"
      );

      if (!saveResult.success) {
        throw new Error(saveResult.error);
      }

      // Update preview
      setPreview(signData.publicUrl);

      // Notify parent
      onUploadComplete?.();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt={type === "hero" ? "Hero image" : "Gallery image"}
            className="w-full h-48 object-cover rounded-lg border border-slate-200"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
            <button
              type="button"
              onClick={handleRemove}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-600">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-slate-400" />
              <span className="text-sm text-slate-600">
                Click to upload {type === "hero" ? "hero" : "gallery"} image
              </span>
              <span className="text-xs text-slate-500">
                PNG, JPG, WEBP up to 5MB
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
