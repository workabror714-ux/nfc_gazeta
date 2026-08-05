import uuid

from django.db import models

from newspapers.models import Issue


class NfcVisit(models.Model):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="nfc_visits",
        verbose_name="Gazeta soni",
    )
    anonymous_session_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        db_index=True,
        verbose_name="Anonim sessiya",
    )
    device_type = models.CharField(
        max_length=30,
        blank=True,
        verbose_name="Qurilma turi",
    )
    browser = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Brauzer",
    )
    opened_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name="Ochilgan vaqt",
    )

    class Meta:
        verbose_name = "NFC ochilishi"
        verbose_name_plural = "NFC ochilishlari"
        ordering = ["-opened_at"]

    def __str__(self) -> str:
        return f"{self.issue} — {self.opened_at:%Y-%m-%d %H:%M}"