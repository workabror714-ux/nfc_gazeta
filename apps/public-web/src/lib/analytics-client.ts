export type AnalyticsEventType =
  | "ISSUE_OPEN"
  | "ARTICLE_OPEN"
  | "PAGE_VIEW"
  | "PDF_OPEN";

export type AnalyticsSource =
  | "NFC"
  | "WEB"
  | "DIRECT"
  | "EXTERNAL"
  | "UNKNOWN";

export interface TrackAnalyticsEventInput {
  issueId: number;
  articleId?: number | null;
  eventType: AnalyticsEventType;
  source: AnalyticsSource;
  pageNumber?: number | null;
  dedupeKey?: string;
  metadata?: Record<string, unknown>;
}

const visitorStorageKey =
  "temiryolchi_analytics_visitor_id";
const eventStoragePrefix =
  "temiryolchi_analytics_event:";

function createUuid(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(
        Math.random() * 16,
      );
      const value =
        character === "x"
          ? random
          : (random & 0x3) | 0x8;

      return value.toString(16);
    },
  );
}

function getVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(
      visitorStorageKey,
    );

    if (existing) {
      return existing;
    }

    const created = createUuid();
    window.localStorage.setItem(
      visitorStorageKey,
      created,
    );
    return created;
  } catch {
    return createUuid();
  }
}

function wasTracked(dedupeKey: string): boolean {
  try {
    return (
      window.sessionStorage.getItem(
        `${eventStoragePrefix}${dedupeKey}`,
      ) === "1"
    );
  } catch {
    return false;
  }
}

function markTracked(dedupeKey: string): void {
  try {
    window.sessionStorage.setItem(
      `${eventStoragePrefix}${dedupeKey}`,
      "1",
    );
  } catch {
    // Storage may be disabled.
  }
}

export async function trackAnalyticsEvent(
  input: TrackAnalyticsEventInput,
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const dedupeKey =
    input.dedupeKey ??
    [
      input.eventType,
      input.issueId,
      input.articleId ?? "",
      input.pageNumber ?? "",
    ].join(":");

  if (wasTracked(dedupeKey)) {
    return;
  }

  const payload = {
    issue_id: input.issueId,
    article_id: input.articleId ?? null,
    event_type: input.eventType,
    source: input.source,
    anonymous_session_id: getVisitorId(),
    client_event_id: createUuid(),
    page_number: input.pageNumber ?? null,
    path: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer,
    metadata: {
      language: navigator.language,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      ...input.metadata,
    },
  };

  try {
    const response = await fetch(
      "/api/analytics/track",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      },
    );

    if (response.ok) {
      markTracked(dedupeKey);
    }
  } catch {
    // Analytics must never block the reader interface.
  }
}
