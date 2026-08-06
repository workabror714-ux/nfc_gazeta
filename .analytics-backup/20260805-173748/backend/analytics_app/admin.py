from django.contrib import admin

from .models import NfcVisit


@admin.register(NfcVisit)
class NfcVisitAdmin(admin.ModelAdmin):
    list_display = (
        "issue",
        "device_type",
        "browser",
        "opened_at",
    )
    list_filter = (
        "device_type",
        "browser",
        "opened_at",
    )
    search_fields = (
        "issue__title",
        "issue__slug",
    )
    readonly_fields = (
        "issue",
        "anonymous_session_id",
        "device_type",
        "browser",
        "opened_at",
    )

    def has_add_permission(self, request):
        return False