from pathlib import Path

from django.conf import settings
from django.core.validators import (
    FileExtensionValidator,
    MaxValueValidator,
)
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Yaratilgan vaqt",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Yangilangan vaqt",
    )

    class Meta:
        abstract = True


def issue_pdf_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    return (
        f"newspapers/{instance.newspaper.slug}/"
        f"{instance.year}/{instance.slug}/"
        f"original{extension}"
    )


def issue_cover_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    return (
        f"newspapers/{instance.newspaper.slug}/"
        f"{instance.year}/{instance.slug}/"
        f"cover{extension}"
    )


def page_image_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    return (
        f"newspapers/{instance.issue.newspaper.slug}/"
        f"{instance.issue.year}/{instance.issue.slug}/"
        f"pages/page-{instance.page_number}{extension}"
    )


def page_audio_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    return (
        f"newspapers/{instance.issue.newspaper.slug}/"
        f"{instance.issue.year}/{instance.issue.slug}/"
        f"audio/page-{instance.page_number}{extension}"
    )


def article_image_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower()

    return (
        f"newspapers/{instance.issue.newspaper.slug}/"
        f"{instance.issue.year}/{instance.issue.slug}/"
        f"articles/{instance.slug}{extension}"
    )


def extracted_image_upload_path(instance, filename: str) -> str:
    extension = Path(filename).suffix.lower() or ".png"

    return (
        f"newspapers/{instance.page.issue.newspaper.slug}/"
        f"{instance.page.issue.year}/{instance.page.issue.slug}/"
        f"pages/page-{instance.page.page_number}/"
        f"images/block-{instance.block_index}{extension}"
    )


class Newspaper(TimeStampedModel):
    name = models.CharField(
        max_length=150,
        verbose_name="Gazeta nomi",
    )
    slug = models.SlugField(
        max_length=160,
        unique=True,
    )
    description = models.TextField(
        blank=True,
        verbose_name="Tavsif",
    )
    logo = models.ImageField(
        upload_to="newspapers/logos/",
        blank=True,
        null=True,
        verbose_name="Logotip",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Faol",
    )

    class Meta:
        verbose_name = "Gazeta"
        verbose_name_plural = "Gazetalar"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Category(TimeStampedModel):
    name = models.CharField(
        max_length=100,
        verbose_name="Bo‘lim nomi",
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name="Tartib",
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name="Faol",
    )

    class Meta:
        verbose_name = "Bo‘lim"
        verbose_name_plural = "Bo‘limlar"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class Issue(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Qoralama"
        PROCESSING = "PROCESSING", "Qayta ishlanmoqda"
        REVIEW = "REVIEW", "Tekshiruvda"
        PUBLISHED = "PUBLISHED", "Nashr qilindi"
        FAILED = "FAILED", "Xatolik"
        ARCHIVED = "ARCHIVED", "Arxivlandi"

    newspaper = models.ForeignKey(
        Newspaper,
        on_delete=models.CASCADE,
        related_name="issues",
        verbose_name="Gazeta",
    )
    issue_number = models.PositiveIntegerField(
        verbose_name="Nashr soni",
    )
    year = models.PositiveIntegerField(
        verbose_name="Yil",
    )
    publication_date = models.DateField(
        verbose_name="Nashr sanasi",
    )
    title = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Sarlavha",
    )
    slug = models.SlugField(
        max_length=180,
        unique=True,
    )
    nfc_slug = models.SlugField(
        max_length=180,
        unique=True,
        verbose_name="NFC identifikatori",
    )
    description = models.TextField(
        blank=True,
        verbose_name="Qisqacha mazmun",
    )
    cover_image = models.ImageField(
        upload_to=issue_cover_upload_path,
        blank=True,
        null=True,
        verbose_name="Muqova rasmi",
    )
    original_pdf = models.FileField(
        upload_to=issue_pdf_upload_path,
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["pdf"])],
        verbose_name="Original PDF",
    )
    page_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Betlar soni",
    )
    processing_progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MaxValueValidator(100)],
        verbose_name="Qayta ishlash foizi",
    )
    processing_error = models.TextField(
        blank=True,
        verbose_name="Qayta ishlash xatosi",
    )
    estimated_audio_duration = models.PositiveIntegerField(
        default=0,
        help_text="Soniyalarda",
        verbose_name="Taxminiy audio davomiyligi",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name="Holat",
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name="Ommaga ochiq",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_issues",
        verbose_name="Yaratgan administrator",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_issues",
        verbose_name="Tasdiqlagan administrator",
    )
    published_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Nashr qilingan vaqt",
    )

    class Meta:
        verbose_name = "Gazeta soni"
        verbose_name_plural = "Gazeta sonlari"
        ordering = ["-publication_date", "-issue_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["newspaper", "year", "issue_number"],
                name="unique_newspaper_year_issue_number",
            )
        ]

    def __str__(self) -> str:
        return (
            f"{self.newspaper.name} — "
            f"{self.year}-yil, {self.issue_number}-son"
        )

    def publish(self, user=None):
        self.status = self.Status.PUBLISHED
        self.is_public = True
        self.published_at = timezone.now()

        if user:
            self.approved_by = user

        self.save(
            update_fields=[
                "status",
                "is_public",
                "published_at",
                "approved_by",
                "updated_at",
            ]
        )


class Page(TimeStampedModel):
    class ProcessingStatus(models.TextChoices):
        PENDING = "PENDING", "Navbatda"
        PROCESSING = "PROCESSING", "Qayta ishlanmoqda"
        READY = "READY", "Tayyor"
        REVIEW = "REVIEW", "Tekshiruv kerak"
        APPROVED = "APPROVED", "Tasdiqlandi"
        FAILED = "FAILED", "Xatolik"

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="pages",
        verbose_name="Gazeta soni",
    )
    page_number = models.PositiveIntegerField(
        verbose_name="Bet raqami",
    )
    page_image = models.ImageField(
        upload_to=page_image_upload_path,
        blank=True,
        null=True,
        verbose_name="Bet rasmi",
    )
    raw_text = models.TextField(
        blank=True,
        verbose_name="Ajratib olingan matn",
    )
    ocr_text = models.TextField(
        blank=True,
        verbose_name="OCR matni",
    )
    final_text = models.TextField(
        blank=True,
        verbose_name="Yakuniy matn",
    )
    audio = models.FileField(
        upload_to=page_audio_upload_path,
        blank=True,
        null=True,
        verbose_name="Audio",
    )
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
        verbose_name="Qayta ishlash holati",
    )
    extraction_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name="Aniqlik foizi",
    )
    is_approved = models.BooleanField(
        default=False,
        verbose_name="Tasdiqlangan",
    )

    class Meta:
        verbose_name = "Gazeta beti"
        verbose_name_plural = "Gazeta betlari"
        ordering = ["issue", "page_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "page_number"],
                name="unique_issue_page_number",
            )
        ]

    def __str__(self) -> str:
        return f"{self.issue} — {self.page_number}-bet"


class PageTextBlock(TimeStampedModel):
    class BlockType(models.TextChoices):
        TITLE = "TITLE", "Sarlavha"
        TEXT = "TEXT", "Oddiy matn"
        CAPTION = "CAPTION", "Rasm izohi"
        SIDEBAR = "SIDEBAR", "Yon blok"
        UNKNOWN = "UNKNOWN", "Aniqlanmagan"

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="text_blocks",
        verbose_name="Gazeta beti",
    )
    block_index = models.PositiveIntegerField(
        verbose_name="Blok indeksi",
    )
    block_type = models.CharField(
        max_length=20,
        choices=BlockType.choices,
        default=BlockType.UNKNOWN,
        verbose_name="Blok turi",
    )
    raw_text = models.TextField(
        verbose_name="Ajratilgan matn",
    )
    final_text = models.TextField(
        blank=True,
        verbose_name="Yakuniy matn",
    )
    x0 = models.FloatField(default=0)
    y0 = models.FloatField(default=0)
    x1 = models.FloatField(default=0)
    y1 = models.FloatField(default=0)
    font_size = models.FloatField(
        default=0,
        verbose_name="Shrift o‘lchami",
    )
    font_name = models.CharField(
        max_length=180,
        blank=True,
        verbose_name="Shrift nomi",
    )
    is_bold = models.BooleanField(
        default=False,
        verbose_name="Qalin matn",
    )
    reading_order = models.PositiveIntegerField(
        default=0,
        verbose_name="O‘qilish tartibi",
    )
    is_ignored = models.BooleanField(
        default=False,
        verbose_name="E’tiborga olinmasin",
    )

    class Meta:
        verbose_name = "Matn bloki"
        verbose_name_plural = "Matn bloklari"
        ordering = [
            "page",
            "reading_order",
            "block_index",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["page", "block_index"],
                name="unique_text_block_per_page",
            )
        ]

    def __str__(self) -> str:
        return (
            f"{self.page.page_number}-bet — "
            f"{self.block_index}-matn bloki"
        )


class PageImage(TimeStampedModel):
    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name="extracted_images",
        verbose_name="Gazeta beti",
    )
    block_index = models.PositiveIntegerField(
        verbose_name="Blok indeksi",
    )
    image = models.ImageField(
        upload_to=extracted_image_upload_path,
        verbose_name="Ajratilgan rasm",
    )
    caption = models.TextField(
        blank=True,
        verbose_name="Rasm izohi",
    )
    alt_text = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Rasm tavsifi",
    )
    x0 = models.FloatField(default=0)
    y0 = models.FloatField(default=0)
    x1 = models.FloatField(default=0)
    y1 = models.FloatField(default=0)
    width = models.PositiveIntegerField(
        default=0,
        verbose_name="Rasm eni",
    )
    height = models.PositiveIntegerField(
        default=0,
        verbose_name="Rasm bo‘yi",
    )
    reading_order = models.PositiveIntegerField(
        default=0,
        verbose_name="O‘qilish tartibi",
    )
    checksum = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        verbose_name="Nazorat summasi",
    )
    is_ignored = models.BooleanField(
        default=False,
        verbose_name="Ko‘rsatilmasin",
    )

    class Meta:
        verbose_name = "Bet rasmi"
        verbose_name_plural = "Bet rasmlari"
        ordering = [
            "page",
            "reading_order",
            "block_index",
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["page", "block_index"],
                name="unique_image_block_per_page",
            )
        ]

    def __str__(self) -> str:
        return (
            f"{self.page.page_number}-bet — "
            f"{self.block_index}-rasm"
        )


class Article(TimeStampedModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="articles",
        verbose_name="Gazeta soni",
    )
    page = models.ForeignKey(
        Page,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
        verbose_name="Asosiy bet",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="articles",
        verbose_name="Bo‘lim",
    )
    title = models.CharField(
        max_length=300,
        verbose_name="Sarlavha",
    )
    slug = models.SlugField(
        max_length=320,
        verbose_name="URL identifikatori",
    )
    summary = models.TextField(
        blank=True,
        verbose_name="Qisqacha mazmun",
    )
    content = models.TextField(
        verbose_name="Maqola matni",
    )
    author = models.CharField(
        max_length=160,
        blank=True,
        verbose_name="Muallif",
    )
    image = models.ImageField(
        upload_to=article_image_upload_path,
        blank=True,
        null=True,
        verbose_name="Asosiy rasm",
    )
    source_blocks = models.ManyToManyField(
        PageTextBlock,
        related_name="articles",
        blank=True,
        verbose_name="Manba matn bloklari",
    )

    source_image = models.ForeignKey(
        PageImage,
        on_delete=models.SET_NULL,
        related_name="articles",
        null=True,
        blank=True,
        verbose_name="Manba rasmi",
    )
    audio = models.FileField(
        upload_to="newspapers/articles/audio/",
        blank=True,
        null=True,
        verbose_name="Audio",
    )
    reading_order = models.PositiveIntegerField(
        default=0,
        verbose_name="O‘qilish tartibi",
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name="Asosiy maqola",
    )
    is_published = models.BooleanField(
        default=False,
        verbose_name="Nashr qilingan",
    )

    published_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Nashr qilingan vaqt",
    )

    class Meta:
        verbose_name = "Maqola"
        verbose_name_plural = "Maqolalar"
        ordering = ["issue", "reading_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["issue", "slug"],
                name="unique_article_slug_per_issue",
            )
        ]

    def __str__(self) -> str:
        return self.title