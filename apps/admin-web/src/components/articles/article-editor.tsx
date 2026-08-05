"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { getApiErrorMessage } from "@/lib/auth";
import type {
  ArticleDetail,
  ArticleUpdateResponse,
  CategoryOption,
} from "@/lib/issues";

interface ArticleEditorProps {
  articleId: string;
}

export function ArticleEditor({
  articleId,
}: ArticleEditorProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [article, setArticle] =
    useState<ArticleDetail | null>(null);

  const [categories, setCategories] =
    useState<CategoryOption[]>([]);

  const [title, setTitle] =
    useState("");

  const [summary, setSummary] =
    useState("");

  const [content, setContent] =
    useState("");

  const [author, setAuthor] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [isFeatured, setIsFeatured] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isPublishing, setIsPublishing] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const canEdit =
    user.role === "SUPER_ADMIN" ||
    user.role === "EDITOR";

  const canReview =
    user.role === "SUPER_ADMIN" ||
    user.role === "REVIEWER";

  const canDelete =
    user.role === "SUPER_ADMIN";

  useEffect(() => {
    let isCancelled = false;

    void Promise.all([
      fetch(`/api/articles/${articleId}`, {
        cache: "no-store",
      }),
      fetch("/api/categories", {
        cache: "no-store",
      }),
    ])
      .then(async ([
        articleResponse,
        categoriesResponse,
      ]) => {
        const articleData =
          await articleResponse
            .json()
            .catch(() => null);

        const categoriesData =
          await categoriesResponse
            .json()
            .catch(() => null);

        if (!articleResponse.ok) {
          throw new Error(
            getApiErrorMessage(
              articleData,
              "Maqolani olib bo‘lmadi.",
            ),
          );
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            getApiErrorMessage(
              categoriesData,
              "Bo‘limlarni olib bo‘lmadi.",
            ),
          );
        }

        return {
          article:
            articleData as ArticleDetail,
          categories:
            categoriesData as CategoryOption[],
        };
      })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setArticle(data.article);
        setCategories(data.categories);
        setTitle(data.article.title);
        setSummary(data.article.summary);
        setContent(data.article.content);
        setAuthor(data.article.author);
        setCategoryId(
          data.article.category
            ? String(
                data.article.category.id
              )
            : "",
        );
        setIsFeatured(
          data.article.is_featured
        );
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
  }, [articleId]);

  async function saveArticle() {
    if (!canEdit) {
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/articles/${articleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            summary,
            content,
            author,
            category_id: categoryId
              ? Number(categoryId)
              : null,
            is_featured: isFeatured,
          }),
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            "Maqolani saqlab bo‘lmadi.",
          ),
        );
      }

      const result =
        data as ArticleUpdateResponse;

      setArticle(result.article);
      setTitle(result.article.title);
      setSummary(result.article.summary);
      setContent(result.article.content);
      setAuthor(result.article.author);
      setSuccess(result.detail);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Maqolani saqlashda xatolik.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePublication() {
    if (!canReview || !article) {
      return;
    }

    setIsPublishing(true);
    setError("");
    setSuccess("");

    const action = article.is_published
      ? "unpublish"
      : "publish";

    try {
      const response = await fetch(
        `/api/articles/${articleId}/${action}`,
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
            "Maqola holatini o‘zgartirib bo‘lmadi.",
          ),
        );
      }

      const result =
        data as ArticleUpdateResponse;

      setArticle(result.article);
      setSuccess(result.detail);
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Nashr qilishda xatolik.",
      );
    } finally {
      setIsPublishing(false);
    }
  }

  async function deleteArticle() {
    if (!canDelete) {
      return;
    }

    const shouldDelete = window.confirm(
      "Ushbu maqolani butunlay o‘chirmoqchimisiz?",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/articles/${articleId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          getApiErrorMessage(
            data,
            "Maqolani o‘chirib bo‘lmadi.",
          ),
        );
      }

      router.replace("/maqolalar");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Maqolani o‘chirishda xatolik.",
      );

      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>Maqola yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (error && !article) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>Maqolani ochib bo‘lmadi</h2>
          <p>{error}</p>

          <Link
            href="/maqolalar"
            className="primary-link-button"
          >
            Maqolalarga qaytish
          </Link>
        </div>
      </section>
    );
  }

  if (!article) {
    return null;
  }

  const sourceImage =
    article.source_image?.image ??
    article.image;

  const isBusy =
    isSaving ||
    isPublishing ||
    isDeleting;

  return (
    <>
      {success ? (
        <div className="success-message">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : null}

      <section className="article-editor-layout">
        <article className="content-panel article-editor-main">
          <div className="panel-heading">
            <div>
              <h2>Maqola ma’lumotlari</h2>
              <p>
                Sarlavha va maqola matnini
                tahrirlang.
              </p>
            </div>

            <span
              className={
                article.is_published
                  ? "status-badge status-published"
                  : "status-badge status-draft"
              }
            >
              {article.is_published
                ? "Nashr qilingan"
                : "Qoralama"}
            </span>
          </div>

          <div className="article-editor-fields">
            <div className="form-field">
              <label htmlFor="editor-title">
                Sarlavha
              </label>

              <input
                id="editor-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                disabled={!canEdit || isBusy}
                maxLength={300}
              />
            </div>

            <div className="article-editor-two-columns">
              <div className="form-field">
                <label htmlFor="editor-category">
                  Bo‘lim
                </label>

                <select
                  id="editor-category"
                  value={categoryId}
                  onChange={(event) =>
                    setCategoryId(
                      event.target.value
                    )
                  }
                  disabled={!canEdit || isBusy}
                >
                  <option value="">
                    Bo‘limsiz
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="editor-author">
                  Muallif
                </label>

                <input
                  id="editor-author"
                  value={author}
                  onChange={(event) =>
                    setAuthor(
                      event.target.value
                    )
                  }
                  disabled={!canEdit || isBusy}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="editor-summary">
                Qisqacha mazmun
              </label>

              <textarea
                id="editor-summary"
                value={summary}
                onChange={(event) =>
                  setSummary(
                    event.target.value
                  )
                }
                rows={4}
                disabled={!canEdit || isBusy}
              />
            </div>

            <div className="form-field">
              <label htmlFor="editor-content">
                Maqola matni
              </label>

              <textarea
                id="editor-content"
                className="article-content-textarea"
                value={content}
                onChange={(event) =>
                  setContent(
                    event.target.value
                  )
                }
                disabled={!canEdit || isBusy}
              />
            </div>

            <label className="article-featured-control">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(event) =>
                  setIsFeatured(
                    event.target.checked
                  )
                }
                disabled={!canEdit || isBusy}
              />

              <span>
                Ushbu maqolani asosiy maqola
                sifatida belgilash
              </span>
            </label>
          </div>

          <div className="page-editor-actions">
            {canEdit ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  void saveArticle();
                }}
                disabled={isBusy}
              >
                {isSaving
                  ? "Saqlanmoqda..."
                  : "Maqolani saqlash"}
              </button>
            ) : null}

            {canReview ? (
              <button
                type="button"
                className={
                  article.is_published
                    ? "unpublish-article-button"
                    : "publish-article-button"
                }
                onClick={() => {
                  void togglePublication();
                }}
                disabled={isBusy}
              >
                {isPublishing
                  ? "Yangilanmoqda..."
                  : article.is_published
                    ? "Nashrdan olish"
                    : "Maqolani nashr qilish"}
              </button>
            ) : null}

            {canDelete ? (
              <button
                type="button"
                className="delete-article-button"
                onClick={() => {
                  void deleteArticle();
                }}
                disabled={isBusy}
              >
                {isDeleting
                  ? "O‘chirilmoqda..."
                  : "Maqolani o‘chirish"}
              </button>
            ) : null}
          </div>
        </article>

        <aside className="article-editor-sidebar">
          <section className="content-panel">
            <div className="panel-heading">
              <div>
                <h2>Asosiy rasm</h2>
              </div>
            </div>

            <div className="article-editor-image">
              {sourceImage ? (
                <img
                  src={sourceImage}
                  alt={article.title}
                />
              ) : (
                <div className="article-image-placeholder">
                  Rasm yo‘q
                </div>
              )}
            </div>
          </section>

          <section className="content-panel article-source-info">
            <div className="panel-heading">
              <div>
                <h2>Manba</h2>
              </div>
            </div>

            <div>
              <span>Gazeta</span>
              <strong>
                {article.newspaper_name}
              </strong>
            </div>

            <div>
              <span>Bet</span>
              <strong>
                {article.page_number ??
                  "Ko‘rsatilmagan"}
              </strong>
            </div>

            <div>
              <span>Matn bloklari</span>
              <strong>
                {article.source_blocks.length}
              </strong>
            </div>

            <div>
              <span>URL</span>
              <code>
                /maqola/{article.slug}
              </code>
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}