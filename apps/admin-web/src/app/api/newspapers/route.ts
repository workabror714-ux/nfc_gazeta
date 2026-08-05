import {
    authenticatedBackendFetch,
    createBackendProxyResponse,
  } from "@/lib/server/authenticated-backend";
  
  export async function GET() {
    const result =
      await authenticatedBackendFetch(
        "/api/admin/newspapers/",
        () => ({
          method: "GET",
        }),
      );
  
    return createBackendProxyResponse(
      result,
    );
  }