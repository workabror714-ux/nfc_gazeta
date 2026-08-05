from django.contrib import admin

from .models import (
    Article,
    Category,
    Issue,
    Newspaper,
    Page,
)


@admin.register(Newspaper)
class NewspaperAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "order",
        "is_active",
    )
    list_editable = (
        "order",
        "is_active",
    )
    prepopulated_fields = {"slug": ("name",)}


class PageInline(admin.TabularInline):
    model = Page
    extra = 0
    fields = (
        "page_number",
        "processing_status",
        "is_approved",
    )
    readonly_fields = ("page_number",)
    show_change_link = True


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = (
        "newspaper",
        "year",
        "issue_number",
        "publication_date",
        "status",
        "is_public",
        "page_count",
    )
    list_filter = (
        "status",
        "is_public",
        "year",
        "newspaper",
    )
    search_fields = (
        "title",
        "slug",
        "nfc_slug",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "published_at",
    )
    autocomplete_fields = (
        "created_by",
        "approved_by",
    )
    inlines = [PageInline]


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = (
        "issue",
        "page_number",
        "processing_status",
        "extraction_confidence",
        "is_approved",
    )
    list_filter = (
        "processing_status",
        "is_approved",
    )
    search_fields = (
        "issue__title",
        "raw_text",
        "final_text",
    )


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "issue",
        "category",
        "author",
        "is_featured",
        "is_published",
    )
    list_filter = (
        "is_featured",
        "is_published",
        "category",
        "issue__year",
    )
    search_fields = (
        "title",
        "content",
        "author",
    )