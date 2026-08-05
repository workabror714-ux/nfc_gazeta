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

  export interface IssueDetail
    extends IssueListItem {
    original_pdf: string | null;
    approved_by_name: string;
    published_at: string | null;
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
    created_at: string;
    updated_at: string;
  }
  
  export interface NewspaperPageDetail
    extends NewspaperPageListItem {
    issue_title: string;
    issue_number: number;
    issue_year: number;
    newspaper_name: string;
    raw_text: string;
    ocr_text: string;
    final_text: string;
    audio: string | null;
  }
  
  export interface PageUpdateResponse {
    detail: string;
    page: NewspaperPageDetail;
  }