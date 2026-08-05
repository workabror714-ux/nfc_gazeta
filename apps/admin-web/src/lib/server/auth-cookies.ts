export const ACCESS_COOKIE_NAME = "temiryolchi_admin_access";
export const REFRESH_COOKIE_NAME = "temiryolchi_admin_refresh";

export const ACCESS_COOKIE_MAX_AGE = 30 * 60;
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export function getAuthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}