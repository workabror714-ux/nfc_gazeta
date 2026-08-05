import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface PageImageRouteContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  export async function PATCH(
    request: NextRequest,
    context: PageImageRouteContext,
  ) {
    const { id } = await context.params;
  
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        {
          detail:
            "Rasm identifikatori noto‘g‘ri.",
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
            "Rasm ma’lumotlari yuborilmadi.",
        },
        {
          status: 400,
        },
      );
    }
  
    const result =
      await authenticatedBackendFetch(
        `/api/admin/page-images/${id}/`,
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