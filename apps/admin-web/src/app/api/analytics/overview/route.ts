import { NextRequest } from "next/server";

import {
  authenticatedBackendFetch,
  createBackendProxyResponse,
} from "@/lib/server/authenticated-backend";

export async function GET(
  request: NextRequest,
) {
  const rawDays =
    request.nextUrl.searchParams.get("days") ??
    "30";

  const parsedDays = Number.parseInt(
    rawDays,
    10,
  );

  const days = Number.isFinite(parsedDays)
    ? Math.min(Math.max(parsedDays, 1), 365)
    : 30;

  const result =
    await authenticatedBackendFetch(
      `/api/admin/analytics/overview/?days=${days}`,
      () => ({
        method: "GET",
      }),
    );

  return createBackendProxyResponse(result);
}
