import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  authenticatedBackendFetch,
  createBackendProxyResponse,
} from "@/lib/server/authenticated-backend";

export const maxDuration = 300;

interface ProcessRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  context: ProcessRouteContext,
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        detail:
          "Nashr identifikatori noto‘g‘ri.",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await authenticatedBackendFetch(
      `/api/admin/issues/${id}/process-pdf/`,
      () => ({
        method: "POST",
      }),
    );

  return createBackendProxyResponse(
    result,
  );
}
