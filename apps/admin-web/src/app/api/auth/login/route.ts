import { NextRequest, NextResponse } from "next/server";

import { getApiErrorMessage } from "@/lib/auth";
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

interface LoginPayload {
  email?: string;
  password?: string;
}

interface BackendLoginResponse {
  access: string;
  refresh: string;
  user: unknown;
}

export async function POST(request: NextRequest) {
  const payload = (await request
    .json()
    .catch(() => null)) as LoginPayload | null;

  const email = payload?.email?.trim();
  const password = payload?.password;

  if (!email || !password) {
    return NextResponse.json(
      {
        detail: "Email va parol kiritilishi shart.",
      },
      {
        status: 400,
      },
    );
  }

  let backendResponse: Response;

  try {
    backendResponse = await fetch(
      `${getBackendUrl()}/api/auth/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "Backend server bilan aloqa o‘rnatilmadi. Server ishlayotganini tekshiring.",
      },
      {
        status: 503,
      },
    );
  }

  const data = await readResponseJson(backendResponse);

  if (!backendResponse.ok) {
    return NextResponse.json(
      {
        detail: getApiErrorMessage(
          data,
          "Email yoki parol noto‘g‘ri.",
        ),
      },
      {
        status: backendResponse.status,
      },
    );
  }

  const loginData = data as BackendLoginResponse;

  if (!loginData.access || !loginData.refresh || !loginData.user) {
    return NextResponse.json(
      {
        detail: "Backend noto‘g‘ri javob qaytardi.",
      },
      {
        status: 502,
      },
    );
  }

  const response = NextResponse.json({
    user: loginData.user,
  });

  response.cookies.set(
    ACCESS_COOKIE_NAME,
    loginData.access,
    getAuthCookieOptions(ACCESS_COOKIE_MAX_AGE),
  );

  response.cookies.set(
    REFRESH_COOKIE_NAME,
    loginData.refresh,
    getAuthCookieOptions(REFRESH_COOKIE_MAX_AGE),
  );

  return response;
}