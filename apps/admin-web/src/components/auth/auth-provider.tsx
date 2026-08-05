"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type { AdminUser } from "@/lib/auth";

interface AuthContextValue {
  user: AdminUser;
  reloadUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

type CurrentUserResult =
  | {
      status: "success";
      user: AdminUser;
    }
  | {
      status: "unauthorized";
    }
  | {
      status: "error";
      message: string;
    };

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Ushbu funksiya faqat API so‘rovini bajaradi.
 * React state'larini o‘zgartirmaydi.
 */
async function requestCurrentUser(): Promise<CurrentUserResult> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 401) {
      return {
        status: "unauthorized",
      };
    }

    const data = (await response.json().catch(() => null)) as
      | AdminUser
      | {
          detail?: string;
        }
      | null;

    if (!response.ok) {
      return {
        status: "error",
        message:
          data && "detail" in data && typeof data.detail === "string"
            ? data.detail
            : "Administrator ma’lumotlarini olib bo‘lmadi.",
      };
    }

    if (
      !data ||
      !("id" in data) ||
      !("email" in data) ||
      !("role" in data)
    ) {
      return {
        status: "error",
        message: "Backend noto‘g‘ri ma’lumot qaytardi.",
      };
    }

    return {
      status: "success",
      user: data as AdminUser,
    };
  } catch {
    return {
      status: "error",
      message:
        "Backend server bilan aloqa o‘rnatilmadi. Server ishlayotganini tekshiring.",
    };
  }
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Bu funksiya qayta urinish tugmasidan chaqiriladi.
   * Event handler ichida state yangilash mumkin.
   */
  const reloadUser = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const result = await requestCurrentUser();

    if (result.status === "unauthorized") {
      setUser(null);
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    if (result.status === "error") {
      setUser(null);
      setError(result.message);
      setIsLoading(false);
      return;
    }

    setUser(result.user);
    setError("");
    setIsLoading(false);
  }, [router]);

  /**
   * Sahifa birinchi ochilganda admin sessiyasini tekshiradi.
   * State faqat asinxron so‘rov tugagandan keyin yangilanadi.
   */
  useEffect(() => {
    let isCancelled = false;

    void requestCurrentUser().then((result) => {
      if (isCancelled) {
        return;
      }

      if (result.status === "unauthorized") {
        setUser(null);
        setIsLoading(false);
        router.replace("/login");
        return;
      }

      if (result.status === "error") {
        setUser(null);
        setError(result.message);
        setIsLoading(false);
        return;
      }

      setUser(result.user);
      setError("");
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [router]);

  const value = useMemo<AuthContextValue | null>(() => {
    if (!user) {
      return null;
    }

    return {
      user,
      reloadUser,
    };
  }, [reloadUser, user]);

  if (isLoading) {
    return (
      <main className="admin-loading">
        <div className="loading-spinner" />
        <p>Admin panel yuklanmoqda...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-loading">
        <section className="loading-error">
          <h1>Server bilan aloqa uzildi</h1>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void reloadUser();
            }}
          >
            Qayta urinish
          </button>
        </section>
      </main>
    );
  }

  if (!value) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth faqat AuthProvider ichida ishlatilishi mumkin.",
    );
  }

  return context;
}