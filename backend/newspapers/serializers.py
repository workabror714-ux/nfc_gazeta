from pathlib import Path

from django.conf import settings
from django.utils.text import slugify
from rest_framework import serializers

from .models import (
    Article,
    Category,
    Issue,
    Newspaper,
    Page,
    PageImage,
    PageTextBlock,
)


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

class PageTextBlockSerializer(
    serializers.ModelSerializer
):
    block_type_display = serializers.CharField(
        source="get_block_type_display",
        read_only=True,
    )

    class Meta:
        model = PageTextBlock
        fields = (
            "id",
            "block_index",
            "block_type",
            "block_type_display",
            "raw_text",
            "final_text",
            "x0",
            "y0",
            "x1",
            "y1",
            "font_size",
            "font_name",
            "is_bold",
            "reading_order",
            "is_ignored",
        )
        read_only_fields = fields


class PageImageSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = PageImage
        fields = (
            "id",
            "page_id",
            "block_index",
            "image",
            "caption",
            "alt_text",
            "x0",
            "y0",
            "x1",
            "y1",
            "width",
            "height",
            "reading_order",
            "checksum",
            "is_ignored",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class PageImageUpdateSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = PageImage
        fields = (
            "caption",
            "alt_text",
            "is_ignored",
        )

    def validate_caption(
        self,
        value: str,
    ) -> str:
        return value.strip()

    def validate_alt_text(
        self,
        value: str,
    ) -> str:
        return value.strip()

class PageListSerializer(serializers.ModelSerializer):
    processing_status_display = serializers.CharField(
        source="get_processing_status_display",
        read_only=True,
    )
    has_text = serializers.SerializerMethodField()
    text_length = serializers.SerializerMethodField()
    image_count = serializers.SerializerMethodField()
    text_block_count = serializers.SerializerMethodField()

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
            "image_count",
            "text_block_count",
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

    def get_image_count(
        self,
        obj: Page,
    ) -> int:
        return obj.extracted_images.filter(
            is_ignored=False
        ).count()

    def get_text_block_count(
        self,
        obj: Page,
    ) -> int:
        return obj.text_blocks.filter(
            is_ignored=False
        ).count()


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
    text_blocks = PageTextBlockSerializer(
        many=True,
        read_only=True,
    )

    images = PageImageSerializer(
        source="extracted_images",
        many=True,
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
            "text_blocks",
            "images",
        )


class PageTextUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = (
            "final_text",
        )

    def validate_final_text(self, value: str) -> str:
        return value.replace("\r\n", "\n").strip()
    

class CategoryOptionSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
        )
        read_only_fields = fields


class ArticleListSerializer(
    serializers.ModelSerializer
):
    category = CategoryOptionSerializer(
        read_only=True,
    )

    source_image = PageImageSerializer(
        read_only=True,
    )

    page_number = serializers.IntegerField(
        source="page.page_number",
        read_only=True,
        allow_null=True,
    )

    newspaper_name = serializers.CharField(
        source="issue.newspaper.name",
        read_only=True,
    )

    class Meta:
        model = Article
        fields = (
            "id",
            "issue_id",
            "page_id",
            "page_number",
            "newspaper_name",
            "category",
            "title",
            "slug",
            "summary",
            "author",
            "image",
            "source_image",
            "reading_order",
            "is_featured",
            "is_published",
            "published_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ArticleDetailSerializer(
    ArticleListSerializer
):
    source_blocks = PageTextBlockSerializer(
        many=True,
        read_only=True,
    )

    class Meta(ArticleListSerializer.Meta):
        fields = (
            ArticleListSerializer.Meta.fields
            + (
                "content",
                "audio",
                "source_blocks",
            )
        )


class ArticleCreateSerializer(
    serializers.ModelSerializer
):
    issue_id = serializers.PrimaryKeyRelatedField(
        source="issue",
        queryset=Issue.objects.all(),
        write_only=True,
    )

    page_id = serializers.PrimaryKeyRelatedField(
        source="page",
        queryset=Page.objects.all(),
        write_only=True,
    )

    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.filter(
            is_active=True
        ),
        write_only=True,
        required=False,
        allow_null=True,
    )

    text_block_ids = serializers.PrimaryKeyRelatedField(
        source="source_blocks",
        queryset=PageTextBlock.objects.filter(
            is_ignored=False
        ),
        many=True,
        write_only=True,
    )

    source_image_id = serializers.PrimaryKeyRelatedField(
        source="source_image",
        queryset=PageImage.objects.filter(
            is_ignored=False
        ),
        write_only=True,
        required=False,
        allow_null=True,
    )

    content = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Article
        fields = (
            "id",
            "issue_id",
            "page_id",
            "category_id",
            "text_block_ids",
            "source_image_id",
            "title",
            "summary",
            "content",
            "author",
            "slug",
            "reading_order",
            "is_featured",
            "is_published",
            "created_at",
        )
        read_only_fields = (
            "id",
            "slug",
            "reading_order",
            "is_published",
            "created_at",
        )

    def validate_title(
        self,
        value: str,
    ) -> str:
        normalized_title = " ".join(
            value.split()
        )

        if not normalized_title:
            raise serializers.ValidationError(
                "Maqola sarlavhasini kiriting."
            )

        return normalized_title

    def validate(self, attrs):
        issue = attrs.get(
            "issue",
            getattr(
                self.instance,
                "issue",
                None,
            ),
        )

        page = attrs.get(
            "page",
            getattr(
                self.instance,
                "page",
                None,
            ),
        )

        source_blocks = attrs.get(
            "source_blocks",
        )

        if source_blocks is None:
            if self.instance:
                source_blocks = list(
                    self.instance
                    .source_blocks
                    .all()
                )
            else:
                source_blocks = []

        source_image = attrs.get(
            "source_image",
            getattr(
                self.instance,
                "source_image",
                None,
            ),
        )

        if not issue or not page:
            raise serializers.ValidationError(
                "Gazeta soni va bet tanlanishi kerak."
            )

        if page.issue_id != issue.id:
            raise serializers.ValidationError(
                {
                    "page_id": (
                        "Tanlangan bet ushbu "
                        "gazeta soniga tegishli emas."
                    )
                }
            )

        if not source_blocks:
            raise serializers.ValidationError(
                {
                    "text_block_ids": (
                        "Kamida bitta matn "
                        "blokini tanlang."
                    )
                }
            )

        invalid_blocks = [
            block.id
            for block in source_blocks
            if block.page_id != page.id
        ]

        if invalid_blocks:
            raise serializers.ValidationError(
                {
                    "text_block_ids": (
                        "Tanlangan matn bloklarining "
                        "ayrimlari boshqa betga tegishli."
                    )
                }
            )

        if (
            source_image
            and source_image.page_id != page.id
        ):
            raise serializers.ValidationError(
                {
                    "source_image_id": (
                        "Tanlangan rasm boshqa "
                        "betga tegishli."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        source_blocks = validated_data.pop(
            "source_blocks"
        )

        issue = validated_data["issue"]
        title = validated_data["title"]

        ordered_blocks = sorted(
            source_blocks,
            key=lambda block: (
                block.reading_order,
                block.block_index,
            ),
        )

        if not validated_data.get("content"):
            content_parts = [
                (
                    block.final_text.strip()
                    or block.raw_text.strip()
                )
                for block in ordered_blocks
                if (
                    block.final_text.strip()
                    or block.raw_text.strip()
                )
            ]

            validated_data["content"] = (
                "\n\n".join(content_parts)
            )

        base_slug = slugify(title) or "maqola"
        slug_candidate = base_slug
        counter = 2

        while Article.objects.filter(
            issue=issue,
            slug=slug_candidate,
        ).exists():
            slug_candidate = (
                f"{base_slug}-{counter}"
            )
            counter += 1

        validated_data["slug"] = slug_candidate

        maximum_order = (
            issue.articles.order_by(
                "-reading_order"
            )
            .values_list(
                "reading_order",
                flat=True,
            )
            .first()
            or 0
        )

        validated_data["reading_order"] = (
            maximum_order + 1
        )

        article = Article.objects.create(
            **validated_data
        )

        article.source_blocks.set(
            ordered_blocks
        )

        return article
    

class ArticleUpdateSerializer(
    serializers.ModelSerializer
):
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.filter(
            is_active=True
        ),
        required=False,
        allow_null=True,
    )

    source_image_id = serializers.PrimaryKeyRelatedField(
        source="source_image",
        queryset=PageImage.objects.filter(
            is_ignored=False
        ),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Article
        fields = (
            "category_id",
            "source_image_id",
            "title",
            "summary",
            "content",
            "author",
            "is_featured",
        )

    def validate_title(
        self,
        value: str,
    ) -> str:
        normalized_title = " ".join(
            value.split()
        )

        if not normalized_title:
            raise serializers.ValidationError(
                "Maqola sarlavhasini kiriting."
            )

        return normalized_title

    def validate_content(
        self,
        value: str,
    ) -> str:
        return value.replace(
            "\r\n",
            "\n",
        ).strip()

    def validate_summary(
        self,
        value: str,
    ) -> str:
        return value.strip()

    def validate_author(
        self,
        value: str,
    ) -> str:
        return " ".join(
            value.split()
        )

    def validate(self, attrs):
        article = self.instance

        if not article:
            return attrs

        source_image = attrs.get(
            "source_image",
            article.source_image,
        )

        if (
            source_image
            and article.page_id
            and source_image.page_id
            != article.page_id
        ):
            raise serializers.ValidationError(
                {
                    "source_image_id": (
                        "Tanlangan rasm maqola "
                        "joylashgan betga tegishli emas."
                    )
                }
            )

        return attrs
    

class PublicPageSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = Page
        fields = (
            "id",
            "page_number",
            "page_image",
            "final_text",
            "audio",
        )
        read_only_fields = fields


class PublicArticleCardSerializer(
    serializers.ModelSerializer
):
    category = CategoryOptionSerializer(
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

    issue_nfc_slug = serializers.CharField(
        source="issue.nfc_slug",
        read_only=True,
    )

    newspaper_name = serializers.CharField(
        source="issue.newspaper.name",
        read_only=True,
    )

    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = (
            "id",
            "issue_id",
            "issue_number",
            "issue_year",
            "issue_nfc_slug",
            "newspaper_name",
            "category",
            "title",
            "slug",
            "summary",
            "author",
            "main_image",
            "reading_order",
            "is_featured",
            "published_at",
        )
        read_only_fields = fields

    def get_main_image(
        self,
        obj: Article,
    ) -> str | None:
        image_file = None

        if (
            obj.source_image
            and obj.source_image.image
        ):
            image_file = (
                obj.source_image.image
            )

        elif obj.image:
            image_file = obj.image

        if not image_file:
            return None

        try:
            image_url = image_file.url
        except ValueError:
            return None

        request = self.context.get(
            "request"
        )

        if request:
            return request.build_absolute_uri(
                image_url
            )

        return image_url


class PublicArticleDetailSerializer(
    PublicArticleCardSerializer
):
    class Meta(
        PublicArticleCardSerializer.Meta
    ):
        fields = (
            PublicArticleCardSerializer
            .Meta
            .fields
            + (
                "content",
                "audio",
            )
        )


class PublicIssueListSerializer(
    serializers.ModelSerializer
):
    newspaper_name = serializers.CharField(
        source="newspaper.name",
        read_only=True,
    )

    article_count = serializers.SerializerMethodField()
    nfc_path = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            "id",
            "newspaper_name",
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
            "article_count",
            "published_at",
        )
        read_only_fields = fields

    def get_article_count(
        self,
        obj: Issue,
    ) -> int:
        return obj.articles.filter(
            is_published=True
        ).count()

    def get_nfc_path(
        self,
        obj: Issue,
    ) -> str:
        return f"/n/{obj.nfc_slug}"


class PublicIssueDetailSerializer(
    PublicIssueListSerializer
):
    pages = serializers.SerializerMethodField()
    articles = serializers.SerializerMethodField()

    class Meta(
        PublicIssueListSerializer.Meta
    ):
        fields = (
            PublicIssueListSerializer
            .Meta
            .fields
            + (
                "original_pdf",
                "pages",
                "articles",
            )
        )

    def get_pages(
        self,
        obj: Issue,
    ):
        pages = (
            obj.pages.filter(
                is_approved=True
            )
            .order_by("page_number")
        )

        return PublicPageSerializer(
            pages,
            many=True,
            context=self.context,
        ).data

    def get_articles(
        self,
        obj: Issue,
    ):
        articles = (
            obj.articles.filter(
                is_published=True
            )
            .select_related(
                "category",
                "source_image",
                "issue",
                "issue__newspaper",
            )
            .order_by(
                "-is_featured",
                "reading_order",
            )
        )

        return PublicArticleCardSerializer(
            articles,
            many=True,
            context=self.context,
        ).data