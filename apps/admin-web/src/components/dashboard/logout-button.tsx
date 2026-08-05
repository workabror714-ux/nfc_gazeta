"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      className="logout-button"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Chiqilmoqda..." : "Tizimdan chiqish"}
    </button>
  );
}