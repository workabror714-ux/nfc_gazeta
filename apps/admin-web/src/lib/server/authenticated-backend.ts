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

type RequestInitFactory = (
  accessToken: string,
) => RequestInit;

interface BackendFetchResult {
  backendResponse?: Response;
  newAccessToken?: string;
  newRefreshToken?: string;
  clearCookies?: boolean;
  error?: {
    status: number;
    detail: string;
  };
}

interface RefreshPayload {
  access?: string;
  refresh?: string;
}

async function callBackend(
  path: string,
  accessToken: string,
  createInit: RequestInitFactory,
): Promise<Response> {
  const init = createInit(accessToken);
  const headers = new Headers(init.headers);

  headers.set(
    "Authorization",
    `Bearer ${accessToken}`,
  );

  return fetch(
    `${getBackendUrl()}${path}`,
    {
      ...init,
      headers,
      cache: "no-store",
    },
  );
}

export async function authenticatedBackendFetch(
  path: string,
  createInit: RequestInitFactory,
): Promise<BackendFetchResult> {
  const cookieStore = await cookies();

  const currentAccessToken =
    cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  const currentRefreshToken =
    cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (currentAccessToken) {
    try {
      const backendResponse = await callBackend(
        path,
        currentAccessToken,
        createInit,
      );

      if (backendResponse.status !== 401) {
        return {
          backendResponse,
        };
      }
    } catch {
      return {
        error: {
          status: 503,
          detail:
            "Backend server bilan aloqa o‘rnatilmadi.",
        },
      };
    }
  }

  if (!currentRefreshToken) {
    return {
      clearCookies: true,
      error: {
        status: 401,
        detail:
          "Administrator sessiyasi tugagan. Qayta kiring.",
      },
    };
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
    return {
      error: {
        status: 503,
        detail:
          "Backend server bilan aloqa o‘rnatilmadi.",
      },
    };
  }

  if (!refreshResponse.ok) {
    return {
      clearCookies: true,
      error: {
        status: 401,
        detail:
          "Administrator sessiyasi tugagan. Qayta kiring.",
      },
    };
  }

  const refreshedTokens =
    (await readResponseJson(
      refreshResponse,
    )) as RefreshPayload | null;

  if (!refreshedTokens?.access) {
    return {
      clearCookies: true,
      error: {
        status: 401,
        detail:
          "Administrator sessiyasini yangilab bo‘lmadi.",
      },
    };
  }

  const newAccessToken =
    refreshedTokens.access;

  const newRefreshToken =
    refreshedTokens.refresh ??
    currentRefreshToken;

  try {
    const backendResponse = await callBackend(
      path,
      newAccessToken,
      createInit,
    );

    return {
      backendResponse,
      newAccessToken,
      newRefreshToken,
      clearCookies:
        backendResponse.status === 401,
    };
  } catch {
    return {
      error: {
        status: 503,
        detail:
          "Backend server bilan aloqa o‘rnatilmadi.",
      },
    };
  }
}

export async function createBackendProxyResponse(
  result: BackendFetchResult,
): Promise<NextResponse> {
  let response: NextResponse;

  if (result.backendResponse) {
    const payload = await readResponseJson(
      result.backendResponse,
    );

    if (
      result.backendResponse.status === 204
    ) {
      response = new NextResponse(
        null,
        {
          status: 204,
        },
      );
    } else {
      response = NextResponse.json(
        payload ?? {
          detail:
            "Backend bo‘sh javob qaytardi.",
        },
        {
          status:
            result.backendResponse.status,
        },
      );
    }
  } else {
    response = NextResponse.json(
      {
        detail:
          result.error?.detail ??
          "Kutilmagan server xatoligi.",
      },
      {
        status:
          result.error?.status ?? 500,
      },
    );
  }

  if (result.clearCookies) {
    response.cookies.delete(
      ACCESS_COOKIE_NAME,
    );

    response.cookies.delete(
      REFRESH_COOKIE_NAME,
    );
  }

  if (
    result.newAccessToken &&
    !result.clearCookies
  ) {
    response.cookies.set(
      ACCESS_COOKIE_NAME,
      result.newAccessToken,
      getAuthCookieOptions(
        ACCESS_COOKIE_MAX_AGE,
      ),
    );
  }

  if (
    result.newRefreshToken &&
    !result.clearCookies
  ) {
    response.cookies.set(
      REFRESH_COOKIE_NAME,
      result.newRefreshToken,
      getAuthCookieOptions(
        REFRESH_COOKIE_MAX_AGE,
      ),
    );
  }

  return response;
}