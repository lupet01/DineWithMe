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

interface ComplianceDocumentsManagerProps {
  restaurantId: string;
  documents: ComplianceDocument[];
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

  const uploadedTypes = new Set(documents.map((d) => d.docType));
  const missingTypes = COMPLIANCE_DOC_TYPES.filter((t) => !uploadedTypes.has(t));

  return (
    <div>
      {documents.length === 0 ? (
        <div className="rp-empty">
          <div className="rp-empty-ico"><svg><use href="#ic-doc" /></svg></div>
          <div className="rp-empty-t">Nothing uploaded yet</div>
          <div className="rp-empty-b">
            Start with your business registration. Most restaurants are cleared within two
            business days.
          </div>
        </div>
      ) : (
        documents.map((doc) => {
          const statusClass = doc.verifiedAt ? "ok" : doc.rejectedAt ? "bad" : "wait";
          return (
            <div key={doc.id} className={`drow ${statusClass}`}>
              <div className="dicon"><svg><use href="#ic-doc" /></svg></div>
              <div className="dmain">
                <div className="dtop">
                  <span className="dtype">{COMPLIANCE_DOC_TYPE_LABELS[doc.docType]}</span>
                  {doc.verifiedAt && (
                    <span className="rp-pill green"><svg><use href="#ic-check" /></svg> Verified</span>
                  )}
                  {doc.rejectedAt && (
                    <span className="rp-pill red"><svg><use href="#ic-alert" /></svg> Needs a new file</span>
                  )}
                  {!doc.verifiedAt && !doc.rejectedAt && (
                    <span className="rp-pill yellow">Pending review</span>
                  )}
                </div>
                <div className="dmeta">
                  {doc.fileName} &middot; {doc.verifiedAt ? `Cleared ${formatDate(doc.verifiedAt)}` : `Uploaded ${formatDate(doc.createdAt)}`}
                </div>
                {doc.rejectedAt && doc.rejectionReason && (
                  <div className="note">
                    <svg><use href="#ic-alert" /></svg>
                    <div style={{ flex: 1 }}>
                      <div className="note-t">Why it was rejected</div>
                      <div className="note-b">{doc.rejectionReason}</div>
                      <button
                        type="button"
                        className="rp-btn rp-btn-o rp-btn-sm"
                        style={{ marginTop: 9 }}
                        onClick={() => {
                          setDocType(doc.docType);
                          fileInputRef.current?.click();
                        }}
                      >
                        <svg><use href="#ic-upload" /></svg> Upload a new file
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="dactions">
                <a className="iconbtn" href={doc.url} target="_blank" rel="noopener noreferrer" aria-label="View document">
                  <svg><use href="#ic-eye" /></svg>
                </a>
                {doc.verifiedAt ? (
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Replace document"
                    onClick={() => {
                      setDocType(doc.docType);
                      fileInputRef.current?.click();
                    }}
                  >
                    <svg><use href="#ic-swap" /></svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="iconbtn danger"
                    aria-label="Delete document"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                  >
                    <svg><use href="#ic-trash" /></svg>
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {missingTypes.map((type) => (
        <div key={type} className="dghost">
          <div className="dicon"><svg><use href="#ic-doc" /></svg></div>
          <div className="dmain">
            <div className="dtop">
              <span className="dtype">{COMPLIANCE_DOC_TYPE_LABELS[type]}</span>
              <span className="rp-pill grey">{type === "OTHER" ? "Optional" : "Not uploaded"}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="dz">
        <div className="dz-inner">
          <div className="dz-ico"><svg><use href="#ic-upload" /></svg></div>
          <div className="dz-t">{documents.length === 0 ? "Add a document" : "Drag a document here"}</div>
          <div className="dz-s">
            {stagedFile ? stagedFile.name : "or choose one from your computer"}
          </div>
          <div className="dz-controls">
            <select
              className="rp-sel"
              aria-label="Document type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as ComplianceDocType)}
              disabled={uploading}
            >
              {COMPLIANCE_DOC_TYPES.map((type) => (
                <option key={type} value={type}>{COMPLIANCE_DOC_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              disabled={uploading}
            />
            {stagedFile ? (
              <button type="button" className="rp-btn rp-btn-p" onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading…" : "Upload document"}
              </button>
            ) : (
              <button type="button" className="rp-btn rp-btn-p" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                Choose file
              </button>
            )}
          </div>
          <div className="dz-note">PDF, JPG, PNG or WEBP &middot; up to 10 MB</div>
        </div>
      </div>

      {error && <p className="field-error" style={{ margin: "8px 16px 0" }}>{error}</p>}
    </div>
  );
}
