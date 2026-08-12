"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, X } from "lucide-react";

/**
 * In-house toast system — no external dependency (no sonner).
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Saved");
 *   toast.error("Something went wrong");
 *
 * The provider is mounted once in the root layout, so useToast() works
 * anywhere in the app. Styles are fully self-contained (inline styles +
 * one injected <style> block for keyframes) so the toast does NOT depend
 * on `.dine-admin` being an ancestor — colors mirror the admin tokens but
 * are hard-coded here on purpose.
 */

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

interface ToastContextValue {
  toast: ToastApi;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE = 3;

// Colors mirror admin-design-system.css tokens but are inlined so this
// works outside `.dine-admin`.
const COLORS = {
  card: "#ffffff",
  text: "#1c1c1e",
  subtext: "#6b7280",
  border: "rgba(0, 0, 0, 0.07)",
  shadow: "0 10px 20px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.06)",
  success: "#16a34a",
  error: "#dc2626",
};

const KEYFRAMES_STYLE_ID = "dwm-toast-keyframes";

const KEYFRAMES = `
@keyframes dwm-toast-in {
  from { opacity: 0; transform: translateY(-8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (max-width: 640px) {
  @keyframes dwm-toast-in {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
}
@media (prefers-reduced-motion: reduce) {
  .dwm-toast { animation: none !important; }
}
`;

function useInjectKeyframes() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(KEYFRAMES_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = KEYFRAMES_STYLE_ID;
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    // Intentionally not removed on unmount — the provider lives for the
    // whole app session and other mounts may share the sheet.
  }, []);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useInjectKeyframes();

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idRef.current;
    setToasts((prev) => {
      const next = [...prev, { id, message, variant }];
      // Keep only the most recent MAX_VISIBLE toasts.
      return next.slice(-MAX_VISIBLE);
    });
  }, []);

  const toast = useMemo<ToastApi>(
    () => ({
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
    }),
    [push]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <ToastViewport toasts={toasts} onDismiss={dismiss} />,
          document.body
        )}
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
        // Desktop: top-right. Mobile: bottom, full-width (see media handling
        // via inline responsive values is not possible, so we lean on the
        // container respecting both insets — top-right on desktop reads fine
        // and the CSS below flips it on small screens).
        top: 16,
        right: 16,
        left: "auto",
        bottom: "auto",
        maxWidth: "calc(100vw - 32px)",
        width: 360,
      }}
      className="dwm-toast-viewport"
    >
      {/* Responsive override: bottom on mobile. */}
      <style>{`
        @media (max-width: 640px) {
          .dwm-toast-viewport {
            top: auto !important;
            bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
            left: 16px !important;
            right: 16px !important;
            width: auto !important;
          }
        }
      `}</style>
      {toasts.map((t) => (
        <Toast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss]);

  const accent = item.variant === "success" ? COLORS.success : COLORS.error;
  const Icon = item.variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className="dwm-toast"
      role="status"
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: COLORS.card,
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        boxShadow: COLORS.shadow,
        padding: "12px 12px 12px 14px",
        fontSize: 13.5,
        lineHeight: 1.4,
        animation: "dwm-toast-in 200ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Icon
        style={{ width: 18, height: 18, color: accent, flexShrink: 0, marginTop: 1 }}
        aria-hidden="true"
      />
      <span style={{ flex: 1, fontWeight: 500 }}>{item.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(item.id)}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "none",
          padding: 2,
          margin: 0,
          cursor: "pointer",
          color: COLORS.subtext,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          lineHeight: 0,
        }}
      >
        <X style={{ width: 15, height: 15 }} aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
