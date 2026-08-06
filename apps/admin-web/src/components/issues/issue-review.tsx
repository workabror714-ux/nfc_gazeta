"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import { IssuePublicationControls } from "@/components/issues/issue-publication-controls";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  IssueDetail,
  NewspaperPageListItem,
  PageProcessingStatus,
} from "@/lib/issues";

interface IssueReviewProps {
  issueId: string;
}

function getPageStatusClass(
  status: PageProcessingStatus,
): string {
  const classes: Record<
    PageProcessingStatus,
    string
  > = {
    PENDING: "status-draft",
    PROCESSING: "status-processing",
    READY: "status-processing",
    REVIEW: "status-review",
    APPROVED: "status-published",
    FAILED: "status-failed",
  };

  return classes[status];
}

export function IssueReview({
  issueId,
}: IssueReviewProps) {
  const [issue, setIssue] =
    useState<IssueDetail | null>(null);

  const [pages, setPages] = useState<
    NewspaperPageListItem[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    async function requestData() {
      const [
        issueResponse,
        pagesResponse,
      ] = await Promise.all([
        fetch(`/api/issues/${issueId}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/issues/${issueId}/pages`,
          {
            cache: "no-store",
          },
        ),
      ]);

      const issueData =
        await issueResponse
          .json()
          .catch(() => null);

      const pagesData =
        await pagesResponse
          .json()
          .catch(() => null);

      if (!issueResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            issueData,
            "Nashr ma’lumotlarini olib bo‘lmadi.",
          ),
        );
      }

      if (!pagesResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            pagesData,
            "Gazeta betlarini olib bo‘lmadi.",
          ),
        );
      }

      return {
        issue: issueData as IssueDetail,
        pages:
          pagesData as NewspaperPageListItem[],
      };
    }

    void requestData()
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setIssue(data.issue);
        setPages(data.pages);
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kutilmagan xatolik yuz berdi.",
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [issueId]);

  if (isLoading) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>Nashr yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (error || !issue) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>Nashrni ochib bo‘lmadi</h2>
          <p>{error}</p>

          <Link
            href="/nashrlar"
            className="primary-link-button"
          >
            Nashrlarga qaytish
          </Link>
        </div>
      </section>
    );
  }

  const approvedPages =
    pages.filter(
      (page) => page.is_approved,
    ).length;

  return (
    <>
      <section className="issue-overview">
        <article className="content-panel issue-overview-card">
          <div className="issue-review-cover">
            {issue.cover_image ? (
              <img
                src={issue.cover_image}
                alt={`${issue.issue_number}-son muqovasi`}
              />
            ) : (
              <div className="issue-review-cover-placeholder">
                <strong>
                  {issue.issue_number}
                </strong>
                <span>SON</span>
              </div>
            )}
          </div>

          <div className="issue-review-info">
            <span className="issue-newspaper-name">
              {issue.newspaper.name}
            </span>

            <h1>
              {issue.year}-yil,{" "}
              {issue.issue_number}-son
            </h1>

            <p>
              {issue.description ||
                "Ushbu nashr uchun tavsif kiritilmagan."}
            </p>

            <div className="issue-review-statistics">
              <div>
                <span>Jami betlar</span>
                <strong>
                  {pages.length}
                </strong>
              </div>

              <div>
                <span>Tasdiqlangan</span>
                <strong>
                  {approvedPages}
                </strong>
              </div>

              <div>
                <span>Tekshiruvda</span>
                <strong>
                  {pages.length -
                    approvedPages}
                </strong>
              </div>
            </div>

            <div className="issue-review-links">
              {issue.original_pdf ? (
                <a
                  href={issue.original_pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="secondary-link-button"
                >
                  Original PDF
                </a>
              ) : null}

              <code>
                NFC: /n/{issue.nfc_slug}
              </code>
            </div>

            <IssuePublicationControls
              issue={issue}
              onIssueUpdated={setIssue}
            />
          </div>
        </article>
      </section>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <h2>Gazeta betlari</h2>
            <p>
              Har bir betning rasmi va
              ajratilgan matnini tekshiring.
            </p>
          </div>

          <span className="page-approval-count">
            {approvedPages}/{pages.length} tasdiqlandi
          </span>
        </div>

        {pages.length === 0 ? (
          <div className="empty-state">
            <h3>Betlar hali ajratilmagan</h3>
            <p>
              Nashrlar sahifasidan PDF’ni
              qayta ishlashni boshlang.
            </p>
          </div>
        ) : (
          <div className="newspaper-pages-grid">
            {pages.map((page) => (
              <Link
                key={page.id}
                href={`/nashrlar/${issue.id}/betlar/${page.id}`}
                className="newspaper-page-card"
              >
                <div className="newspaper-page-image">
                  {page.page_image ? (
                    <img
                      src={page.page_image}
                      alt={`${page.page_number}-bet`}
                      loading="lazy"
                    />
                  ) : (
                    <div className="page-image-empty">
                      Rasm yo‘q
                    </div>
                  )}
                </div>

                <div className="newspaper-page-card-body">
                  <div>
                    <strong>
                      {page.page_number}-bet
                    </strong>

                    <span
                      className={`status-badge ${getPageStatusClass(
                        page.processing_status,
                      )}`}
                    >
                      {
                        page.processing_status_display
                      }
                    </span>
                  </div>

                  <p>
                    {page.has_text
                      ? `${page.text_length} ta belgi`
                      : "Matn topilmadi"}
                  
                    {" · "}
                  
                    {page.image_count} ta rasm
                  
                    {" · "}
                  
                    {page.text_block_count} ta blok
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}