export function getBackendUrl(): string {
    const url =
      process.env.BACKEND_API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://127.0.0.1:8000";
  
    return url.replace(/\/$/, "");
  }
  
  export async function readResponseJson(
    response: Response,
  ): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }