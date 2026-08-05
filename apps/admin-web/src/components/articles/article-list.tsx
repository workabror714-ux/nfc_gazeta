"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { getApiErrorMessage } from "@/lib/auth";
import type {
  ArticleListItem,
} from "@/lib/issues";

async function requestArticles(): Promise<
  ArticleListItem[]
> {
  const response = await fetch(
    "/api/articles",
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
        "Maqolalarni olib bo‘lmadi.",
      ),
    );
  }

  return data as ArticleListItem[];
}

export function ArticleList() {
  const { user } = useAuth();

  const [articles, setArticles] =
    useState<ArticleListItem[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [workingArticleId, setWorkingArticleId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const canReview =
    user.role === "SUPER_ADMIN" ||
    user.role === "REVIEWER";

  const loadArticles = useCallback(
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const data =
          await requestArticles();

        setArticles(data);
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

    void requestArticles()
      .then((data) => {
        if (!isCancelled) {
          setArticles(data);
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

  async function togglePublication(
    article: ArticleListItem,
  ) {
    setWorkingArticleId(article.id);
    setError("");
    setSuccess("");

    const action = article.is_published
      ? "unpublish"
      : "publish";

    try {
      const response = await fetch(
        `/api/articles/${article.id}/${action}`,
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

      setSuccess(
        typeof data?.detail === "string"
          ? data.detail
          : "Maqola holati yangilandi.",
      );

      setArticles(
        await requestArticles()
      );
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Kutilmagan xatolik.",
      );
    } finally {
      setWorkingArticleId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>Maqolalar yuklanmoqda...</p>
        </div>
      </section>
    );
  }

  if (error && articles.length === 0) {
    return (
      <section className="content-panel">
        <div className="loading-error issue-load-error">
          <h2>Maqolalarni olib bo‘lmadi</h2>
          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void loadArticles();
            }}
          >
            Qayta urinish
          </button>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return (
      <section className="content-panel">
        <div className="empty-state large-empty-state">
          <div className="empty-state-icon">
            ▤
          </div>

          <h2>Maqolalar hali yaratilmagan</h2>

          <p>
            Gazeta betini ochib, matn bloklaridan
            birinchi elektron maqolani yarating.
          </p>

          <Link
            href="/nashrlar"
            className="primary-link-button"
          >
            Gazeta nashrlariga o‘tish
          </Link>
        </div>
      </section>
    );
  }

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

      <section className="articles-admin-grid">
        {articles.map((article) => {
          const image =
            article.source_image?.image ??
            article.image;

          const isWorking =
            workingArticleId === article.id;

          return (
            <article
              key={article.id}
              className="article-admin-card"
            >
              <div className="article-admin-image">
                {image ? (
                  <img
                    src={image}
                    alt={article.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="article-image-placeholder">
                    MAQOLA
                  </div>
                )}

                <span
                  className={
                    article.is_published
                      ? "article-publication-badge article-publication-published"
                      : "article-publication-badge article-publication-draft"
                  }
                >
                  {article.is_published
                    ? "Nashr qilingan"
                    : "Qoralama"}
                </span>
              </div>

              <div className="article-admin-content">
                <span className="issue-newspaper-name">
                  {article.category?.name ??
                    "Bo‘limsiz"}
                </span>

                <h2>{article.title}</h2>

                {article.summary ? (
                  <p>
                    {article.summary.length > 180
                      ? `${article.summary.slice(
                          0,
                          180,
                        )}…`
                      : article.summary}
                  </p>
                ) : (
                  <p>
                    Maqola uchun qisqacha mazmun
                    kiritilmagan.
                  </p>
                )}

                <div className="article-admin-meta">
                  <span>
                    {article.issue_id}-nashr
                  </span>

                  <span>
                    {article.page_number
                      ? `${article.page_number}-bet`
                      : "Bet biriktirilmagan"}
                  </span>

                  <span>
                    {article.author ||
                      "Muallif ko‘rsatilmagan"}
                  </span>
                </div>

                <div className="article-admin-actions">
                  <Link
                    href={`/maqolalar/${article.id}`}
                    className="secondary-link-button"
                  >
                    Maqolani ochish
                  </Link>

                  {canReview ? (
                    <button
                      type="button"
                      className={
                        article.is_published
                          ? "unpublish-article-button"
                          : "publish-article-button"
                      }
                      onClick={() => {
                        void togglePublication(
                          article,
                        );
                      }}
                      disabled={isWorking}
                    >
                      {isWorking
                        ? "Saqlanmoqda..."
                        : article.is_published
                          ? "Nashrdan olish"
                          : "Nashr qilish"}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}