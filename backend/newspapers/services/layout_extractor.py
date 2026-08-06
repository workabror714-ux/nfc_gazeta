from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from typing import Any

import pymupdf
from django.core.files.base import ContentFile

from ..models import Page, PageImage, PageTextBlock


logger = logging.getLogger(__name__)

MIN_IMAGE_WIDTH = 90
MIN_IMAGE_HEIGHT = 60
MIN_IMAGE_AREA = 8_000

BOLD_FONT_MARKERS = (
    "bold",
    "black",
    "semibold",
    "semi-bold",
    "demi",
    "heavy",
)


@dataclass(frozen=True)
class PageLayoutExtractionResult:
    text_block_count: int
    image_count: int
    skipped_image_count: int


def normalize_block_text(text: str) -> str:
    lines = [
        " ".join(line.split())
        for line in text.splitlines()
        if " ".join(line.split())
    ]

    return "\n".join(lines).strip()


def safe_bbox(
    block: dict[str, Any],
) -> tuple[float, float, float, float]:
    bbox = block.get("bbox")

    if (
        not isinstance(bbox, (tuple, list))
        or len(bbox) != 4
    ):
        return 0.0, 0.0, 0.0, 0.0

    try:
        return (
            float(bbox[0]),
            float(bbox[1]),
            float(bbox[2]),
            float(bbox[3]),
        )
    except (TypeError, ValueError):
        return 0.0, 0.0, 0.0, 0.0


def extract_text_block_data(
    block: dict[str, Any],
) -> tuple[str, float, str, bool]:
    line_texts: list[str] = []
    font_sizes: list[float] = []
    font_names: list[str] = []

    for line in block.get("lines", []):
        span_texts: list[str] = []

        for span in line.get("spans", []):
            text = str(span.get("text", ""))

            if text:
                span_texts.append(text)

            try:
                font_size = float(span.get("size", 0))
            except (TypeError, ValueError):
                font_size = 0

            if font_size > 0:
                font_sizes.append(font_size)

            font_name = str(span.get("font", "")).strip()

            if font_name:
                font_names.append(font_name)

        line_text = "".join(span_texts).strip()

        if line_text:
            line_texts.append(line_text)

    text = normalize_block_text("\n".join(line_texts))
    maximum_font_size = max(font_sizes) if font_sizes else 0
    main_font_name = font_names[0] if font_names else ""
    lower_font_names = " ".join(font_names).lower()
    is_bold = any(
        marker in lower_font_names
        for marker in BOLD_FONT_MARKERS
    )

    return (
        text,
        maximum_font_size,
        main_font_name,
        is_bold,
    )


def classify_text_block(
    *,
    text: str,
    font_size: float,
    is_bold: bool,
) -> str:
    text_length = len(text)

    if font_size >= 15 and text_length <= 350:
        return PageTextBlock.BlockType.TITLE

    if is_bold and font_size >= 12 and text_length <= 280:
        return PageTextBlock.BlockType.TITLE

    if 0 < font_size <= 9 and text_length <= 400:
        return PageTextBlock.BlockType.CAPTION

    return PageTextBlock.BlockType.TEXT


def render_page_clip(
    pdf_page: pymupdf.Page,
    bbox: tuple[float, float, float, float],
) -> tuple[bytes, int, int]:
    clip_rect = pymupdf.Rect(*bbox) & pdf_page.rect

    if clip_rect.is_empty or clip_rect.is_infinite:
        raise ValueError("Rasm hududi noto‘g‘ri.")

    pixmap = pdf_page.get_pixmap(
        dpi=200,
        colorspace=pymupdf.csRGB,
        clip=clip_rect,
        alpha=False,
        annots=False,
    )

    return (
        pixmap.tobytes("png"),
        pixmap.width,
        pixmap.height,
    )


def render_image_block(
    pdf_page: pymupdf.Page,
    block: dict[str, Any],
) -> tuple[bytes, int, int]:
    image_bytes = block.get("image")

    if isinstance(image_bytes, (bytes, bytearray)):
        try:
            source_pixmap = pymupdf.Pixmap(bytes(image_bytes))

            if source_pixmap.n - source_pixmap.alpha > 3:
                converted_pixmap = pymupdf.Pixmap(
                    pymupdf.csRGB,
                    source_pixmap,
                )
            else:
                converted_pixmap = source_pixmap

            return (
                converted_pixmap.tobytes("png"),
                converted_pixmap.width,
                converted_pixmap.height,
            )
        except Exception:
            logger.debug(
                "Embedded image conversion failed; using clip fallback.",
                exc_info=True,
            )

    return render_page_clip(
        pdf_page,
        safe_bbox(block),
    )


def clear_existing_layout(
    database_page: Page,
) -> None:
    existing_images = list(
        database_page.extracted_images.all()
    )

    for existing_image in existing_images:
        if existing_image.image:
            existing_image.image.delete(save=False)

    database_page.extracted_images.all().delete()
    database_page.text_blocks.all().delete()


def is_usable_image(
    width: int,
    height: int,
) -> bool:
    return (
        width >= MIN_IMAGE_WIDTH
        and height >= MIN_IMAGE_HEIGHT
        and width * height >= MIN_IMAGE_AREA
    )


def save_extracted_image(
    *,
    database_page: Page,
    block_index: int,
    reading_order: int,
    bbox: tuple[float, float, float, float],
    png_bytes: bytes,
    width: int,
    height: int,
    known_checksums: set[str],
) -> bool:
    if not is_usable_image(width, height):
        return False

    checksum = hashlib.sha256(png_bytes).hexdigest()

    if checksum in known_checksums:
        return False

    known_checksums.add(checksum)
    x0, y0, x1, y1 = bbox

    database_image = PageImage(
        page=database_page,
        block_index=block_index,
        x0=x0,
        y0=y0,
        x1=x1,
        y1=y1,
        width=width,
        height=height,
        reading_order=reading_order,
        checksum=checksum,
        is_ignored=False,
    )

    database_image.image.save(
        f"block-{block_index}.png",
        ContentFile(png_bytes),
        save=False,
    )
    database_image.save()

    return True


def extract_images_from_image_info(
    *,
    pdf_page: pymupdf.Page,
    database_page: Page,
    start_index: int,
    known_checksums: set[str],
) -> tuple[int, int]:
    """
    `get_text("dict")` rasm bloklarini bermagan PDF'lar uchun fallback.

    Xref tasvirni xom holatda dekodlash o‘rniga, sahifadagi bbox hududini
    render qilamiz. Bu maska, transparency va CMYK tasvirlarda ham ishlaydi.
    """

    image_count = 0
    skipped_count = 0

    try:
        image_infos = pdf_page.get_image_info(
            hashes=True,
            xrefs=True,
        )
    except Exception:
        logger.warning(
            "Page %s image-info extraction failed.",
            database_page.page_number,
            exc_info=True,
        )

        return 0, 1

    for fallback_index, image_info in enumerate(image_infos):
        bbox = safe_bbox(image_info)

        try:
            png_bytes, width, height = render_page_clip(
                pdf_page,
                bbox,
            )
        except Exception:
            skipped_count += 1
            continue

        block_index = start_index + fallback_index

        saved = save_extracted_image(
            database_page=database_page,
            block_index=block_index,
            reading_order=block_index,
            bbox=bbox,
            png_bytes=png_bytes,
            width=width,
            height=height,
            known_checksums=known_checksums,
        )

        if saved:
            image_count += 1
        else:
            skipped_count += 1

    return image_count, skipped_count


def extract_page_layout(
    pdf_page: pymupdf.Page,
    database_page: Page,
) -> PageLayoutExtractionResult:
    clear_existing_layout(database_page)

    layout = pdf_page.get_text(
        "dict",
        sort=True,
    )
    blocks = layout.get("blocks", [])

    text_block_objects: list[PageTextBlock] = []
    image_count = 0
    skipped_image_count = 0
    known_image_checksums: set[str] = set()

    for reading_order, block in enumerate(blocks):
        block_type = int(block.get("type", -1))
        bbox = safe_bbox(block)
        x0, y0, x1, y1 = bbox

        if block_type == 0:
            (
                text,
                font_size,
                font_name,
                is_bold,
            ) = extract_text_block_data(block)

            if not text:
                continue

            text_block_objects.append(
                PageTextBlock(
                    page=database_page,
                    block_index=reading_order,
                    block_type=classify_text_block(
                        text=text,
                        font_size=font_size,
                        is_bold=is_bold,
                    ),
                    raw_text=text,
                    final_text=text,
                    x0=x0,
                    y0=y0,
                    x1=x1,
                    y1=y1,
                    font_size=font_size,
                    font_name=font_name,
                    is_bold=is_bold,
                    reading_order=reading_order,
                    is_ignored=False,
                )
            )
            continue

        if block_type != 1:
            continue

        try:
            png_bytes, width, height = render_image_block(
                pdf_page,
                block,
            )
        except Exception:
            logger.warning(
                "Page %s image block %s could not be rendered.",
                database_page.page_number,
                reading_order,
                exc_info=True,
            )
            skipped_image_count += 1
            continue

        saved = save_extracted_image(
            database_page=database_page,
            block_index=reading_order,
            reading_order=reading_order,
            bbox=bbox,
            png_bytes=png_bytes,
            width=width,
            height=height,
            known_checksums=known_image_checksums,
        )

        if saved:
            image_count += 1
        else:
            skipped_image_count += 1

    if image_count == 0:
        (
            fallback_image_count,
            fallback_skipped_count,
        ) = extract_images_from_image_info(
            pdf_page=pdf_page,
            database_page=database_page,
            start_index=len(blocks),
            known_checksums=known_image_checksums,
        )

        image_count += fallback_image_count
        skipped_image_count += fallback_skipped_count

    if text_block_objects:
        PageTextBlock.objects.bulk_create(
            text_block_objects
        )

    return PageLayoutExtractionResult(
        text_block_count=len(text_block_objects),
        image_count=image_count,
        skipped_image_count=skipped_image_count,
    )
