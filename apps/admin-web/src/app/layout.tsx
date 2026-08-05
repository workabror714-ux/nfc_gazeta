import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Temiryo‘lchi Admin",
    template: "%s | Temiryo‘lchi Admin",
  },
  description:
    "Temiryo‘lchi Digital gazetalarini boshqarish paneli",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}