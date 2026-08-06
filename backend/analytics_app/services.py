from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any
from urllib.parse import urlsplit

from django.conf import settings
from django.db.models import Count, Q, QuerySet
from django.db.models.functions import TruncDate
from django.utils import timezone

from .models import NfcVisit


BOT_MARKERS = (
    "bot",
    "crawler",
    "spider",
    "slurp",
    "facebookexternalhit",
    "telegrambot",
    "whatsapp",
    "preview",
    "headless",
    "lighthouse",
)


@dataclass(frozen=True)
class ClientProfile:
    device_type: str
    browser: str
    operating_system: str
    is_bot: bool


def detect_client_profile(user_agent: str) -> ClientProfile:
    ua = user_agent.lower()

    is_bot = any(marker in ua for marker in BOT_MARKERS)

    if re.search(r"ipad|tablet|kindle|silk", ua):
        device_type = "Planshet"
    elif re.search(r"iphone|ipod|mobile|android", ua):
        device_type = "Telefon"
    else:
        device_type = "Kompyuter"

    if "edg/" in ua or "edge/" in ua:
        browser = "Microsoft Edge"
    elif "opr/" in ua or "opera" in ua:
        browser = "Opera"
    elif "samsungbrowser" in ua:
        browser = "Samsung Internet"
    elif "firefox/" in ua or "fxios" in ua:
        browser = "Firefox"
    elif "chrome/" in ua or "crios" in ua:
        browser = "Google Chrome"
    elif "safari/" in ua:
        browser = "Safari"
    else:
        browser = "Boshqa"

    if "windows" in ua:
        operating_system = "Windows"
    elif "android" in ua:
        operating_system = "Android"
    elif "iphone" in ua or "ipad" in ua or "ipod" in ua:
        operating_system = "iOS / iPadOS"
    elif "mac os" in ua or "macintosh" in ua:
        operating_system = "macOS"
    elif "linux" in ua:
        operating_system = "Linux"
    else:
        operating_system = "Boshqa"

    return ClientProfile(
        device_type=device_type,
        browser=browser,
        operating_system=operating_system,
        is_bot=is_bot,
    )


def build_visitor_hash(session_id: str) -> str:
    raw_value = f"{settings.SECRET_KEY}:{session_id}"
    return hashlib.sha256(raw_value.encode("utf-8")).hexdigest()


def sanitize_referrer(value: str) -> str:
    if not value:
        return ""

    try:
        parsed = urlsplit(value)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"[:2000]
    except ValueError:
        pass

    return value[:2000]


def calculate_change(current: int, previous: int) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0

    return round(((current - previous) / previous) * 100, 1)


def get_range(days: int) -> tuple[datetime, datetime, datetime]:
    now = timezone.now()
    current_date = timezone.localdate(now)
    start_date = current_date - timedelta(days=days - 1)
    start = timezone.make_aware(
        datetime.combine(start_date, datetime.min.time()),
        timezone.get_current_timezone(),
    )
    previous_start = start - timedelta(days=days)
    return previous_start, start, now


def _base_events() -> QuerySet[NfcVisit]:
    return NfcVisit.objects.filter(is_bot=False)


def _summary(queryset: QuerySet[NfcVisit]) -> dict[str, int]:
    return queryset.aggregate(
        total_events=Count("id"),
        issue_opens=Count(
            "id",
            filter=Q(event_type=NfcVisit.EventType.ISSUE_OPEN),
        ),
        nfc_opens=Count(
            "id",
            filter=Q(
                event_type=NfcVisit.EventType.ISSUE_OPEN,
                source=NfcVisit.Source.NFC,
            ),
        ),
        web_opens=Count(
            "id",
            filter=(
                Q(event_type=NfcVisit.EventType.ISSUE_OPEN)
                & ~Q(source=NfcVisit.Source.NFC)
            ),
        ),
        article_views=Count(
            "id",
            filter=Q(event_type=NfcVisit.EventType.ARTICLE_OPEN),
        ),
        page_views=Count(
            "id",
            filter=Q(event_type=NfcVisit.EventType.PAGE_VIEW),
        ),
        unique_visitors=Count(
            "anonymous_session_id",
            distinct=True,
        ),
    )


def _distribution(
    queryset: QuerySet[NfcVisit],
    field_name: str,
    limit: int = 8,
) -> list[dict[str, Any]]:
    rows = list(
        queryset.exclude(**{field_name: ""})
        .values(field_name)
        .annotate(count=Count("id"))
        .order_by("-count")[:limit]
    )

    total = sum(int(row["count"]) for row in rows)

    return [
        {
            "label": row[field_name] or "Aniqlanmagan",
            "count": int(row["count"]),
            "percentage": (
                round((int(row["count"]) / total) * 100, 1)
                if total
                else 0
            ),
        }
        for row in rows
    ]


def _source_distribution(
    queryset: QuerySet[NfcVisit],
) -> list[dict[str, Any]]:
    labels = dict(NfcVisit.Source.choices)
    rows = list(
        queryset.values("source")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    total = sum(int(row["count"]) for row in rows)

    return [
        {
            "key": row["source"],
            "label": labels.get(row["source"], row["source"]),
            "count": int(row["count"]),
            "percentage": (
                round((int(row["count"]) / total) * 100, 1)
                if total
                else 0
            ),
        }
        for row in rows
    ]


def build_analytics_overview(days: int) -> dict[str, Any]:
    previous_start, start, end = get_range(days)

    current_events = _base_events().filter(
        opened_at__gte=start,
        opened_at__lte=end,
    )
    previous_events = _base_events().filter(
        opened_at__gte=previous_start,
        opened_at__lt=start,
    )

    current_summary = _summary(current_events)
    previous_summary = _summary(previous_events)

    changes = {
        key: calculate_change(
            int(current_summary.get(key, 0) or 0),
            int(previous_summary.get(key, 0) or 0),
        )
        for key in current_summary
    }

    daily_rows = list(
        current_events.annotate(day=TruncDate("opened_at"))
        .values("day")
        .annotate(
            issue_opens=Count(
                "id",
                filter=Q(event_type=NfcVisit.EventType.ISSUE_OPEN),
            ),
            nfc_opens=Count(
                "id",
                filter=Q(
                    event_type=NfcVisit.EventType.ISSUE_OPEN,
                    source=NfcVisit.Source.NFC,
                ),
            ),
            article_views=Count(
                "id",
                filter=Q(event_type=NfcVisit.EventType.ARTICLE_OPEN),
            ),
            page_views=Count(
                "id",
                filter=Q(event_type=NfcVisit.EventType.PAGE_VIEW),
            ),
            unique_visitors=Count(
                "anonymous_session_id",
                distinct=True,
            ),
        )
        .order_by("day")
    )
    daily_lookup = {row["day"]: row for row in daily_rows}

    daily: list[dict[str, Any]] = []
    cursor: date = timezone.localdate(start)
    end_date = timezone.localdate(end)

    while cursor <= end_date:
        row = daily_lookup.get(cursor, {})
        daily.append(
            {
                "date": cursor.isoformat(),
                "issue_opens": int(row.get("issue_opens", 0) or 0),
                "nfc_opens": int(row.get("nfc_opens", 0) or 0),
                "article_views": int(row.get("article_views", 0) or 0),
                "page_views": int(row.get("page_views", 0) or 0),
                "unique_visitors": int(
                    row.get("unique_visitors", 0) or 0
                ),
            }
        )
        cursor += timedelta(days=1)

    top_issues = list(
        current_events.filter(
            event_type=NfcVisit.EventType.ISSUE_OPEN,
        )
        .values(
            "issue_id",
            "issue__year",
            "issue__issue_number",
            "issue__title",
            "issue__nfc_slug",
        )
        .annotate(
            opens=Count("id"),
            nfc_opens=Count(
                "id",
                filter=Q(source=NfcVisit.Source.NFC),
            ),
            unique_visitors=Count(
                "anonymous_session_id",
                distinct=True,
            ),
        )
        .order_by("-opens")[:10]
    )

    top_articles = list(
        current_events.filter(
            event_type=NfcVisit.EventType.ARTICLE_OPEN,
            article__isnull=False,
        )
        .values(
            "article_id",
            "article__title",
            "article__slug",
            "issue__year",
            "issue__issue_number",
        )
        .annotate(
            views=Count("id"),
            unique_visitors=Count(
                "anonymous_session_id",
                distinct=True,
            ),
        )
        .order_by("-views")[:10]
    )

    recent_events = [
        {
            "id": visit.id,
            "event_type": visit.event_type,
            "event_label": visit.get_event_type_display(),
            "source": visit.source,
            "source_label": visit.get_source_display(),
            "issue_id": visit.issue_id,
            "issue_label": (
                f"{visit.issue.year}-yil, "
                f"{visit.issue.issue_number}-son"
            ),
            "article_id": visit.article_id,
            "article_title": (
                visit.article.title if visit.article_id else ""
            ),
            "page_number": visit.page_number,
            "device_type": visit.device_type,
            "browser": visit.browser,
            "opened_at": visit.opened_at.isoformat(),
        }
        for visit in current_events.select_related(
            "issue",
            "article",
        ).order_by("-opened_at")[:20]
    ]

    unique_visitors = int(current_summary["unique_visitors"] or 0)
    page_views = int(current_summary["page_views"] or 0)

    return {
        "range": {
            "days": days,
            "start_date": timezone.localdate(start).isoformat(),
            "end_date": timezone.localdate(end).isoformat(),
        },
        "summary": {
            key: int(value or 0)
            for key, value in current_summary.items()
        },
        "changes": changes,
        "average_pages_per_visitor": (
            round(page_views / unique_visitors, 1)
            if unique_visitors
            else 0
        ),
        "daily": daily,
        "top_issues": [
            {
                "issue_id": row["issue_id"],
                "year": row["issue__year"],
                "issue_number": row["issue__issue_number"],
                "title": row["issue__title"] or "",
                "nfc_slug": row["issue__nfc_slug"],
                "opens": int(row["opens"]),
                "nfc_opens": int(row["nfc_opens"]),
                "unique_visitors": int(row["unique_visitors"]),
            }
            for row in top_issues
        ],
        "top_articles": [
            {
                "article_id": row["article_id"],
                "title": row["article__title"],
                "slug": row["article__slug"],
                "year": row["issue__year"],
                "issue_number": row["issue__issue_number"],
                "views": int(row["views"]),
                "unique_visitors": int(row["unique_visitors"]),
            }
            for row in top_articles
        ],
        "devices": _distribution(current_events, "device_type", 5),
        "browsers": _distribution(current_events, "browser", 6),
        "sources": _source_distribution(current_events),
        "recent_events": recent_events,
    }
