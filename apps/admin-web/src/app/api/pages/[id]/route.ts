import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface PageRouteContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  function isValidId(id: string): boolean {
    return /^\d+$/.test(id);
  }
  
  export async function GET(
    _request: NextRequest,
    context: PageRouteContext,
  ) {
    const { id } = await context.params;
  
    if (!isValidId(id)) {
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
        `/api/admin/pages/${id}/`,
        () => ({
          method: "GET",
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }
  
  export async function PATCH(
    request: NextRequest,
    context: PageRouteContext,
  ) {
    const { id } = await context.params;
  
    if (!isValidId(id)) {
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
  
    const payload = await request
      .json()
      .catch(() => null);
  
    if (!payload) {
      return NextResponse.json(
        {
          detail:
            "Bet matni yuborilmadi.",
        },
        {
          status: 400,
        },
      );
    }
  
    const result =
      await authenticatedBackendFetch(
        `/api/admin/pages/${id}/`,
        () => ({
          method: "PATCH",
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