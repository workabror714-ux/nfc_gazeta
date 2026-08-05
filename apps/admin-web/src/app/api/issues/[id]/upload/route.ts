import {
    NextRequest,
    NextResponse,
  } from "next/server";
  
  import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  interface UploadRouteContext {
    params: Promise<{
      id: string;
    }>;
  }
  
  export async function POST(
    request: NextRequest,
    context: UploadRouteContext,
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
  
    const incomingFormData =
      await request.formData();
  
    const file =
      incomingFormData.get("file");
  
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          detail:
            "PDF fayl tanlanmagan.",
        },
        {
          status: 400,
        },
      );
    }
  
    const backendFormData =
      new FormData();
  
    backendFormData.append(
      "file",
      file,
      file.name,
    );
  
    const result =
      await authenticatedBackendFetch(
        `/api/admin/issues/${id}/upload-pdf/`,
        () => ({
          method: "POST",
          body: backendFormData,
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }