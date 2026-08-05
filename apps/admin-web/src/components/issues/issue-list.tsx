"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  IssueListItem,
  IssueStatus,
} from "@/lib/issues";

function getStatusClass(
  status: IssueStatus,
): string {
  const statusClasses: Record<
    IssueStatus,
    string
  > = {
    DRAFT: "status-draft",
    PROCESSING: "status-processing",
    REVIEW: "status-review",
    PUBLISHED: "status-published",
    FAILED: "status-failed",
    ARCHIVED: "status-archived",
  };

  return statusClasses[status];
}

function formatDate(
  dateValue: string,
): string {
  const date = new Date(
    `${dateValue}T00:00:00`,
  );

  return new Intl.DateTimeFormat(
    "uz-UZ",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

async function requestIssues(): Promise<
  IssueListItem[]
> {
  const response = await fetch(
    "/api/issues",
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data,
        "Nashrlar ro‘yxatini olib bo‘lmadi.",
      ),
    );
  }

  return data as IssueListItem[];
}

export function IssueList() {
  const [issues, setIssues] =
    useState<IssueListItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [processingIssueId, setProcessingIssueId] =
    useState<number | null>(null);

  const loadIssues = useCallback(
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const data =
          await requestIssues();

        setIssues(data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kutilmagan xatolik.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isCancelled = false;

    void requestIssues()
      .then((data) => {
        if (!isCancelled) {
          setIssues(data);
        }
      })
      .catch((loadError: unknown) => {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Kutilmagan xatolik.",
          );
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  async function handleProcessPdf(
    issueId: number,
  ) {
    setProcessingIssueId(issueId);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/issues/${issueId}/process`,
        {
          method: "POST",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            "PDF'ni qayta ishlab bo‘lmadi.",
          ),
        );
      }

      const result = data as {
        detail?: string;
        result?: {
          page_count?: number;
          text_pages?: number;
          ocr_pages?: number;
          empty_text_pages?: number;
          ocr_failed_pages?: number;
        };
      };

      setSuccessMessage(
        result.result
          ? (
              `${result.result.page_count ?? 0} ta bet ajratildi. ` +
              `${result.result.text_pages ?? 0} ta betdan matn olindi. ` +
              `${result.result.ocr_pages ?? 0} ta betda OCR ishladi. ` +
              `${result.result.ocr_failed_pages ?? 0} ta betda OCR natija bermadi.`
            )
          : (
              result.detail ??
              "PDF muvaffaqiyatli qayta ishlandi."
            ),
      );

      const updatedIssues =
        await requestIssues();

      setIssues(updatedIssues);
    } catch (processingError) {
      setError(
        processingError instanceof Error
          ? processingError.message
          : "Kutilmagan xatolik yuz berdi.",
      );
    } finally {
      setProcessingIssueId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />

          <p>Nashrlar yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (
    error &&
    issues.length === 0
  ) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>
            Nashrlarni olib bo‘lmadi
          </h2>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void loadIssues();
            }}
          >
            Qayta urinish
          </button>
        </div>
      </section>
    );
  }

  if (issues.length === 0) {
    return (
      <section className="content-panel">
        <div className="empty-state large-empty-state">
          <div className="empty-state-icon">
            ＋
          </div>

          <h2>
            Hali nashr qo‘shilmagan
          </h2>

          <p>
            Birinchi gazeta sonini yaratish
            uchun yuqoridagi “Yangi nashr”
            tugmasini bosing.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      {successMessage ? (
        <div
          className="success-message"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      {error ? (
        <div
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section
        className="issue-list"
        aria-label="Gazeta nashrlari"
      >
        {issues.map((issue) => {
          const isProcessing =
            processingIssueId === issue.id;

          const canProcess =
            issue.has_pdf &&
            issue.status !== "PUBLISHED" &&
            issue.status !== "ARCHIVED";

          return (
            <article
              key={issue.id}
              className="issue-list-card"
            >
              <div className="issue-cover-placeholder">
                <span>
                  {issue.issue_number}
                </span>

                <small>SON</small>
              </div>

              <div className="issue-card-content">
                <div className="issue-card-top">
                  <div>
                    <span className="issue-newspaper-name">
                      {issue.newspaper.name}
                    </span>

                    <h2>
                      {issue.year}-yil,{" "}
                      {issue.issue_number}-son
                    </h2>
                  </div>

                  <span
                    className={`status-badge ${getStatusClass(
                      issue.status,
                    )}`}
                  >
                    {isProcessing
                      ? "Qayta ishlanmoqda"
                      : issue.status_display}
                  </span>
                </div>

                <div className="issue-metadata">
                  <span>
                    Nashr sanasi:{" "}
                    <strong>
                      {formatDate(
                        issue.publication_date,
                      )}
                    </strong>
                  </span>

                  <span>
                    PDF:{" "}
                    <strong>
                      {issue.has_pdf
                        ? "Yuklangan"
                        : "Yuklanmagan"}
                    </strong>
                  </span>

                  <span>
                    Betlar:{" "}
                    <strong>
                      {issue.page_count}
                    </strong>
                  </span>
                </div>

                {issue.description ? (
                  <p className="issue-description">
                    {issue.description}
                  </p>
                ) : null}

                {issue.processing_progress > 0 ? (
                  <div className="processing-progress">
                    <div className="processing-progress-heading">
                      <span>
                        PDF qayta ishlash
                      </span>

                      <strong>
                        {issue.processing_progress}%
                      </strong>
                    </div>

                    <div className="processing-progress-track">
                      <span
                        style={{
                          width: `${issue.processing_progress}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                {issue.processing_error ? (
                  <div className="inline-processing-error">
                    {issue.processing_error}
                  </div>
                ) : null}

                <div className="issue-card-actions">
                  <Link
                    href={`/nashrlar/${issue.id}`}
                    className="secondary-link-button"
                    >
                    Nashrni ochish
                  </Link>  
                  
                  {canProcess ? (
                    <button
                      type="button"
                      className="process-pdf-button"
                      disabled={isProcessing}
                      onClick={() => {
                        void handleProcessPdf(
                          issue.id,
                        );
                      }}
                    >
                      {isProcessing
                        ? "Betlar ajratilmoqda..."
                        : issue.page_count > 0
                          ? "PDF’ni qayta ishlash"
                          : "PDF’ni betlarga ajratish"}
                    </button>
                  ) : null}
                </div>

                <div className="issue-card-footer">
                  <code>
                    NFC: /n/{issue.nfc_slug}
                  </code>

                  <span>
                    {issue.created_by_name
                      ? `Yaratdi: ${issue.created_by_name}`
                      : ""}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}