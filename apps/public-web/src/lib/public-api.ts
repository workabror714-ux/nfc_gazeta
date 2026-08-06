import type {
  PublicArticleCard,
  PublicArticleDetail,
  PublicHomeData,
  PublicIssueDetail,
  PublicIssueListItem,
} from "@/lib/public-types";

const BACKEND_API_URL = (
  process.env.BACKEND_API_URL ??
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface ApiErrorPayload {
  detail?: unknown;
}

export class PublicApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}

function getErrorMessage(
  payload: ApiErrorPayload | null,
  fallback: string,
): string {
  if (
    payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  return fallback;
}

async function requestPublicApi<T>(
  path: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${BACKEND_API_URL}${path}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );
  } catch {
    throw new PublicApiError(
      "Backend server bilan aloqa o‘rnatilmadi.",
      503,
    );
  }

  const data = (await response
    .json()
    .catch(() => null)) as
    | T
    | ApiErrorPayload
    | null;

  if (!response.ok) {
    throw new PublicApiError(
      getErrorMessage(
        data as ApiErrorPayload | null,
        "Ma’lumotlarni olishda xatolik yuz berdi.",
      ),
      response.status,
    );
  }

  return data as T;
}

export async function getPublicHome(): Promise<PublicHomeData> {
  return requestPublicApi<PublicHomeData>(
    "/api/public/home/",
  );
}

export async function getPublicIssues(
  year?: number,
): Promise<PublicIssueListItem[]> {
  const query = year ? `?year=${year}` : "";

  return requestPublicApi<
    PublicIssueListItem[]
  >(`/api/public/issues/${query}`);
}

interface GetPublicArticlesOptions {
  category?: string;
  issue?: string;
  search?: string;
}

export async function getPublicArticles(
  options: GetPublicArticlesOptions = {},
): Promise<PublicArticleCard[]> {
  const searchParams = new URLSearchParams();

  if (options.category) {
    searchParams.set(
      "category",
      options.category,
    );
  }

  if (options.issue) {
    searchParams.set("issue", options.issue);
  }

  if (options.search) {
    searchParams.set("search", options.search);
  }

  const query = searchParams.toString();

  return requestPublicApi<PublicArticleCard[]>(
    `/api/public/articles/${
      query ? `?${query}` : ""
    }`,
  );
}

export async function getPublicIssue(
  nfcSlug: string,
): Promise<PublicIssueDetail | null> {
  try {
    return await requestPublicApi<
      PublicIssueDetail
    >(
      `/api/public/issues/${encodeURIComponent(
        nfcSlug,
      )}/`,
    );
  } catch (error) {
    if (
      error instanceof PublicApiError &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }
}

export async function getPublicArticle(
  articleId: string,
): Promise<PublicArticleDetail | null> {
  try {
    return await requestPublicApi<
      PublicArticleDetail
    >(
      `/api/public/articles/${encodeURIComponent(
        articleId,
      )}/`,
    );
  } catch (error) {
    if (
      error instanceof PublicApiError &&
      error.status === 404
    ) {
      return null;
    }

    throw error;
  }
}
