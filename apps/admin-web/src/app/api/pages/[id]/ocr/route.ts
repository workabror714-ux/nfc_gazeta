import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface PageOcrRouteContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  export async function POST(
    _request: NextRequest,
    context: PageOcrRouteContext,
  ) {
    const { id } = await context.params;
  
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        {
          detail:
            "Bet identifikatori noto‘g‘ri.",
        },
        {
          status: 400,
        },
      );
    }
  
    const result =
      await authenticatedBackendFetch(
        `/api/admin/pages/${id}/run-ocr/`,
        () => ({
          method: "POST",
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }