"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplianceDocument, ComplianceDocType } from "@prisma/client";
import { COMPLIANCE_DOC_TYPES, COMPLIANCE_DOC_TYPE_LABELS } from "@/lib/compliance-document";
import {
  deleteComplianceDocument,
  requestComplianceUploadUrl,
  saveComplianceDocument,
} from "../compliance-actions";
import { ConfirmModal } from "../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";

interface ComplianceDocumentsManagerProps {
  restaurantId: string;
  documents: ComplianceDocument[];
}

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Rebuilt to the wireframe's literal pattern (§sec-restaurant-profile):
 * plain bordered rows (filename + status badge + delete) instead of the
 * elevated file-icon-corner tiles, and an inline "Add a Document" form
 * (Document Type select + "Choose File" button, staged-file preview row,
 * helper text + Upload button) instead of a drag-and-drop dropzone. The
 * wireframe doesn't show a rejection-reason callout, a "view"/"replace"
 * icon-button pair, placeholder rows for not-yet-uploaded doc types, or a
 * dedicated empty state - those are dropped; viewing a document is now the
 * filename itself (a plain link to doc.url), and replacing one is just
 * uploading a new file of that type via the same Add a Document form.
 * Upload/verify/delete data wiring is unchanged.
 */
export function ComplianceDocumentsManager({ restaurantId, documents }: ComplianceDocumentsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<ComplianceDocType>("BUSINESS_REGISTRATION");
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setStagedFile(e.target.files?.[0] ?? null);
  };

  const handleRemoveStagedFile = () => {
    setStagedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      toast.success("Document uploaded");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete || deletingId) return;
    const documentId = pendingDelete.id;

    setDeletingId(documentId);
    setError(null);
    const result = await deleteComplianceDocument(documentId, restaurantId);
    setDeletingId(null);

    if (!result.success) {
      const message = result.error || "Failed to delete document";
      setError(message);
      toast.error(message);
      return;
    }
    setPendingDelete(null);
    toast.success("Document deleted");
    router.refresh();
  };

  return (
    <div>
      {documents.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {documents.map((doc) => {
            const badgeClass = doc.verifiedAt ? "badge-green" : doc.rejectedAt ? "badge-red" : "badge-yellow";
            const badgeText = doc.verifiedAt ? "✓ Verified" : doc.rejectedAt ? "Needs a new file" : "⏳ Pending review";

            return (
              <div
                key={doc.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                  padding: "10px 12px", border: "1px solid var(--bdr)", borderRadius: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ color: "var(--t3)", flexShrink: 0 }}>
                    <svg width={16} height={16}><use href="#ic-doc" /></svg>
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13, fontWeight: 600, color: "var(--text)", textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {doc.fileName}
                  </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: 10 }}>{badgeText}</span>
                  <button
                    type="button"
                    className="m-icon-btn"
                    style={{ width: 26, height: 26, color: "var(--red-txt)" }}
                    aria-label={`Delete ${doc.fileName}`}
                    disabled={deletingId === doc.id}
                    onClick={() => setPendingDelete({ id: doc.id, fileName: doc.fileName })}
                  >
                    <svg width={14} height={14}><use href="#ic-trash" /></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={documents.length > 0 ? { borderTop: "1px solid var(--bdr)", paddingTop: 18 } : undefined}>
        <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>Add a Document</div>

        <div className="field-grid-2" style={{ marginBottom: 12 }}>
          <div>
            <label className="field-label">1. Document Type</label>
            <select
              className="field-input"
              style={{ marginTop: 0 }}
              value={docType}
              onChange={(e) => setDocType(e.target.value as ComplianceDocType)}
              disabled={uploading}
            >
              {COMPLIANCE_DOC_TYPES.map((type) => (
                <option key={type} value={type}>{COMPLIANCE_DOC_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">2. File</label>
            <button
              type="button"
              className="btn btn-outline btn-block"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <svg width={14} height={14}><use href="#ic-plus" /></svg> Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </div>
        </div>

        {stagedFile && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              padding: "10px 12px", background: "var(--p-tint)", border: "1px solid var(--p-glow)",
              borderRadius: 12, marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ color: "var(--p)", flexShrink: 0 }}>
                <svg width={14} height={14}><use href="#ic-doc" /></svg>
              </span>
              <span
                style={{
                  fontSize: 12.5, fontWeight: 600, color: "var(--text)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {stagedFile.name}
              </span>
              <span style={{ fontSize: 11, color: "var(--t3)", flexShrink: 0 }}>{formatFileSize(stagedFile.size)}</span>
            </div>
            <button
              type="button"
              className="m-icon-btn"
              style={{ width: 22, height: 22, flexShrink: 0 }}
              title="Remove selected file"
              onClick={handleRemoveStagedFile}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--t3)" }}>PDF, JPG, PNG, or WEBP · max 10MB</span>
          <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!stagedFile || uploading}>
            {uploading ? "Uploading…" : "3. Upload Document"}
          </button>
        </div>

        {error && <p className="field-error" style={{ marginTop: 10 }}>{error}</p>}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        tone="red"
        title="Delete Document"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.fileName}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
