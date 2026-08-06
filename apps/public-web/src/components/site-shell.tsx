"use client";

import {
  type ReactNode,
  useState,
} from "react";

import { AccessibilityToolbar } from "@/components/accessibility-toolbar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SearchDialog } from "@/components/search-dialog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AccessibilityProvider } from "@/context/accessibility-context";

interface SiteShellProps {
  children: ReactNode;
  currentDate: string;
}

export function SiteShell({
  children,
  currentDate,
}: SiteShellProps) {
  const [isAccessibilityOpen, setIsAccessibilityOpen] =
    useState(false);
  const [isSearchOpen, setIsSearchOpen] =
    useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] =
    useState(false);

  return (
    <AccessibilityProvider>
      <div className="flex min-h-screen flex-col bg-[#F4F6F9] text-slate-900 selection:bg-[#D4AF37] selection:text-[#002244]">
        <SiteHeader
          currentDate={currentDate}
          onOpenAccessibility={() =>
            setIsAccessibilityOpen(true)
          }
          onOpenMobileNav={() =>
            setIsMobileNavOpen(true)
          }
          onOpenSearch={() =>
            setIsSearchOpen(true)
          }
        />

        <div className="flex-1">{children}</div>

        <SiteFooter
          onOpenAccessibility={() =>
            setIsAccessibilityOpen(true)
          }
        />

        <AccessibilityToolbar
          isOpen={isAccessibilityOpen}
          onClose={() =>
            setIsAccessibilityOpen(false)
          }
        />
        <SearchDialog
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
        <MobileNavigation
          isOpen={isMobileNavOpen}
          onClose={() =>
            setIsMobileNavOpen(false)
          }
          onOpenAccessibility={() =>
            setIsAccessibilityOpen(true)
          }
          onOpenSearch={() =>
            setIsSearchOpen(true)
          }
        />
      </div>
    </AccessibilityProvider>
  );
}
