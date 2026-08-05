import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  export async function GET(
    request: NextRequest,
  ) {
    const issueId =
      request.nextUrl.searchParams.get(
        "issue"
      );
  
    const pageId =
      request.nextUrl.searchParams.get(
        "page"
      );
  
    const searchParams =
      new URLSearchParams();
  
    if (issueId) {
      searchParams.set(
        "issue",
        issueId,
      );
    }
  
    if (pageId) {
      searchParams.set(
        "page",
        pageId,
      );
    }
  
    const query = searchParams.toString();
  
    const path = query
      ? `/api/admin/articles/?${query}`
      : "/api/admin/articles/";
  
    const result =
      await authenticatedBackendFetch(
        path,
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
            "Maqola ma’lumotlari yuborilmadi.",
        },
        {
          status: 400,
        },
      );
    }
  
    const result =
      await authenticatedBackendFetch(
        "/api/admin/articles/",
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