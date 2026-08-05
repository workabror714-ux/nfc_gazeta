export interface NewspaperOption {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
  }
  
  export type IssueStatus =
    | "DRAFT"
    | "PROCESSING"
    | "REVIEW"
    | "PUBLISHED"
    | "FAILED"
    | "ARCHIVED";
  
  export interface IssueListItem {
    id: number;
    newspaper: NewspaperOption;
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
    processing_progress: number;
    processing_error: string;
    estimated_audio_duration: number;
    status: IssueStatus;
    status_display: string;
    is_public: boolean;
    has_pdf: boolean;
    created_by_name: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface IssueDetail extends IssueListItem {
    original_pdf: string | null;
    approved_by_name: string;
    published_at: string | null;
  }
  
  export interface CreatedIssue {
    id: number;
    newspaper_id: number;
    issue_number: number;
    year: number;
    publication_date: string;
    title: string;
    description: string;
    slug: string;
    nfc_slug: string;
    status: IssueStatus;
    is_public: boolean;
    created_at: string;
  }
  
  export type PageProcessingStatus =
    | "PENDING"
    | "PROCESSING"
    | "READY"
    | "REVIEW"
    | "APPROVED"
    | "FAILED";
  
  export type TextBlockType =
    | "TITLE"
    | "TEXT"
    | "CAPTION"
    | "SIDEBAR"
    | "UNKNOWN";
  
  export interface PageTextBlock {
    id: number;
    block_index: number;
    block_type: TextBlockType;
    block_type_display: string;
    raw_text: string;
    final_text: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    font_size: number;
    font_name: string;
    is_bold: boolean;
    reading_order: number;
    is_ignored: boolean;
  }
  
  export interface ExtractedPageImage {
    id: number;
    page_id: number;
    block_index: number;
    image: string;
    caption: string;
    alt_text: string;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    width: number;
    height: number;
    reading_order: number;
    checksum: string;
    is_ignored: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface NewspaperPageListItem {
    id: number;
    issue_id: number;
    page_number: number;
    page_image: string | null;
    processing_status: PageProcessingStatus;
    processing_status_display: string;
    extraction_confidence: string;
    is_approved: boolean;
    has_text: boolean;
    text_length: number;
    image_count: number;
    text_block_count: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface NewspaperPageDetail extends NewspaperPageListItem {
    issue_title: string;
    issue_number: number;
    issue_year: number;
    newspaper_name: string;
    raw_text: string;
    ocr_text: string;
    final_text: string;
    audio: string | null;
    text_blocks: PageTextBlock[];
    images: ExtractedPageImage[];
  }
  
  export interface PageUpdateResponse {
    detail: string;
    page: NewspaperPageDetail;
  }
  
  export interface PageImageUpdateResponse {
    detail: string;
    image: ExtractedPageImage;
  }

  export interface CategoryOption {
    id: number;
    name: string;
    slug: string;
  }
  
  export interface ArticleListItem {
    id: number;
    issue_id: number;
    page_id: number | null;
    page_number: number | null;
    newspaper_name: string;
    category: CategoryOption | null;
    title: string;
    slug: string;
    summary: string;
    author: string;
    image: string | null;
    source_image: ExtractedPageImage | null;
    reading_order: number;
    is_featured: boolean;
    is_published: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface ArticleDetail
    extends ArticleListItem {
    content: string;
    audio: string | null;
    source_blocks: PageTextBlock[];
  }
  
  export interface ArticleCreateResponse {
    detail: string;
    article: ArticleDetail;
  }

  export interface ArticleUpdateResponse {
    detail: string;
    article: ArticleDetail;
  }