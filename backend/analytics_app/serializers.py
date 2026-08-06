import json

from django.db import IntegrityError, transaction
from rest_framework import serializers

from newspapers.models import Article, Issue

from .models import NfcVisit
from .services import (
    build_visitor_hash,
    detect_client_profile,
    sanitize_referrer,
)


class PublicAnalyticsEventSerializer(serializers.Serializer):
    issue_id = serializers.PrimaryKeyRelatedField(
        source="issue",
        queryset=Issue.objects.filter(
            status=Issue.Status.PUBLISHED,
            is_public=True,
        ),
    )
    article_id = serializers.PrimaryKeyRelatedField(
        source="article",
        queryset=Article.objects.filter(
            is_published=True,
            issue__status=Issue.Status.PUBLISHED,
            issue__is_public=True,
        ),
        required=False,
        allow_null=True,
    )
    event_type = serializers.ChoiceField(
        choices=NfcVisit.EventType.choices,
    )
    source = serializers.ChoiceField(
        choices=NfcVisit.Source.choices,
        default=NfcVisit.Source.UNKNOWN,
    )
    anonymous_session_id = serializers.UUIDField()
    client_event_id = serializers.UUIDField(
        required=False,
        allow_null=True,
    )
    page_number = serializers.IntegerField(
        min_value=1,
        required=False,
        allow_null=True,
    )
    path = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
    )
    referrer = serializers.CharField(
        max_length=2000,
        required=False,
        allow_blank=True,
    )
    metadata = serializers.JSONField(
        required=False,
    )

    def validate_metadata(self, value):
        encoded = json.dumps(
            value,
            ensure_ascii=False,
            default=str,
        )

        if len(encoded) > 5000:
            raise serializers.ValidationError(
                "Qo‘shimcha analitika ma’lumoti juda katta."
            )

        return value

    def validate_referrer(self, value: str) -> str:
        return sanitize_referrer(value)

    def validate(self, attrs):
        issue = attrs["issue"]
        article = attrs.get("article")
        event_type = attrs["event_type"]
        page_number = attrs.get("page_number")

        if article and article.issue_id != issue.id:
            raise serializers.ValidationError(
                {
                    "article_id": (
                        "Maqola tanlangan gazeta soniga tegishli emas."
                    )
                }
            )

        if event_type == NfcVisit.EventType.ARTICLE_OPEN and not article:
            raise serializers.ValidationError(
                {"article_id": "Maqola ochilishi uchun article_id kerak."}
            )

        if event_type == NfcVisit.EventType.PAGE_VIEW and not page_number:
            raise serializers.ValidationError(
                {"page_number": "Bet ko‘rilishi uchun bet raqami kerak."}
            )

        if page_number and issue.page_count and page_number > issue.page_count:
            raise serializers.ValidationError(
                {"page_number": "Bet raqami gazeta betlari sonidan katta."}
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user_agent = request.META.get("HTTP_USER_AGENT", "")[:2000]
        profile = detect_client_profile(user_agent)
        session_id = validated_data["anonymous_session_id"]

        defaults = {
            **validated_data,
            "visitor_hash": build_visitor_hash(str(session_id)),
            "device_type": profile.device_type,
            "browser": profile.browser,
            "operating_system": profile.operating_system,
            "is_bot": profile.is_bot,
            "user_agent": user_agent,
        }

        client_event_id = validated_data.get("client_event_id")

        if client_event_id:
            existing = NfcVisit.objects.filter(
                client_event_id=client_event_id
            ).first()
            if existing:
                self.was_created = False
                return existing

        try:
            with transaction.atomic():
                visit = NfcVisit.objects.create(**defaults)
        except IntegrityError:
            if client_event_id:
                visit = NfcVisit.objects.get(
                    client_event_id=client_event_id
                )
                self.was_created = False
                return visit
            raise

        self.was_created = True
        return visit
