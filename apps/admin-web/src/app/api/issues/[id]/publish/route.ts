import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface IssueActionContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  export async function POST(
    _request: NextRequest,
    context: IssueActionContext,
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
        `/api/admin/issues/${id}/publish/`,
        () => ({
          method: "POST",
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }