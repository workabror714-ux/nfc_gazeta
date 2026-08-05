"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useState,
} from "react";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  ExtractedPageImage,
  PageImageUpdateResponse,
} from "@/lib/issues";


interface PageImagesPanelProps {
  images: ExtractedPageImage[];
  canEdit: boolean;
  onImageUpdated: (
    image: ExtractedPageImage,
  ) => void;
}


interface ImageEditorCardProps {
  image: ExtractedPageImage;
  canEdit: boolean;
  onUpdated: (
    image: ExtractedPageImage,
  ) => void;
}


function ImageEditorCard({
  image,
  canEdit,
  onUpdated,
}: ImageEditorCardProps) {
  const [caption, setCaption] =
    useState(image.caption);

  const [altText, setAltText] =
    useState(image.alt_text);

  const [isIgnored, setIsIgnored] =
    useState(image.is_ignored);

  const [isSaving, setIsSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  async function saveImage() {
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/page-images/${image.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            caption,
            alt_text: altText,
            is_ignored: isIgnored,
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
            "Rasmni saqlab bo‘lmadi.",
          ),
        );
      }

      const result =
        data as PageImageUpdateResponse;

      setCaption(
        result.image.caption
      );
      setAltText(
        result.image.alt_text
      );
      setIsIgnored(
        result.image.is_ignored
      );

      onUpdated(result.image);
      setMessage(result.detail);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Rasmni saqlashda xatolik.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article
      className={
        isIgnored
          ? "extracted-image-card image-card-ignored"
          : "extracted-image-card"
      }
    >
      <div className="extracted-image-preview">
        <img
          src={image.image}
          alt={
            altText
            || `${image.block_index}-rasm`
          }
          loading="lazy"
        />

        {isIgnored ? (
          <span className="ignored-image-label">
            Yashirilgan
          </span>
        ) : null}
      </div>

      <div className="extracted-image-form">
        <div className="image-size-label">
          {image.width} × {image.height}px
        </div>

        <div className="form-field">
          <label
            htmlFor={`caption-${image.id}`}
          >
            Rasm izohi
          </label>

          <textarea
            id={`caption-${image.id}`}
            value={caption}
            onChange={(event) =>
              setCaption(
                event.target.value
              )
            }
            rows={3}
            disabled={!canEdit || isSaving}
            placeholder="Gazetadagi rasm osti izohi"
          />
        </div>

        <div className="form-field">
          <label
            htmlFor={`alt-${image.id}`}
          >
            Rasm tavsifi
          </label>

          <textarea
            id={`alt-${image.id}`}
            value={altText}
            onChange={(event) =>
              setAltText(
                event.target.value
              )
            }
            rows={3}
            disabled={!canEdit || isSaving}
            placeholder="Ko‘zi ojiz foydalanuvchilar uchun tavsif"
          />
        </div>

        <label className="image-ignore-control">
          <input
            type="checkbox"
            checked={isIgnored}
            onChange={(event) =>
              setIsIgnored(
                event.target.checked
              )
            }
            disabled={!canEdit || isSaving}
          />

          <span>
            Bu rasmni foydalanuvchi saytida ko‘rsatmaslik
          </span>
        </label>

        {message ? (
          <p className="inline-success">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="inline-error">
            {error}
          </p>
        ) : null}

        {canEdit ? (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              void saveImage();
            }}
            disabled={isSaving}
          >
            {isSaving
              ? "Saqlanmoqda..."
              : "Rasmni saqlash"}
          </button>
        ) : null}
      </div>
    </article>
  );
}


export function PageImagesPanel({
  images,
  canEdit,
  onImageUpdated,
}: PageImagesPanelProps) {
  return (
    <section className="content-panel extracted-images-panel">
      <div className="panel-heading">
        <div>
          <h2>Betdan ajratilgan rasmlar</h2>

          <p>
            Logotip, reklama yoki keraksiz tasvirlarni yashiring.
          </p>
        </div>

        <span className="page-approval-count">
          {images.length} ta rasm
        </span>
      </div>

      {images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            ▧
          </div>

          <h3>Rasm topilmadi</h3>

          <p>
            Ushbu betda alohida ajratiladigan rasm mavjud emas.
          </p>
        </div>
      ) : (
        <div className="extracted-images-grid">
          {images.map((image) => (
            <ImageEditorCard
              key={image.id}
              image={image}
              canEdit={canEdit}
              onUpdated={onImageUpdated}
            />
          ))}
        </div>
      )}
    </section>
  );
}