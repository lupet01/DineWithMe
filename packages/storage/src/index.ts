import { R2StorageProvider } from "./r2-provider";
import type { StorageProvider, StorageConfig } from "./types";

export * from "./types";
export { R2StorageProvider } from "./r2-provider";

let storageInstance: StorageProvider | null = null;

export function initializeStorage(config: StorageConfig): StorageProvider {
  storageInstance = new R2StorageProvider(config);
  return storageInstance;
}

export function getStorage(): StorageProvider {
  if (!storageInstance) {
    // Initialize with environment variables
    const config: StorageConfig = {
      endpoint: process.env.R2_ENDPOINT || "",
      region: process.env.R2_REGION || "auto",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      bucket: process.env.R2_BUCKET || "",
      publicUrl: process.env.R2_PUBLIC_URL,
    };

    if (!config.endpoint || !config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      throw new Error("Storage configuration is incomplete. Please check environment variables.");
    }

    storageInstance = new R2StorageProvider(config);
  }

  return storageInstance;
}

// Helper to generate storage keys
export function generateStorageKey(restaurantId: string, filename: string, type: "hero" | "gallery"): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `restaurants/${restaurantId}/${type}/${timestamp}-${sanitized}`;
}
