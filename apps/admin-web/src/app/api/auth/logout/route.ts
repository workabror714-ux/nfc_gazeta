import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/server/auth-cookies";
import { getBackendUrl } from "@/lib/server/backend";

async function sendLogoutRequest(
  accessToken: string,
  refreshToken: string,
) {
  return fetch(`${getBackendUrl()}/api/auth/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: refreshToken,
    }),
    cache: "no-store",
  });
}

export async function POST() {
  const cookieStore = await cookies();

  let accessToken =
    cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  let refreshToken =
    cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (accessToken && refreshToken) {
    try {
      const logoutResponse = await sendLogoutRequest(
        accessToken,
        refreshToken,
      );

      if (logoutResponse.status === 401) {
        const refreshResponse = await fetch(
          `${getBackendUrl()}/api/auth/refresh/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh: refreshToken,
            }),
            cache: "no-store",
          },
        );

        if (refreshResponse.ok) {
          const refreshed = (await refreshResponse.json()) as {
            access?: string;
            refresh?: string;
          };

          accessToken = refreshed.access;
          refreshToken = refreshed.refresh ?? refreshToken;

          if (accessToken && refreshToken) {
            await sendLogoutRequest(
              accessToken,
              refreshToken,
            );
          }
        }
      }
    } catch {
      // Backend ishlamasa ham lokal cookie tozalanadi.
    }
  }

  const response = NextResponse.json({
    detail: "Tizimdan chiqildi.",
  });

  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);

  return response;
}