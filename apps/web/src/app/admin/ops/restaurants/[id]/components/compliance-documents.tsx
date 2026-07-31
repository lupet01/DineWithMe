"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { ComplianceDocument, ComplianceDocType } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPLIANCE_DOC_TYPES, COMPLIANCE_DOC_TYPE_LABELS } from "@/lib/compliance-document";
import {
  deleteComplianceDocument,
  requestComplianceUploadUrl,
  saveComplianceDocument,
  verifyComplianceDocument,
  rejectComplianceDocument,
} from "../actions";

function docTypeLabel(docType: ComplianceDocType): string {
  return COMPLIANCE_DOC_TYPE_LABELS[docType] ?? docType;
}

interface ComplianceDocumentsProps {
  restaurantId: string;
  documents: ComplianceDocument[];
}

export function ComplianceDocuments({ restaurantId, documents }: ComplianceDocumentsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<ComplianceDocType>("BUSINESS_REGISTRATION");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const signResult = await requestComplianceUploadUrl(restaurantId, file.name, file.type);
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

      const saveResult = await saveComplianceDocument(
        restaurantId,
        docType,
        file.name,
        signResult.data.key,
        signResult.data.publicUrl
      );
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save document record");
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

  const handleVerify = async (documentId: string) => {
    if (actioningId) return;
    setActioningId(documentId);
    setError(null);
    const result = await verifyComplianceDocument(documentId, restaurantId);
    setActioningId(null);

    if (!result.success) {
      setError(result.error || "Failed to verify document");
      return;
    }
    router.refresh();
  };

  const handleReject = async (documentId: string) => {
    if (actioningId) return;
    const reason = prompt("Why is this document being rejected?");
    if (!reason || !reason.trim()) return;

    setActioningId(documentId);
    setError(null);
    const result = await rejectComplianceDocument(documentId, restaurantId, reason);
    setActioningId(null);

    if (!result.success) {
      setError(result.error || "Failed to reject document");
      return;
    }
    router.refresh();
  };

  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Compliance Documents</h2>
      </div>

      {documents.length === 0 ? (
        <p className="mb-4 text-sm text-gray-500">No compliance documents uploaded yet.</p>
      ) : (
        <div className="mb-4 divide-y divide-gray-100">
          {documents.map((doc) => {
            const isPending = !doc.verifiedAt && !doc.rejectedAt;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-sm font-medium text-gray-900 hover:underline"
                      >
                        {doc.fileName}
                      </a>
                      <Badge tone="neutral">{docTypeLabel(doc.docType)}</Badge>
                      {doc.verifiedAt && <Badge tone="success">Verified</Badge>}
                      {doc.rejectedAt && <Badge tone="danger">Rejected</Badge>}
                      {isPending && <Badge tone="warning">Pending</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      Uploaded {formatDate(doc.createdAt)}
                      {doc.verifiedAt ? ` · Verified ${formatDate(doc.verifiedAt)}` : ""}
                    </div>
                    {doc.rejectedAt && doc.rejectionReason && (
                      <div className="mt-0.5 text-xs text-red-600">
                        Rejected: &ldquo;{doc.rejectionReason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleVerify(doc.id)}
                        disabled={actioningId === doc.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleReject(doc.id)}
                        disabled={actioningId === doc.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id, doc.fileName)}
                    disabled={deletingId === doc.id}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    aria-label={`Delete ${doc.fileName}`}
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as ComplianceDocType)}
          disabled={uploading}
          className="rounded-full border border-gray-100 bg-white px-4 py-2 text-sm text-gray-900 shadow-card focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-50"
        >
          {COMPLIANCE_DOC_TYPES.map((type) => (
            <option key={type} value={type}>
              {COMPLIANCE_DOC_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Document
            </>
          )}
        </button>
        <span className="text-xs text-gray-500">PDF, JPG, PNG, or WEBP</span>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}
