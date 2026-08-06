from django.contrib import admin

from .models import NfcVisit


@admin.register(NfcVisit)
class NfcVisitAdmin(admin.ModelAdmin):
    list_display = (
        "event_type",
        "issue",
        "article",
        "source",
        "page_number",
        "device_type",
        "browser",
        "opened_at",
    )
    list_filter = (
        "event_type",
        "source",
        "device_type",
        "browser",
        "operating_system",
        "is_bot",
        "opened_at",
    )
    search_fields = (
        "issue__title",
        "issue__slug",
        "issue__nfc_slug",
        "article__title",
        "anonymous_session_id",
        "visitor_hash",
        "path",
    )
    readonly_fields = (
        "issue",
        "article",
        "event_type",
        "source",
        "anonymous_session_id",
        "client_event_id",
        "visitor_hash",
        "page_number",
        "device_type",
        "browser",
        "operating_system",
        "path",
        "referrer",
        "user_agent",
        "metadata",
        "is_bot",
        "opened_at",
    )
    date_hierarchy = "opened_at"
    list_select_related = (
        "issue",
        "article",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
