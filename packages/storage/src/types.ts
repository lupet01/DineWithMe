export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl?: string;
}

export interface UploadSignature {
  url: string;
  key: string;
  fields?: Record<string, string>;
}

export interface StorageProvider {
  getSignedUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<UploadSignature>;
  getSignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
