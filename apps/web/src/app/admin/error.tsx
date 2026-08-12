"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/*
 * Route-level error boundary for every /admin page. Rendered inside
 * AdminShell's `.dine-admin` container, so it can use the shared design-
 * system classes (.card / .card-pad / .btn / .btn-primary) and tokens.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging; Next.js already strips the message
    // from `error` in production, leaving only `digest` to correlate with
    // server logs.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
        padding: "24px 0",
      }}
    >
      <div
        className="card card-pad"
        style={{ maxWidth: 420, width: "100%", textAlign: "center" }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "var(--red-bg)",
            color: "var(--red-txt)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="pg-title" style={{ marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p className="pg-sub" style={{ marginTop: 0, marginBottom: 20, lineHeight: 1.5 }}>
          Sorry — something broke while loading this page. You can try again, and
          if it keeps happening, please let us know.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
        {error.digest && (
          <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 16 }}>
            Reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
