import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DineWithMe",
    template: "%s | DineWithMe",
  },
  description: "Connect over meals - Discover and book intimate dinner experiences",
  applicationName: "DineWithMe",
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // clerkJSVersion pins the ClerkJS script load to an exact published
    // version instead of the unversioned "@5" URL. Unversioned loads via a
    // 307 redirect that Clerk's own already-executing code then re-verifies
    // with a second, internal follow-up fetch to the resolved exact
    // version - that follow-up fetch (not the initial script tag) was
    // observed hanging indefinitely in the browser's network stack (while
    // curl reaches the same exact-version URL in ~1s), leaving
    // window.Clerk.loaded stuck false and the whole app non-interactive.
    // Pinning here means the initial script tag itself requests the exact
    // version directly, skipping the redirect + internal re-fetch entirely.
    <ClerkProvider clerkJSVersion="5.127.1">
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
