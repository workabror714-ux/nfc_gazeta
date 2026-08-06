import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Temiryo‘lchi — elektron gazeta",
    template: "%s | Temiryo‘lchi",
  },
  description:
    "Temiryo‘lchi gazetasining elektron nashrlari, arxivi va maqolalari.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  const currentDate = new Intl.DateTimeFormat(
    "uz-UZ",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(new Date());

  return (
    <html lang="uz">
      <body>
        <SiteShell currentDate={currentDate}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
