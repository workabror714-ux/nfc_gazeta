from __future__ import annotations

import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path

import pymupdf
from django.core.files.base import ContentFile

from ..models import Issue, Page
from .ocr_service import (
    OcrProcessingError,
    extract_page_text_with_ocr,
    should_run_ocr,
)
from .layout_extractor import (
    extract_page_layout,
)

logger = logging.getLogger(__name__)


class PdfProcessingError(Exception):
    """PDF qayta ishlanmaganda chiqariladigan xavfsiz xatolik."""


@dataclass(frozen=True)
class PdfProcessingResult:
    page_count: int
    text_pages: int
    ocr_pages: int
    empty_text_pages: int
    ocr_failed_pages: int
    text_block_count: int
    image_count: int
    skipped_image_count: int


@dataclass(frozen=True)
class PageOcrResult:
    page_id: int
    page_number: int
    character_count: int
    used_as_final_text: bool


def normalize_extracted_text(
    text: str,
) -> str:
    normalized_lines: list[str] = []

    for line in text.splitlines():
        cleaned_line = " ".join(
            line.split()
        )

        if cleaned_line:
            normalized_lines.append(
                cleaned_line
            )
        elif (
            normalized_lines
            and normalized_lines[-1] != ""
        ):
            normalized_lines.append("")

    return "\n".join(
        normalized_lines
    ).strip()


def choose_best_text(
    native_text: str,
    ocr_text: str,
) -> str:
    """
    Native PDF matni va OCR matnidan mazmunlirog‘ini tanlaydi.
    Ikkala asl natija bazada alohida saqlanadi.
    """

    native_text = native_text.strip()
    ocr_text = ocr_text.strip()

    if not native_text:
        return ocr_text

    if not ocr_text:
        return native_text

    if len(ocr_text) > len(native_text):
        return ocr_text

    return native_text


def estimate_extraction_confidence(
    native_text: str,
    ocr_text: str,
    final_text: str,
) -> int:
    """
    Bu Tesseract'ning haqiqiy confidence qiymati emas.
    Admin interfeysi uchun ichki taxminiy ko‘rsatkich.
    """

    if not final_text:
        return 0

    if ocr_text and final_text == ocr_text:
        return 75

    if native_text:
        return 95

    return 50


def copy_pdf_to_temporary_file(
    issue: Issue,
) -> Path:
    if not issue.original_pdf:
        raise PdfProcessingError(
            "Ushbu nashrga PDF fayl yuklanmagan."
        )

    temporary_file = (
        tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False,
        )
    )

    temporary_path = Path(
        temporary_file.name
    )

    try:
        issue.original_pdf.open("rb")

        for chunk in issue.original_pdf.chunks(
            chunk_size=1024 * 1024
        ):
            temporary_file.write(chunk)

        temporary_file.flush()

    except Exception as exc:
        temporary_path.unlink(
            missing_ok=True
        )

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


def delete_existing_pages(
    issue: Issue,
) -> None:
    existing_pages = list(
        issue.pages.prefetch_related(
            "extracted_images"
        ).all()
    )

    for existing_page in existing_pages:
        for extracted_image in (
            existing_page
            .extracted_images
            .all()
        ):
            if extracted_image.image:
                extracted_image.image.delete(
                    save=False
                )

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
        temporary_path = (
            copy_pdf_to_temporary_file(
                issue
            )
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
            total_pages = (
                document.page_count
            )

            if total_pages < 1:
                raise PdfProcessingError(
                    "PDF ichida hech qanday bet topilmadi."
                )

            delete_existing_pages(issue)

            text_pages = 0
            ocr_pages = 0
            empty_text_pages = 0
            ocr_failed_pages = 0
            total_text_blocks = 0
            total_images = 0
            total_skipped_images = 0

            first_page_image: (
                bytes | None
            ) = None

            for page_index in range(
                total_pages
            ):
                page_number = (
                    page_index + 1
                )

                pdf_page = (
                    document.load_page(
                        page_index
                    )
                )

                pixmap = (
                    pdf_page.get_pixmap(
                        dpi=render_dpi,
                        colorspace=(
                            pymupdf.csRGB
                        ),
                        alpha=False,
                        annots=True,
                    )
                )

                page_image_bytes = (
                    pixmap.tobytes("png")
                )

                if page_index == 0:
                    first_page_image = (
                        page_image_bytes
                    )

                native_text = (
                    normalize_extracted_text(
                        pdf_page.get_text(
                            "text",
                            sort=True,
                        )
                    )
                )

                ocr_text = ""

                if should_run_ocr(
                    native_text
                ):
                    try:
                        ocr_result = (
                            extract_page_text_with_ocr(
                                pdf_page
                            )
                        )

                        ocr_text = (
                            ocr_result.text
                        )

                        ocr_pages += 1

                    except OcrProcessingError:
                        logger.warning(
                            "Issue %s, page %s OCR failed.",
                            issue.pk,
                            page_number,
                        )

                        ocr_failed_pages += 1

                final_text = (
                    choose_best_text(
                        native_text,
                        ocr_text,
                    )
                )

                if final_text:
                    text_pages += 1

                    processing_status = (
                        Page
                        .ProcessingStatus
                        .READY
                    )
                else:
                    empty_text_pages += 1

                    processing_status = (
                        Page
                        .ProcessingStatus
                        .REVIEW
                    )

                confidence = (
                    estimate_extraction_confidence(
                        native_text,
                        ocr_text,
                        final_text,
                    )
                )

                database_page = Page(
                    issue=issue,
                    page_number=page_number,
                    raw_text=native_text,
                    ocr_text=ocr_text,
                    final_text=final_text,
                    processing_status=(
                        processing_status
                    ),
                    extraction_confidence=(
                        confidence
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

                layout_result = (
                    extract_page_layout(
                        pdf_page,
                        database_page,
                    )
                )

                total_text_blocks += (
                    layout_result
                    .text_block_count
                )

                total_images += (
                    layout_result
                    .image_count
                )

                total_skipped_images += (
                    layout_result
                    .skipped_image_count
                )

                progress = int(
                    page_number
                    / total_pages
                    * 100
                )

                Issue.objects.filter(
                    pk=issue.pk
                ).update(
                    processing_progress=(
                        progress
                    ),
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

            issue.status = (
                Issue.Status.REVIEW
            )
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
                ocr_pages=ocr_pages,
                empty_text_pages=(
                    empty_text_pages
                ),
                ocr_failed_pages=(
                    ocr_failed_pages
                ),
                text_block_count=(
                    total_text_blocks
                ),
                image_count=total_images,
                skipped_image_count=(
                    total_skipped_images
                ),
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


def run_ocr_for_database_page(
    database_page: Page,
) -> PageOcrResult:
    """
    Bitta mavjud Page yozuvi uchun OCR'ni qayta ishlatadi.
    """

    issue = database_page.issue

    if not issue.original_pdf:
        raise PdfProcessingError(
            "Ushbu nashrning original PDF fayli topilmadi."
        )

    temporary_path: Path | None = None

    try:
        temporary_path = (
            copy_pdf_to_temporary_file(
                issue
            )
        )

        document = pymupdf.open(
            temporary_path
        )

        with document:
            page_index = (
                database_page.page_number
                - 1
            )

            if (
                page_index < 0
                or page_index
                >= document.page_count
            ):
                raise PdfProcessingError(
                    "PDF ichida ushbu bet topilmadi."
                )

            pdf_page = (
                document.load_page(
                    page_index
                )
            )

            ocr_result = (
                extract_page_text_with_ocr(
                    pdf_page
                )
            )

            native_text = (
                database_page.raw_text
                or ""
            )

            final_text = choose_best_text(
                native_text,
                ocr_result.text,
            )

            used_as_final_text = (
                final_text
                == ocr_result.text
            )

            database_page.ocr_text = (
                ocr_result.text
            )
            database_page.final_text = (
                final_text
            )
            database_page.processing_status = (
                Page
                .ProcessingStatus
                .REVIEW
            )
            database_page.is_approved = False
            database_page.extraction_confidence = (
                estimate_extraction_confidence(
                    native_text,
                    ocr_result.text,
                    final_text,
                )
            )

            database_page.save(
                update_fields=[
                    "ocr_text",
                    "final_text",
                    "processing_status",
                    "is_approved",
                    "extraction_confidence",
                    "updated_at",
                ]
            )

            return PageOcrResult(
                page_id=database_page.id,
                page_number=(
                    database_page.page_number
                ),
                character_count=(
                    ocr_result.character_count
                ),
                used_as_final_text=(
                    used_as_final_text
                ),
            )

    except OcrProcessingError:
        raise

    except PdfProcessingError:
        raise

    except Exception as exc:
        logger.exception(
            "Page ID %s OCR failed.",
            database_page.pk,
        )

        raise PdfProcessingError(
            "Betni OCR orqali qayta ishlashda xatolik yuz berdi."
        ) from exc

    finally:
        if temporary_path:
            temporary_path.unlink(
                missing_ok=True
            )