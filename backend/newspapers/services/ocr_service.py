from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pymupdf
from django.conf import settings


class OcrProcessingError(Exception):
    """OCR bajarilmaganda qaytariladigan xavfsiz xatolik."""


class OcrConfigurationError(OcrProcessingError):
    """OCR konfiguratsiyasi noto‘g‘ri bo‘lganda chiqariladi."""


@dataclass(frozen=True)
class OcrResult:
    text: str
    language: str
    dpi: int
    character_count: int


def normalize_ocr_text(text: str) -> str:
    """
    OCR natijasidagi ortiqcha bo‘sh joylar va
    bo‘sh qatorlarni tozalaydi.
    """

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


def get_configured_languages() -> str:
    return str(
        getattr(
            settings,
            "OCR_LANGUAGES",
            "uzb+uzb_cyrl+rus+eng",
        )
    ).strip()


def get_tessdata_path() -> Path:
    path_value = getattr(
        settings,
        "OCR_TESSDATA_PATH",
        "",
    )

    if not path_value:
        raise OcrConfigurationError(
            "OCR tessdata papkasi sozlanmagan."
        )

    return Path(path_value)


def validate_ocr_configuration() -> tuple[
    str,
    int,
    Path,
]:
    if not getattr(
        settings,
        "OCR_ENABLED",
        True,
    ):
        raise OcrConfigurationError(
            "OCR funksiyasi o‘chirilgan."
        )

    languages = get_configured_languages()

    if not languages:
        raise OcrConfigurationError(
            "OCR tillari ko‘rsatilmagan."
        )

    dpi = int(
        getattr(
            settings,
            "OCR_DPI",
            300,
        )
    )

    if dpi < 72 or dpi > 600:
        raise OcrConfigurationError(
            "OCR DPI qiymati 72–600 oralig‘ida bo‘lishi kerak."
        )

    tessdata_path = get_tessdata_path()

    if not tessdata_path.exists():
        raise OcrConfigurationError(
            "OCR tessdata papkasi topilmadi: "
            f"{tessdata_path}"
        )

    if not tessdata_path.is_dir():
        raise OcrConfigurationError(
            "OCR tessdata manzili papka emas."
        )

    language_codes = [
        code.strip()
        for code in languages.split("+")
        if code.strip()
    ]

    missing_files = [
        f"{code}.traineddata"
        for code in language_codes
        if not (
            tessdata_path
            / f"{code}.traineddata"
        ).exists()
    ]

    if missing_files:
        raise OcrConfigurationError(
            "Quyidagi OCR til fayllari topilmadi: "
            + ", ".join(missing_files)
        )

    return (
        languages,
        dpi,
        tessdata_path,
    )


def should_run_ocr(
    native_text: str,
) -> bool:
    """
    Bet OCR talab qilishini oddiy qoida orqali aniqlaydi.

    Matn yo‘q, juda qisqa yoki ko‘p buzilgan belgi
    bo‘lsa OCR ishlatiladi.
    """

    if not getattr(
        settings,
        "OCR_ENABLED",
        True,
    ):
        return False

    text = native_text.strip()

    minimum_length = int(
        getattr(
            settings,
            "OCR_MIN_TEXT_LENGTH",
            80,
        )
    )

    if len(text) < minimum_length:
        return True

    replacement_character_count = (
        text.count("\ufffd")
    )

    if replacement_character_count > 3:
        return True

    alphanumeric_count = sum(
        character.isalnum()
        for character in text
    )

    if (
        len(text) > 0
        and alphanumeric_count
        / len(text)
        < 0.25
    ):
        return True

    return False


def extract_page_text_with_ocr(
    pdf_page: pymupdf.Page,
) -> OcrResult:
    languages, dpi, tessdata_path = (
        validate_ocr_configuration()
    )

    try:
        text_page = (
            pdf_page.get_textpage_ocr(
                language=languages,
                dpi=dpi,
                full=True,
                tessdata=str(
                    tessdata_path
                ),
            )
        )

        extracted_text = (
            pdf_page.get_text(
                "text",
                textpage=text_page,
                sort=True,
            )
        )

    except Exception as exc:
        raise OcrProcessingError(
            "Betdagi matnni OCR orqali aniqlab bo‘lmadi."
        ) from exc

    normalized_text = normalize_ocr_text(
        extracted_text
    )

    if not normalized_text:
        raise OcrProcessingError(
            "OCR ushbu betdan matn topa olmadi."
        )

    return OcrResult(
        text=normalized_text,
        language=languages,
        dpi=dpi,
        character_count=len(
            normalized_text
        ),
    )