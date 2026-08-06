import {
  NextRequest,
  NextResponse,
} from "next/server";

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ??
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export async function POST(
  request: NextRequest,
) {
  const payload = await request
    .json()
    .catch(() => null);

  if (!payload) {
    return NextResponse.json(
      {
        detail:
          "Analitika ma’lumotlari yuborilmadi.",
      },
      {
        status: 400,
      },
    );
  }

  const forwardedFor =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";

  try {
    const backendResponse = await fetch(
      `${BACKEND_API_URL}/api/public/analytics/track/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            request.headers.get("user-agent") ??
            "",
          ...(forwardedFor
            ? {
                "X-Forwarded-For":
                  forwardedFor,
              }
            : {}),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    const data = await backendResponse
      .json()
      .catch(() => null);

    return NextResponse.json(
      data ?? {
        accepted: backendResponse.ok,
      },
      {
        status: backendResponse.status,
      },
    );
  } catch {
    return NextResponse.json(
      {
        detail:
          "Analitika serveriga ulanib bo‘lmadi.",
      },
      {
        status: 503,
      },
    );
  }
}
