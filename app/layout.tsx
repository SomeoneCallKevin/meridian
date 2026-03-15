import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meridian — AI Trading Intelligence",
  description:
    "Fuse real-time news sentiment, geopolitical analysis, and technical indicators into a single confidence score.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
