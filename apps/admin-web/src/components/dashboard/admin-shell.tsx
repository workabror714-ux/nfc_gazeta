"use client";

import {
  type ReactNode,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { LogoutButton } from "@/components/dashboard/logout-button";

interface AdminShellProps {
  children: ReactNode;
}

const navigation = [
  {
    href: "/dashboard",
    label: "Boshqaruv paneli",
    icon: "▦",
  },
  {
    href: "/nashrlar",
    label: "Gazeta nashrlari",
    icon: "▤",
  },
  {
    href: "/maqolalar",
    label: "Maqolalar",
    icon: "▧",
  },
  {
    href: "/analitika",
    label: "Analitika",
    icon: "↗",
  },
  {
    href: "/tizim",
    label: "Tizim sozlamalari",
    icon: "⚙",
  },
];

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super administrator",
    EDITOR: "Muharrir",
    REVIEWER: "Tekshiruvchi",
  };

  return labels[role] ?? role;
}

export function AdminShell({
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="admin-shell">
      {isSidebarOpen ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Menyuni yopish"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        className={
          isSidebarOpen
            ? "admin-sidebar sidebar-open"
            : "admin-sidebar"
        }
      >
        <div className="sidebar-brand">
          <div className="brand-mark">T</div>

          <div>
            <strong>Temiryo‘lchi</strong>
            <span>Digital boshqaruv</span>
          </div>
        </div>

        <nav
          className="sidebar-navigation"
          aria-label="Admin panel menyusi"
        >
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "sidebar-link sidebar-link-active"
                    : "sidebar-link"
                }
                onClick={closeSidebar}
              >
                <span
                  className="sidebar-link-icon"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user.full_name.slice(0, 1).toUpperCase()}
            </div>

            <div>
              <strong>{user.full_name}</strong>
              <span>{getRoleLabel(user.role)}</span>
            </div>
          </div>

          <LogoutButton />
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setIsSidebarOpen((current) => !current)
            }
            aria-label="Menyuni ochish"
            aria-expanded={isSidebarOpen}
          >
            ☰
          </button>

          <div>
            <p className="topbar-label">
              Temiryo‘lchi Digital
            </p>
            <strong>Admin boshqaruv tizimi</strong>
          </div>

          <div className="topbar-user">
            <span>{user.full_name}</span>
            <small>{user.email}</small>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </section>
    </div>
  );
}