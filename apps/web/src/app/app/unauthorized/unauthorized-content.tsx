"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const role = searchParams.get("role");

  const getMessage = () => {
    if (reason === "admin_access_required") {
      return {
        title: "Admin Access Required",
        description:
          "You need to be a Restaurant Admin or Platform Admin to access this area.",
        detail: role ? `Your current role: ${role}` : null,
      };
    }

    return {
      title: "Access Denied",
      description: "You don't have permission to access this page.",
      detail: null,
    };
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            {message.title}
          </h1>
          <p className="text-slate-600 mb-4">{message.description}</p>
          {message.detail && (
            <p className="text-sm text-slate-500 mb-6">{message.detail}</p>
          )}

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/"
              className="block w-full text-slate-600 hover:text-slate-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Need admin access?{" "}
              <a
                href="mailto:support@dinewithme.com"
                className="text-slate-900 hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
