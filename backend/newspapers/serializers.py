from pathlib import Path

from django.conf import settings
from django.utils.text import slugify
from rest_framework import serializers

from .models import Issue, Newspaper, Page


def generate_unique_slug(
    model,
    field_name: str,
    base_value: str,
) -> str:
    """
    Model ichida takrorlanmaydigan slug yaratadi.
    """

    base_slug = slugify(base_value) or "nashr"
    candidate = base_slug
    index = 2

    while model.objects.filter(
        **{field_name: candidate}
    ).exists():
        candidate = f"{base_slug}-{index}"
        index += 1

    return candidate


class NewspaperOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newspaper
        fields = (
            "id",
            "name",
            "slug",
            "logo",
        )
        read_only_fields = fields


class IssueListSerializer(serializers.ModelSerializer):
    newspaper = NewspaperOptionSerializer(read_only=True)

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    created_by_name = serializers.CharField(
        source="created_by.full_name",
        read_only=True,
        default="",
    )

    has_pdf = serializers.SerializerMethodField()
    nfc_path = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            "id",
            "newspaper",
            "issue_number",
            "year",
            "publication_date",
            "title",
            "slug",
            "nfc_slug",
            "nfc_path",
            "description",
            "cover_image",
            "page_count",
            "processing_progress",
            "processing_error",
            "estimated_audio_duration",
            "status",
            "status_display",
            "is_public",
            "has_pdf",
            "created_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_has_pdf(self, obj: Issue) -> bool:
        return bool(obj.original_pdf)

    def get_nfc_path(self, obj: Issue) -> str:
        return f"/n/{obj.nfc_slug}"


class IssueDetailSerializer(IssueListSerializer):
    original_pdf = serializers.FileField(
        read_only=True,
    )

    approved_by_name = serializers.CharField(
        source="approved_by.full_name",
        read_only=True,
        default="",
    )

    class Meta(IssueListSerializer.Meta):
        fields = IssueListSerializer.Meta.fields + (
            "original_pdf",
            "approved_by_name",
            "published_at",
        )


class IssueWriteSerializer(serializers.ModelSerializer):
    newspaper_id = serializers.PrimaryKeyRelatedField(
        source="newspaper",
        queryset=Newspaper.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = Issue
        fields = (
            "id",
            "newspaper_id",
            "issue_number",
            "year",
            "publication_date",
            "title",
            "description",
            "slug",
            "nfc_slug",
            "status",
            "is_public",
            "created_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "nfc_slug",
            "status",
            "is_public",
            "created_at",
        )

    def validate_issue_number(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError(
                "Gazeta soni 1 yoki undan katta bo‘lishi kerak."
            )

        return value

    def validate_year(self, value: int) -> int:
        if value < 1900 or value > 2100:
            raise serializers.ValidationError(
                "Nashr yilini to‘g‘ri kiriting."
            )

        return value

    def validate(self, attrs):
        newspaper = attrs.get(
            "newspaper",
            getattr(self.instance, "newspaper", None),
        )

        year = attrs.get(
            "year",
            getattr(self.instance, "year", None),
        )

        issue_number = attrs.get(
            "issue_number",
            getattr(self.instance, "issue_number", None),
        )

        existing_issue = Issue.objects.filter(
            newspaper=newspaper,
            year=year,
            issue_number=issue_number,
        )

        if self.instance:
            existing_issue = existing_issue.exclude(
                pk=self.instance.pk
            )

        if existing_issue.exists():
            raise serializers.ValidationError(
                {
                    "issue_number": (
                        "Ushbu gazetaning shu yil va son "
                        "raqamidagi nashri allaqachon mavjud."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        newspaper = validated_data["newspaper"]
        year = validated_data["year"]
        issue_number = validated_data["issue_number"]

        if not validated_data.get("title"):
            validated_data["title"] = (
                f"{year}-yil, {issue_number}-son"
            )

        validated_data["slug"] = generate_unique_slug(
            Issue,
            "slug",
            f"{newspaper.slug}-{year}-{issue_number}",
        )

        validated_data["nfc_slug"] = generate_unique_slug(
            Issue,
            "nfc_slug",
            f"{year}-{issue_number}",
        )

        return super().create(validated_data)


class IssuePdfUploadSerializer(serializers.Serializer):
    file = serializers.FileField(
        required=True,
        allow_empty_file=False,
    )

    def validate_file(self, uploaded_file):
        max_size_mb = getattr(
            settings,
            "MAX_PDF_SIZE_MB",
            100,
        )

        max_size_bytes = max_size_mb * 1024 * 1024

        if uploaded_file.size > max_size_bytes:
            raise serializers.ValidationError(
                f"PDF hajmi {max_size_mb} MB dan oshmasligi kerak."
            )

        extension = Path(uploaded_file.name).suffix.lower()

        if extension != ".pdf":
            raise serializers.ValidationError(
                "Faqat PDF formatidagi fayl yuklash mumkin."
            )

        allowed_content_types = {
            "application/pdf",
            "application/x-pdf",
            "application/octet-stream",
        }

        content_type = getattr(
            uploaded_file,
            "content_type",
            "",
        )

        if (
            content_type
            and content_type not in allowed_content_types
        ):
            raise serializers.ValidationError(
                "Yuklangan fayl PDF formatida emas."
            )

        header = uploaded_file.read(1024)
        uploaded_file.seek(0)

        if b"%PDF-" not in header:
            raise serializers.ValidationError(
                "Fayl haqiqiy PDF hujjati emas yoki buzilgan."
            )

        return uploaded_file
    
class PageListSerializer(serializers.ModelSerializer):
    processing_status_display = serializers.CharField(
        source="get_processing_status_display",
        read_only=True,
    )
    has_text = serializers.SerializerMethodField()
    text_length = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = (
            "id",
            "issue_id",
            "page_number",
            "page_image",
            "processing_status",
            "processing_status_display",
            "extraction_confidence",
            "is_approved",
            "has_text",
            "text_length",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_has_text(self, obj: Page) -> bool:
        return bool(
            obj.final_text.strip()
            or obj.ocr_text.strip()
            or obj.raw_text.strip()
        )

    def get_text_length(self, obj: Page) -> int:
        text = (
            obj.final_text
            or obj.ocr_text
            or obj.raw_text
        )

        return len(text.strip())


class PageDetailSerializer(PageListSerializer):
    issue_title = serializers.CharField(
        source="issue.title",
        read_only=True,
    )
    issue_number = serializers.IntegerField(
        source="issue.issue_number",
        read_only=True,
    )
    issue_year = serializers.IntegerField(
        source="issue.year",
        read_only=True,
    )
    newspaper_name = serializers.CharField(
        source="issue.newspaper.name",
        read_only=True,
    )

    class Meta(PageListSerializer.Meta):
        fields = PageListSerializer.Meta.fields + (
            "issue_title",
            "issue_number",
            "issue_year",
            "newspaper_name",
            "raw_text",
            "ocr_text",
            "final_text",
            "audio",
        )


class PageTextUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = (
            "final_text",
        )

    def validate_final_text(self, value: str) -> str:
        return value.replace("\r\n", "\n").strip()