import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE_MAX_AGE,
  ACCESS_COOKIE_NAME,
  getAuthCookieOptions,
  REFRESH_COOKIE_MAX_AGE,
  REFRESH_COOKIE_NAME,
} from "@/lib/server/auth-cookies";
import {
  getBackendUrl,
  readResponseJson,
} from "@/lib/server/backend";

interface RefreshResponse {
  access?: string;
  refresh?: string;
}

async function fetchCurrentUser(accessToken: string) {
  return fetch(`${getBackendUrl()}/api/auth/me/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
}

function createUnauthorizedResponse() {
  const response = NextResponse.json(
    {
      detail: "Admin sessiyasi tugagan. Qayta kiring.",
    },
    {
      status: 401,
    },
  );

  response.cookies.delete(ACCESS_COOKIE_NAME);
  response.cookies.delete(REFRESH_COOKIE_NAME);

  return response;
}

export async function GET() {
  const cookieStore = await cookies();

  const currentAccessToken =
    cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  const currentRefreshToken =
    cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (currentAccessToken) {
    try {
      const currentUserResponse =
        await fetchCurrentUser(currentAccessToken);

      if (currentUserResponse.ok) {
        const user = await readResponseJson(currentUserResponse);
        return NextResponse.json(user);
      }

      if (currentUserResponse.status !== 401) {
        const error = await readResponseJson(currentUserResponse);

        return NextResponse.json(error, {
          status: currentUserResponse.status,
        });
      }
    } catch {
      return NextResponse.json(
        {
          detail: "Backend server bilan aloqa uzildi.",
        },
        {
          status: 503,
        },
      );
    }
  }

  if (!currentRefreshToken) {
    return createUnauthorizedResponse();
  }

  let refreshResponse: Response;

  try {
    refreshResponse = await fetch(
      `${getBackendUrl()}/api/auth/refresh/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh: currentRefreshToken,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail: "Backend server bilan aloqa uzildi.",
      },
      {
        status: 503,
      },
    );
  }

  if (!refreshResponse.ok) {
    return createUnauthorizedResponse();
  }

  const refreshedTokens =
    (await readResponseJson(refreshResponse)) as RefreshResponse;

  if (!refreshedTokens.access) {
    return createUnauthorizedResponse();
  }

  const newAccessToken = refreshedTokens.access;
  const newRefreshToken =
    refreshedTokens.refresh ?? currentRefreshToken;

  let currentUserResponse: Response;

  try {
    currentUserResponse =
      await fetchCurrentUser(newAccessToken);
  } catch {
    return NextResponse.json(
      {
        detail: "Backend server bilan aloqa uzildi.",
      },
      {
        status: 503,
      },
    );
  }

  if (!currentUserResponse.ok) {
    return createUnauthorizedResponse();
  }

  const user = await readResponseJson(currentUserResponse);
  const response = NextResponse.json(user);

  response.cookies.set(
    ACCESS_COOKIE_NAME,
    newAccessToken,
    getAuthCookieOptions(ACCESS_COOKIE_MAX_AGE),
  );

  response.cookies.set(
    REFRESH_COOKIE_NAME,
    newRefreshToken,
    getAuthCookieOptions(REFRESH_COOKIE_MAX_AGE),
  );

  return response;
}