import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  // If user is signed in, redirect to discover page
  const { userId } = await auth();
  
  if (userId) {
    redirect("/discover");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">
            DineWithMe
          </h1>
          <p className="text-lg text-slate-600">Connect over meals</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}

