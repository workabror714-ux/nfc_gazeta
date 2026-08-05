import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface IssuePagesRouteContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  export async function GET(
    _request: NextRequest,
    context: IssuePagesRouteContext,
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
        `/api/admin/issues/${id}/pages/`,
        () => ({
          method: "GET",
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }