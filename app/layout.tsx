import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conference Feedback Survey",
  description: "Share your conference experience with us",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
