"use client";

import { useEffect } from "react";

import {
  type AnalyticsEventType,
  type AnalyticsSource,
  trackAnalyticsEvent,
} from "@/lib/analytics-client";

interface AnalyticsTrackerProps {
  issueId: number;
  articleId?: number | null;
  eventType: AnalyticsEventType;
  source: AnalyticsSource;
  pageNumber?: number | null;
  dedupeKey?: string;
}

export function AnalyticsTracker({
  issueId,
  articleId = null,
  eventType,
  source,
  pageNumber = null,
  dedupeKey,
}: AnalyticsTrackerProps) {
  useEffect(() => {
    void trackAnalyticsEvent({
      issueId,
      articleId,
      eventType,
      source,
      pageNumber,
      dedupeKey,
    });
  }, [
    articleId,
    dedupeKey,
    eventType,
    issueId,
    pageNumber,
    source,
  ]);

  return null;
}
