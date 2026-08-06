export interface AnalyticsRange {
  days: number;
  start_date: string;
  end_date: string;
}

export interface AnalyticsSummary {
  total_events: number;
  issue_opens: number;
  nfc_opens: number;
  web_opens: number;
  article_views: number;
  page_views: number;
  unique_visitors: number;
}

export interface AnalyticsDailyPoint {
  date: string;
  issue_opens: number;
  nfc_opens: number;
  web_opens: number;
  article_views: number;
  page_views: number;
  unique_visitors: number;
}

export interface AnalyticsTopIssue {
  issue_id: number;
  year: number;
  issue_number: number;
  title: string;
  nfc_slug: string;
  opens: number;
  nfc_opens: number;
  unique_visitors: number;
}

export interface AnalyticsTopArticle {
  article_id: number;
  title: string;
  slug: string;
  year: number;
  issue_number: number;
  views: number;
  unique_visitors: number;
}

export interface AnalyticsDistributionItem {
  key?: string;
  label: string;
  count: number;
  percentage: number;
}

export interface AnalyticsRecentEvent {
  id: number;
  event_type: string;
  event_label: string;
  source: string;
  source_label: string;
  issue_id: number;
  issue_label: string;
  article_id: number | null;
  article_title: string;
  page_number: number | null;
  device_type: string;
  browser: string;
  opened_at: string;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  changes: AnalyticsSummary;
  average_pages_per_visitor: number;
  daily: AnalyticsDailyPoint[];
  top_issues: AnalyticsTopIssue[];
  top_articles: AnalyticsTopArticle[];
  devices: AnalyticsDistributionItem[];
  browsers: AnalyticsDistributionItem[];
  sources: AnalyticsDistributionItem[];
  recent_events: AnalyticsRecentEvent[];
}
