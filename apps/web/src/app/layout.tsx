import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rubies Cuisine",
  description: "Good food, delivered — Amamorley. Are you hungry? Don't wait!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
