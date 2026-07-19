import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-semibold text-slate-900">Page Not Found</h2>
        <p className="text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-y-3 pt-4">
          <Link
            href="/discover"
            className="block w-full bg-slate-900 text-white rounded-xl px-6 py-3 font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Discover
          </Link>
          <Link
            href="/"
            className="block w-full text-slate-600 hover:text-slate-900 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
