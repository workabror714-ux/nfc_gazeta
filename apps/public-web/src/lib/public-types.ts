export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
}

export interface PublicPage {
  id: number;
  page_number: number;
  page_image: string | null;
  final_text: string;
  audio: string | null;
}

export interface PublicArticleCard {
  id: number;
  issue_id: number;
  issue_number: number;
  issue_year: number;
  issue_nfc_slug: string;
  newspaper_name: string;
  category: PublicCategory | null;
  title: string;
  slug: string;
  summary: string;
  author: string;
  main_image: string | null;
  reading_order: number;
  is_featured: boolean;
  published_at: string | null;
}

export interface PublicArticleDetail
  extends PublicArticleCard {
  content: string;
  audio: string | null;
}

export interface PublicIssueListItem {
  id: number;
  newspaper_name: string;
  issue_number: number;
  year: number;
  publication_date: string;
  title: string;
  slug: string;
  nfc_slug: string;
  nfc_path: string;
  description: string;
  cover_image: string | null;
  page_count: number;
  article_count: number;
  published_at: string | null;
}

export interface PublicIssueDetail
  extends PublicIssueListItem {
  original_pdf: string | null;
  pages: PublicPage[];
  articles: PublicArticleCard[];
}

export interface PublicHomeData {
  latest_issue: PublicIssueListItem | null;
  featured_articles: PublicArticleCard[];
  latest_articles: PublicArticleCard[];
  categories: PublicCategory[];
}
