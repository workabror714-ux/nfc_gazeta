import uuid

from django.db import models

from newspapers.models import Article, Issue


class NfcVisit(models.Model):
    class EventType(models.TextChoices):
        ISSUE_OPEN = "ISSUE_OPEN", "Gazeta soni ochilishi"
        ARTICLE_OPEN = "ARTICLE_OPEN", "Maqola ochilishi"
        PAGE_VIEW = "PAGE_VIEW", "Gazeta beti ko‘rilishi"
        PDF_OPEN = "PDF_OPEN", "Original PDF ochilishi"

    class Source(models.TextChoices):
        NFC = "NFC", "NFC"
        WEB = "WEB", "Sayt ichki havolasi"
        DIRECT = "DIRECT", "To‘g‘ridan-to‘g‘ri"
        EXTERNAL = "EXTERNAL", "Tashqi havola"
        UNKNOWN = "UNKNOWN", "Aniqlanmagan"

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="nfc_visits",
        verbose_name="Gazeta soni",
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.SET_NULL,
        related_name="analytics_visits",
        null=True,
        blank=True,
        verbose_name="Maqola",
    )
    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
        default=EventType.ISSUE_OPEN,
        db_index=True,
        verbose_name="Hodisa turi",
    )
    source = models.CharField(
        max_length=20,
        choices=Source.choices,
        default=Source.NFC,
        db_index=True,
        verbose_name="Tashrif manbasi",
    )
    anonymous_session_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        verbose_name="Anonim tashrifchi",
    )
    client_event_id = models.UUIDField(
        null=True,
        blank=True,
        unique=True,
        editable=False,
        verbose_name="Klient hodisa identifikatori",
    )
    visitor_hash = models.CharField(
        max_length=64,
        blank=True,
        db_index=True,
        verbose_name="Tashrifchi nazorat summasi",
    )
    page_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="Gazeta beti",
    )
    device_type = models.CharField(
        max_length=30,
        blank=True,
        db_index=True,
        verbose_name="Qurilma turi",
    )
    browser = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        verbose_name="Brauzer",
    )
    operating_system = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Operatsion tizim",
    )
    path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Sahifa yo‘li",
    )
    referrer = models.TextField(
        blank=True,
        verbose_name="Yo‘naltiruvchi sahifa",
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name="User-Agent",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Qo‘shimcha ma’lumot",
    )
    is_bot = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name="Bot tashrifi",
    )
    opened_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Ochilgan vaqt",
    )

    class Meta:
        verbose_name = "Analitika hodisasi"
        verbose_name_plural = "Analitika hodisalari"
        ordering = ["-opened_at"]
        indexes = [
            models.Index(
                fields=["event_type", "opened_at"],
                name="analytics_ev_opened_idx",
            ),
            models.Index(
                fields=["source", "opened_at"],
                name="analytics_src_opened_idx",
            ),
            models.Index(
                fields=["issue", "opened_at"],
                name="analytics_issue_open_idx",
            ),
            models.Index(
                fields=["article", "opened_at"],
                name="analytics_article_open_idx",
            ),
            models.Index(
                fields=["anonymous_session_id", "opened_at"],
                name="analytics_session_open_idx",
            ),
        ]

    def __str__(self) -> str:
        target = self.article.title if self.article_id else str(self.issue)
        return f"{self.get_event_type_display()} — {target}"
