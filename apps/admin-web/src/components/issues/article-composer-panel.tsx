"use client";

/* eslint-disable @next/next/no-img-element */

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  ArticleCreateResponse,
  CategoryOption,
  NewspaperPageDetail,
  PageTextBlock,
} from "@/lib/issues";

interface ArticleComposerPanelProps {
  page: NewspaperPageDetail;
  canEdit: boolean;
}

function getBlockText(
  block: PageTextBlock,
): string {
  return (
    block.final_text ||
    block.raw_text
  ).trim();
}

function getSuggestedTitle(
  page: NewspaperPageDetail,
): string {
  const titleBlock =
    page.text_blocks.find(
      (block) =>
        !block.is_ignored &&
        block.block_type === "TITLE" &&
        getBlockText(block),
    );

  if (!titleBlock) {
    return "";
  }

  return (
    getBlockText(titleBlock)
      .split("\n")[0]
      ?.slice(0, 300)
      .trim() ?? ""
  );
}

export function ArticleComposerPanel({
  page,
  canEdit,
}: ArticleComposerPanelProps) {
  const availableBlocks =
    page.text_blocks.filter(
      (block) =>
        !block.is_ignored &&
        Boolean(getBlockText(block)),
    );

  const availableImages =
    page.images.filter(
      (image) => !image.is_ignored,
    );

  const [categories, setCategories] =
    useState<CategoryOption[]>([]);

  const [title, setTitle] =
    useState(() =>
      getSuggestedTitle(page)
    );

  const [summary, setSummary] =
    useState("");

  const [author, setAuthor] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [
    selectedBlockIds,
    setSelectedBlockIds,
  ] = useState<number[]>(() =>
    availableBlocks.map(
      (block) => block.id
    )
  );

  const [
    sourceImageId,
    setSourceImageId,
  ] = useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    void fetch("/api/categories", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              "Bo‘limlarni olib bo‘lmadi.",
            ),
          );
        }

        return data as CategoryOption[];
      })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setCategories(data);

        if (data.length > 0) {
          setCategoryId(
            String(data[0].id)
          );
        }
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Bo‘limlarni yuklashda xatolik.",
        );
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  function toggleBlock(
    blockId: number,
  ) {
    setSelectedBlockIds(
      (currentIds) =>
        currentIds.includes(blockId)
          ? currentIds.filter(
              (id) => id !== blockId
            )
          : [
              ...currentIds,
              blockId,
            ],
    );
  }

  function selectAllBlocks() {
    setSelectedBlockIds(
      availableBlocks.map(
        (block) => block.id
      )
    );
  }

  function clearBlocks() {
    setSelectedBlockIds([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError(
        "Maqola sarlavhasini kiriting."
      );
      return;
    }

    if (selectedBlockIds.length === 0) {
      setError(
        "Kamida bitta matn blokini tanlang."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/articles",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            issue_id: page.issue_id,
            page_id: page.id,
            category_id: categoryId
              ? Number(categoryId)
              : null,
            text_block_ids:
              selectedBlockIds,
            source_image_id:
              sourceImageId
                ? Number(sourceImageId)
                : null,
            title: title.trim(),
            summary: summary.trim(),
            author: author.trim(),
            is_featured: false,
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
            "Maqolani yaratib bo‘lmadi.",
          ),
        );
      }

      const result =
        data as ArticleCreateResponse;

      setSuccess(
        `${result.article.title} maqolasi yaratildi.`
      );

      setSummary("");
      setAuthor("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Maqola yaratishda xatolik.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canEdit) {
    return null;
  }

  return (
    <section className="content-panel article-composer-panel">
      <div className="panel-heading">
        <div>
          <h2>Elektron maqola yaratish</h2>

          <p>
            Betdagi matn bloklari va rasmni
            bitta maqolaga birlashtiring.
          </p>
        </div>
      </div>

      <form
        className="article-composer-form"
        onSubmit={handleSubmit}
      >
        <div className="article-composer-fields">
          <div className="form-field form-field-full">
            <label htmlFor="article-title">
              Maqola sarlavhasi
            </label>

            <input
              id="article-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              maxLength={300}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="article-category">
              Bo‘lim
            </label>

            <select
              id="article-category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value
                )
              }
              disabled={isSubmitting}
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
            <label htmlFor="article-author">
              Muallif
            </label>

            <input
              id="article-author"
              type="text"
              value={author}
              onChange={(event) =>
                setAuthor(
                  event.target.value
                )
              }
              placeholder="Muallif ismi"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="article-summary">
              Qisqacha mazmun
            </label>

            <textarea
              id="article-summary"
              value={summary}
              onChange={(event) =>
                setSummary(
                  event.target.value
                )
              }
              rows={4}
              placeholder="Maqola uchun qisqa tavsif"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="article-image">
              Asosiy rasm
            </label>

            <select
              id="article-image"
              value={sourceImageId}
              onChange={(event) =>
                setSourceImageId(
                  event.target.value
                )
              }
              disabled={isSubmitting}
            >
              <option value="">
                Asosiy rasmsiz
              </option>

              {availableImages.map(
                (image, index) => (
                  <option
                    key={image.id}
                    value={image.id}
                  >
                    {index + 1}-rasm —{" "}
                    {image.width}×
                    {image.height}px
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div className="article-block-section">
          <div className="article-block-heading">
            <div>
              <h3>Matn bloklari</h3>

              <p>
                Maqolaga kiradigan bloklarni
                o‘qilish tartibida tanlang.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={selectAllBlocks}
                disabled={isSubmitting}
              >
                Barchasini tanlash
              </button>

              <button
                type="button"
                onClick={clearBlocks}
                disabled={isSubmitting}
              >
                Tozalash
              </button>
            </div>
          </div>

          <div className="article-text-blocks">
            {availableBlocks.map(
              (block) => {
                const text =
                  getBlockText(block);

                const isSelected =
                  selectedBlockIds.includes(
                    block.id
                  );

                return (
                  <label
                    key={block.id}
                    className={
                      isSelected
                        ? "article-text-block article-text-block-selected"
                        : "article-text-block"
                    }
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleBlock(
                          block.id
                        )
                      }
                      disabled={
                        isSubmitting
                      }
                    />

                    <span>
                      <strong>
                        {
                          block.block_type_display
                        }
                      </strong>

                      <small>
                        Blok #{block.block_index}
                      </small>

                      <p>
                        {text.length > 450
                          ? `${text.slice(
                              0,
                              450,
                            )}…`
                          : text}
                      </p>
                    </span>
                  </label>
                );
              },
            )}
          </div>
        </div>

        {availableImages.length > 0 ? (
          <div className="article-source-images">
            {availableImages.map(
              (image) => (
                <button
                  key={image.id}
                  type="button"
                  className={
                    sourceImageId ===
                    String(image.id)
                      ? "article-source-image article-source-image-selected"
                      : "article-source-image"
                  }
                  onClick={() =>
                    setSourceImageId(
                      String(image.id)
                    )
                  }
                  disabled={isSubmitting}
                >
                  <img
                    src={image.image}
                    alt={
                      image.alt_text ||
                      "Ajratilgan rasm"
                    }
                  />
                </button>
              ),
            )}
          </div>
        ) : null}

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

        <div className="form-actions article-form-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Maqola yaratilmoqda..."
              : "Elektron maqola yaratish"}
          </button>
        </div>
      </form>
    </section>
  );
}