export type AdminRole = "SUPER_ADMIN" | "EDITOR" | "REVIEWER";

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  is_staff: boolean;
}

export interface LoginResponse {
  user: AdminUser;
}

export function getApiErrorMessage(
  payload: unknown,
  fallback = "Kutilmagan xatolik yuz berdi.",
): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.detail === "string") {
    return data.detail;
  }

  const nonFieldErrors = data.non_field_errors;

  if (
    Array.isArray(nonFieldErrors) &&
    typeof nonFieldErrors[0] === "string"
  ) {
    return nonFieldErrors[0];
  }

  for (const value of Object.values(data)) {
    if (typeof value === "string") {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === "string") {
      return value[0];
    }
  }

  return fallback;
}