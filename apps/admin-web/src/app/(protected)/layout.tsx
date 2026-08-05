import type { ReactNode } from "react";

import { AuthProvider } from "@/components/auth/auth-provider";
import { AdminShell } from "@/components/dashboard/admin-shell";

interface ProtectedLayoutProps {
  children: ReactNode;
}

export default function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}