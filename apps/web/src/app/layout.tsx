import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rubies Cuisine",
  description: "Good food, delivered in Achiaman. Are you hungry? Don't wait!",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Rubies Cuisine",
    description: "Are you hungry? Don't wait! Home-cooked Ghanaian meals delivered in Achiaman.",
    images: [{ url: "/og-default.webp", width: 1200, height: 630, alt: "Rubies Cuisine" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rubies Cuisine",
    description: "Are you hungry? Don't wait! Home-cooked Ghanaian meals delivered in Achiaman.",
    images: ["/og-default.webp"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
