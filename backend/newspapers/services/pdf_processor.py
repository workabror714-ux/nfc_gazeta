from __future__ import annotations

import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path

import pymupdf
from django.core.files.base import ContentFile

from ..models import Issue, Page


logger = logging.getLogger(__name__)


class PdfProcessingError(Exception):
    """PDF qayta ishlanmaganda chiqariladigan xavfsiz xatolik."""


@dataclass(frozen=True)
class PdfProcessingResult:
    page_count: int
    text_pages: int
    empty_text_pages: int


def normalize_extracted_text(text: str) -> str:
    """
    PDF'dan olingan matndagi ortiqcha bo‘sh joylarni
    kamaytiradi, lekin paragraflarni saqlab qoladi.
    """

    normalized_lines: list[str] = []

    for line in text.splitlines():
        cleaned_line = " ".join(line.split())

        if cleaned_line:
            normalized_lines.append(cleaned_line)
        elif (
            normalized_lines
            and normalized_lines[-1] != ""
        ):
            normalized_lines.append("")

    return "\n".join(normalized_lines).strip()


def copy_pdf_to_temporary_file(issue: Issue) -> Path:
    """
    PDF lokal diskda yoki cloud storage'da turganidan
    qat’i nazar, uni vaqtinchalik lokal faylga ko‘chiradi.

    Bu keyinchalik S3 yoki Supabase Storage ishlatganda
    ham processorni o‘zgartirmaslik uchun kerak.
    """

    if not issue.original_pdf:
        raise PdfProcessingError(
            "Ushbu nashrga PDF fayl yuklanmagan."
        )

    temporary_file = tempfile.NamedTemporaryFile(
        suffix=".pdf",
        delete=False,
    )

    temporary_path = Path(temporary_file.name)

    try:
        issue.original_pdf.open("rb")

        for chunk in issue.original_pdf.chunks(
            chunk_size=1024 * 1024
        ):
            temporary_file.write(chunk)

        temporary_file.flush()
    except Exception as exc:
        temporary_path.unlink(missing_ok=True)

        raise PdfProcessingError(
            "PDF faylni vaqtinchalik xotiraga ko‘chirib bo‘lmadi."
        ) from exc
    finally:
        temporary_file.close()

        try:
            issue.original_pdf.close()
        except Exception:
            pass

    return temporary_path


def delete_existing_pages(issue: Issue) -> None:
    """
    Nashr qayta ishlanayotgan bo‘lsa, eski bet yozuvlari
    va ularga tegishli fayllarni tozalaydi.
    """

    existing_pages = list(
        issue.pages.all()
    )

    for existing_page in existing_pages:
        if existing_page.page_image:
            existing_page.page_image.delete(
                save=False
            )

        if existing_page.audio:
            existing_page.audio.delete(
                save=False
            )

    issue.pages.all().delete()


def mark_issue_failed(
    issue: Issue,
    message: str,
) -> None:
    Issue.objects.filter(
        pk=issue.pk
    ).update(
        status=Issue.Status.FAILED,
        is_public=False,
        processing_progress=0,
        processing_error=message,
        page_count=0,
    )


def process_issue_pdf(
    issue: Issue,
    *,
    render_dpi: int = 150,
) -> PdfProcessingResult:
    """
    PDF'ni betlarga ajratadi.

    Har bir bet uchun:
    - PNG preview yaratadi
    - matnni ajratadi
    - Page modelini yaratadi
    - holat va progressni yangilaydi
    """

    if not issue.original_pdf:
        raise PdfProcessingError(
            "Avval gazetaning PDF faylini yuklang."
        )

    Issue.objects.filter(
        pk=issue.pk
    ).update(
        status=Issue.Status.PROCESSING,
        is_public=False,
        processing_progress=0,
        processing_error="",
        page_count=0,
    )

    temporary_path: Path | None = None

    try:
        temporary_path = copy_pdf_to_temporary_file(
            issue
        )

        try:
            document = pymupdf.open(
                temporary_path
            )
        except (
            pymupdf.FileDataError,
            pymupdf.EmptyFileError,
        ) as exc:
            raise PdfProcessingError(
                "PDF fayl buzilgan yoki uni ochib bo‘lmadi."
            ) from exc

        with document:
            total_pages = document.page_count

            if total_pages < 1:
                raise PdfProcessingError(
                    "PDF ichida hech qanday bet topilmadi."
                )

            delete_existing_pages(issue)

            text_pages = 0
            empty_text_pages = 0
            first_page_image: bytes | None = None

            for page_index in range(total_pages):
                page_number = page_index + 1

                pdf_page = document.load_page(
                    page_index
                )

                pixmap = pdf_page.get_pixmap(
                    dpi=render_dpi,
                    colorspace=pymupdf.csRGB,
                    alpha=False,
                    annots=True,
                )

                page_image_bytes = pixmap.tobytes(
                    "png"
                )

                if page_index == 0:
                    first_page_image = (
                        page_image_bytes
                    )

                extracted_text = normalize_extracted_text(
                    pdf_page.get_text(
                        "text",
                        sort=True,
                    )
                )

                if extracted_text:
                    text_pages += 1

                    processing_status = (
                        Page.ProcessingStatus.READY
                    )
                else:
                    empty_text_pages += 1

                    processing_status = (
                        Page.ProcessingStatus.REVIEW
                    )

                database_page = Page(
                    issue=issue,
                    page_number=page_number,
                    raw_text=extracted_text,
                    final_text=extracted_text,
                    processing_status=processing_status,
                    extraction_confidence=(
                        100 if extracted_text else 0
                    ),
                    is_approved=False,
                )

                database_page.page_image.save(
                    f"page-{page_number}.png",
                    ContentFile(
                        page_image_bytes
                    ),
                    save=False,
                )

                database_page.save()

                progress = int(
                    page_number
                    / total_pages
                    * 100
                )

                Issue.objects.filter(
                    pk=issue.pk
                ).update(
                    processing_progress=progress,
                    page_count=page_number,
                )

            issue.refresh_from_db()

            if (
                first_page_image
                and not issue.cover_image
            ):
                issue.cover_image.save(
                    "cover.png",
                    ContentFile(
                        first_page_image
                    ),
                    save=False,
                )

            issue.status = Issue.Status.REVIEW
            issue.is_public = False
            issue.page_count = total_pages
            issue.processing_progress = 100
            issue.processing_error = ""

            issue.save(
                update_fields=[
                    "cover_image",
                    "status",
                    "is_public",
                    "page_count",
                    "processing_progress",
                    "processing_error",
                    "updated_at",
                ]
            )

            return PdfProcessingResult(
                page_count=total_pages,
                text_pages=text_pages,
                empty_text_pages=empty_text_pages,
            )

    except PdfProcessingError as exc:
        delete_existing_pages(issue)

        mark_issue_failed(
            issue,
            str(exc),
        )

        raise

    except Exception as exc:
        logger.exception(
            "Issue ID %s PDF processing failed.",
            issue.pk,
        )

        delete_existing_pages(issue)

        safe_message = (
            "PDF hujjatini qayta ishlashda "
            "ichki xatolik yuz berdi."
        )

        mark_issue_failed(
            issue,
            safe_message,
        )

        raise PdfProcessingError(
            safe_message
        ) from exc

    finally:
        if temporary_path:
            temporary_path.unlink(
                missing_ok=True
            )