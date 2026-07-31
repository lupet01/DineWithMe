"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2 } from "lucide-react";
import type { ComplianceDocument, ComplianceDocType } from "@prisma/client";
import { COMPLIANCE_DOC_TYPES, COMPLIANCE_DOC_TYPE_LABELS } from "@/lib/compliance-document";
import {
  deleteComplianceDocument,
  requestComplianceUploadUrl,
  saveComplianceDocument,
} from "../compliance-actions";

interface ComplianceDocumentsManagerProps {
  restaurantId: string;
  documents: ComplianceDocument[];
}

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComplianceDocumentsManager({
  restaurantId,
  documents,
}: ComplianceDocumentsManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<ComplianceDocType>("BUSINESS_REGISTRATION");
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStagedFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!stagedFile) return;
    setError(null);
    setUploading(true);

    try {
      const signResult = await requestComplianceUploadUrl(restaurantId, stagedFile.name, stagedFile.type);
      if (!signResult.success || !signResult.data) {
        throw new Error(signResult.error || "Failed to get upload URL");
      }

      const uploadResponse = await fetch(signResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": stagedFile.type },
        body: stagedFile,
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const saveResult = await saveComplianceDocument(
        restaurantId,
        docType,
        stagedFile.name,
        signResult.data.key,
        signResult.data.publicUrl
      );
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save document record");
      }

      setStagedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (deletingId) return;
    const confirmed = confirm(`Delete "${fileName}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(documentId);
    setError(null);
    const result = await deleteComplianceDocument(documentId, restaurantId);
    setDeletingId(null);

    if (!result.success) {
      setError(result.error || "Failed to delete document");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      {documents.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 20 }}>
          No compliance documents uploaded yet.
        </p>
      ) : (
        <div className="doc-grid" style={{ marginBottom: 20 }}>
          {documents.map((doc) => {
            const isPending = !doc.verifiedAt && !doc.rejectedAt;
            const statusClass = doc.verifiedAt ? "verified" : doc.rejectedAt ? "rejected" : "pending";
            return (
              <div key={doc.id} className="doc-tile">
                <button
                  onClick={() => handleDelete(doc.id, doc.fileName)}
                  disabled={deletingId === doc.id}
                  className="m-icon-btn doc-tile-delete"
                  style={{ color: "var(--red-txt)" }}
                  aria-label={`Delete ${doc.fileName}`}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>

                <div className={`doc-tile-icon ${statusClass}`}>
                  <FileText className="h-4 w-4" />
                </div>

                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-tile-name">
                  {doc.fileName}
                </a>
                <div className="doc-tile-meta">
                  {COMPLIANCE_DOC_TYPE_LABELS[doc.docType]} · {formatDate(doc.createdAt)}
                </div>

                <div style={{ marginTop: 8 }}>
                  {doc.verifiedAt && <span className="badge badge-green">✓ Verified</span>}
                  {doc.rejectedAt && <span className="badge badge-red">Rejected</span>}
                  {isPending && <span className="badge badge-yellow">⏳ Pending review</span>}
                </div>

                {doc.rejectedAt && doc.rejectionReason && (
                  <div className="doc-tile-rejection">
                    &ldquo;{doc.rejectionReason}&rdquo; — upload a corrected document below
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 18 }}>
        <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>
          Add a Document
        </div>
        <div className="field-grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">1. Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as ComplianceDocType)}
              disabled={uploading}
              className="field-input"
            >
              {COMPLIANCE_DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {COMPLIANCE_DOC_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">2. File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              disabled={uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn btn-outline btn-block"
            >
              Choose File
            </button>
          </div>
        </div>

        {stagedFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "10px 12px",
              background: "var(--p-tint)",
              border: "1px solid var(--p-glow)",
              borderRadius: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <FileText className="h-4 w-4" style={{ color: "var(--p)", flexShrink: 0 }} />
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {stagedFile.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--t3)", flexShrink: 0 }}>
                {formatSize(stagedFile.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStagedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="m-icon-btn"
              style={{ width: 22, height: 22, flexShrink: 0 }}
              title="Remove selected file"
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--t3)" }}>PDF, JPG, PNG, or WEBP · max 10MB</span>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!stagedFile || uploading}
            className="btn btn-primary"
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
              </>
            ) : (
              "3. Upload Document"
            )}
          </button>
        </div>
      </div>

      {error && <p className="field-error" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
