import { Suspense } from "react";
import { UnauthorizedContent } from "./unauthorized-content";

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<UnauthorizedFallback />}>
      <UnauthorizedContent />
    </Suspense>
  );
}

function UnauthorizedFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Access Denied
          </h1>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}
