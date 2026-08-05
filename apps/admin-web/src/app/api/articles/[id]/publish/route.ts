import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  authenticatedBackendFetch,
  createBackendProxyResponse,
} from "@/lib/server/authenticated-backend";

interface ArticleActionContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  _request: NextRequest,
  context: ArticleActionContext,
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        detail: "Maqola identifikatori noto‘g‘ri.",
      },
      {
        status: 400,
      },
    );
  }

  const result =
    await authenticatedBackendFetch(
      `/api/admin/articles/${id}/publish/`,
      () => ({
        method: "POST",
      }),
    );

  return createBackendProxyResponse(result);
}