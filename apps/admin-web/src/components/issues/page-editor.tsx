"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArticleComposerPanel } from "@/components/issues/article-composer-panel";
import { useAuth } from "@/components/auth/auth-provider";
import { PageImagesPanel } from "@/components/issues/page-images-panel";
import { getApiErrorMessage } from "@/lib/auth";
import type {
  ExtractedPageImage,
  NewspaperPageDetail,
  PageUpdateResponse,
} from "@/lib/issues";

interface PageEditorProps {
  issueId: string;
  pageId: string;
}

type TextTab = "final" | "raw" | "ocr";

export function PageEditor({
  issueId,
  pageId,
}: PageEditorProps) {
  const { user } = useAuth();

  const [page, setPage] = useState<NewspaperPageDetail | null>(null);
  const [finalText, setFinalText] = useState("");
  const [activeTab, setActiveTab] = useState<TextTab>("final");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isRunningOcr, setIsRunningOcr] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canEdit =
    user.role === "SUPER_ADMIN" || user.role === "EDITOR";

  const canReview =
    user.role === "SUPER_ADMIN" || user.role === "REVIEWER";

  useEffect(() => {
    let isCancelled = false;

    void fetch(`/api/pages/${pageId}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              "Bet ma’lumotlarini olib bo‘lmadi.",
            ),
          );
        }

        return data as NewspaperPageDetail;
      })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setPage(data);
        setFinalText(
          data.final_text || data.ocr_text || data.raw_text,
        );
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Kutilmagan xatolik.",
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
  }, [pageId]);

  function handleImageUpdated(updatedImage: ExtractedPageImage) {
    setPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        images: (currentPage.images ?? []).map((image) =>
          image.id === updatedImage.id ? updatedImage : image,
        ),
      };
    });
  }

  async function saveText() {
    if (!canEdit) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          final_text: finalText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Matnni saqlab bo‘lmadi."),
        );
      }

      const result = data as PageUpdateResponse;

      setPage(result.page);
      setFinalText(result.page.final_text);
      setSuccess(result.detail);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Matnni saqlashda xatolik.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function runOcr() {
    if (!canEdit) {
      return;
    }

    setIsRunningOcr(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/pages/${pageId}/ocr`, {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            "OCR orqali matnni aniqlab bo‘lmadi.",
          ),
        );
      }

      const result = data as PageUpdateResponse;

      setPage(result.page);
      setFinalText(
        result.page.final_text ||
          result.page.ocr_text ||
          result.page.raw_text,
      );
      setActiveTab("final");
      setSuccess(result.detail);
    } catch (ocrError) {
      setError(
        ocrError instanceof Error
          ? ocrError.message
          : "OCR bajarishda xatolik yuz berdi.",
      );
    } finally {
      setIsRunningOcr(false);
    }
  }

  async function reviewPage(action: "approve" | "reject") {
    if (!canReview) {
      return;
    }

    setIsReviewing(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/pages/${pageId}/${action}`,
        {
          method: "POST",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            action === "approve"
              ? "Betni tasdiqlab bo‘lmadi."
              : "Betni qaytarib bo‘lmadi.",
          ),
        );
      }

      const result = data as PageUpdateResponse;

      setPage(result.page);
      setFinalText(
        result.page.final_text ||
          result.page.ocr_text ||
          result.page.raw_text,
      );
      setSuccess(result.detail);
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Tekshiruvda xatolik.",
      );
    } finally {
      setIsReviewing(false);
    }
  }

  if (isLoading) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>Gazeta beti yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (error && !page) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>Betni ochib bo‘lmadi</h2>
          <p>{error}</p>

          <Link
            href={`/nashrlar/${issueId}`}
            className="primary-link-button"
          >
            Nashrga qaytish
          </Link>
        </div>
      </section>
    );
  }

  if (!page) {
    return null;
  }

  const visibleText =
    activeTab === "raw"
      ? page.raw_text
      : activeTab === "ocr"
        ? page.ocr_text
        : finalText;

  const pageImages = page.images ?? [];
  const textBlocks = page.text_blocks ?? [];
  const isBusy = isSaving || isReviewing || isRunningOcr;

  return (
    <>
      {success ? (
        <div className="success-message" role="status">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="error-message" role="alert">
          {error}
        </div>
      ) : null}

      <section className="page-editor-layout">
        <article className="content-panel page-preview-panel">
          <div className="panel-heading">
            <div>
              <h2>{page.page_number}-bet rasmi</h2>
              <p>Original PDF’dan olingan ko‘rinish</p>
            </div>
          </div>

          <div className="page-preview-container">
            {page.page_image ? (
              <img
                src={page.page_image}
                alt={`${page.page_number}-betning original ko‘rinishi`}
              />
            ) : (
              <div className="page-image-empty">
                Bet rasmi topilmadi
              </div>
            )}
          </div>
        </article>

        <article className="content-panel page-text-panel">
          <div className="panel-heading">
            <div>
              <h2>Bet matni</h2>
              <p>Matnni asl bet bilan solishtirib tekshiring.</p>
            </div>

            <span
              className={
                page.is_approved
                  ? "status-badge status-published"
                  : "status-badge status-review"
              }
            >
              {page.is_approved
                ? "Tasdiqlangan"
                : page.processing_status_display}
            </span>
          </div>

          <div className="text-editor-tabs" role="tablist">
            <button
              type="button"
              className={
                activeTab === "final"
                  ? "text-tab text-tab-active"
                  : "text-tab"
              }
              onClick={() => setActiveTab("final")}
            >
              Yakuniy matn
            </button>

            <button
              type="button"
              className={
                activeTab === "raw"
                  ? "text-tab text-tab-active"
                  : "text-tab"
              }
              onClick={() => setActiveTab("raw")}
            >
              PDF matni
            </button>

            <button
              type="button"
              className={
                activeTab === "ocr"
                  ? "text-tab text-tab-active"
                  : "text-tab"
              }
              onClick={() => setActiveTab("ocr")}
            >
              OCR matni
            </button>
          </div>

          <div className="page-text-editor">
            {activeTab === "final" ? (
              <textarea
                value={finalText}
                onChange={(event) => setFinalText(event.target.value)}
                disabled={!canEdit || isBusy}
                aria-label="Yakuniy gazeta matni"
              />
            ) : (
              <pre>{visibleText || "Bu manbada matn mavjud emas."}</pre>
            )}
          </div>

          <div className="page-editor-information">
            <span>
              Belgilar: <strong>{finalText.length}</strong>
            </span>

            <span>
              Aniqlik: <strong>{page.extraction_confidence}%</strong>
            </span>

            <span>
              Bet: <strong>{page.page_number}</strong>
            </span>

            <span>
              Matn bloklari: <strong>{textBlocks.length}</strong>
            </span>

            <span>
              Rasmlar: <strong>{pageImages.length}</strong>
            </span>
          </div>

          <div className="page-editor-actions">
            {canEdit ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  void runOcr();
                }}
                disabled={isBusy}
              >
                {isRunningOcr
                  ? "OCR ishlamoqda..."
                  : page.ocr_text
                    ? "OCR’ni qayta ishlatish"
                    : "OCR orqali matnni aniqlash"}
              </button>
            ) : null}

            {canEdit ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  void saveText();
                }}
                disabled={isBusy}
              >
                {isSaving ? "Saqlanmoqda..." : "Matnni saqlash"}
              </button>
            ) : null}

            {canReview ? (
              <>
                <button
                  type="button"
                  className="approve-button"
                  onClick={() => {
                    void reviewPage("approve");
                  }}
                  disabled={isBusy}
                >
                  Betni tasdiqlash
                </button>

                <button
                  type="button"
                  className="reject-button"
                  onClick={() => {
                    void reviewPage("reject");
                  }}
                  disabled={isBusy}
                >
                  Qayta tahrirlashga yuborish
                </button>
              </>
            ) : null}
          </div>
        </article>
      </section>

      <PageImagesPanel
        images={pageImages}
        canEdit={canEdit}
        onImageUpdated={handleImageUpdated}
      />

      <ArticleComposerPanel
        page={page}
        canEdit={canEdit}
      />
    </>
  );
}
