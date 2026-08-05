import { NextRequest, NextResponse } from "next/server";

import {
  authenticatedBackendFetch,
  createBackendProxyResponse,
} from "@/lib/server/authenticated-backend";

export async function GET() {
  const result =
    await authenticatedBackendFetch(
      "/api/admin/issues/",
      () => ({
        method: "GET",
      }),
    );

  return createBackendProxyResponse(
    result,
  );
}

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
          "Nashr ma’lumotlari yuborilmadi.",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await authenticatedBackendFetch(
      "/api/admin/issues/",
      () => ({
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify(payload),
      }),
    );

  return createBackendProxyResponse(
    result,
  );
}