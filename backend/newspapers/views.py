from django.db.models import QuerySet
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from dataclasses import asdict

from accounts.permissions import (
    IsActiveAdmin,
    IsEditorOrSuperAdmin,
    IsReviewerOrSuperAdmin,
    IsSuperAdmin,
)

from .models import Issue, Newspaper, Page
from .serializers import (
    IssueDetailSerializer,
    IssueListSerializer,
    IssuePdfUploadSerializer,
    IssueWriteSerializer,
    NewspaperOptionSerializer,
    PageDetailSerializer,
    PageListSerializer,
    PageTextUpdateSerializer,
)
from .services.pdf_processor import (
    PdfProcessingError,
    process_issue_pdf,
)


class AdminNewspaperListView(generics.ListAPIView):
    """
    Admin formalarida ishlatiladigan faol gazetalar ro‘yxati.
    """

    permission_classes = [IsActiveAdmin]
    serializer_class = NewspaperOptionSerializer

    def get_queryset(self) -> QuerySet[Newspaper]:
        return Newspaper.objects.filter(
            is_active=True
        ).order_by("name")


class AdminIssueViewSet(viewsets.ModelViewSet):
    """
    Gazeta sonlarini yaratish va boshqarish API'si.
    """

    queryset = (
        Issue.objects.select_related(
            "newspaper",
            "created_by",
            "approved_by",
        )
        .all()
        .order_by(
            "-publication_date",
            "-issue_number",
        )
    )

    http_method_names = [
        "get",
        "post",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_permissions(self):
        if self.action in {
            "create",
            "partial_update",
            "upload_pdf",
            "process_pdf",
        }:
            permission_classes = [
                IsEditorOrSuperAdmin,
            ]

        elif self.action == "destroy":
            permission_classes = [
                IsSuperAdmin,
            ]

        else:
            permission_classes = [
                IsActiveAdmin,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_serializer_class(self):
        if self.action == "list":
            return IssueListSerializer

        if self.action in {
            "create",
            "partial_update",
        }:
            return IssueWriteSerializer

        if self.action == "upload_pdf":
            return IssuePdfUploadSerializer

        return IssueDetailSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="upload-pdf",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def upload_pdf(
        self,
        request: Request,
        pk=None,
    ) -> Response:
        issue = self.get_object()

        if issue.status in {
            Issue.Status.PUBLISHED,
            Issue.Status.ARCHIVED,
        }:
            return Response(
                {
                    "detail": (
                        "Nashr qilingan yoki arxivlangan "
                        "gazetaga yangi PDF yuklab bo‘lmaydi."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssuePdfUploadSerializer(
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data["file"]

        if issue.original_pdf:
            issue.original_pdf.delete(
                save=False,
            )

        issue.original_pdf = uploaded_file
        issue.page_count = 0
        issue.processing_progress = 0
        issue.processing_error = ""
        issue.status = Issue.Status.DRAFT
        issue.is_public = False

        issue.save(
            update_fields=[
                "original_pdf",
                "page_count",
                "processing_progress",
                "processing_error",
                "status",
                "is_public",
                "updated_at",
            ]
        )

        output_serializer = IssueDetailSerializer(
            issue,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "detail": "PDF muvaffaqiyatli yuklandi.",
                "issue": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )
    
    @action(
        detail=True,
        methods=["post"],
        url_path="process-pdf",
    )
    def process_pdf(
        self,
        request: Request,
        pk=None,
    ) -> Response:
        issue = self.get_object()

        if not issue.original_pdf:
            return Response(
                {
                    "detail": (
                        "Avval ushbu nashrga "
                        "PDF fayl yuklang."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if issue.status in {
            Issue.Status.PUBLISHED,
            Issue.Status.ARCHIVED,
        }:
            return Response(
                {
                    "detail": (
                        "Nashr qilingan yoki "
                        "arxivlangan gazetani "
                        "qayta ishlab bo‘lmaydi."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            processing_result = (
                process_issue_pdf(issue)
            )
        except PdfProcessingError as exc:
            return Response(
                {
                    "detail": str(exc),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue.refresh_from_db()

        output_serializer = (
            IssueDetailSerializer(
                issue,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "detail": (
                    "PDF muvaffaqiyatli "
                    "qayta ishlandi."
                ),
                "result": asdict(
                    processing_result
                ),
                "issue": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="pages",
    )
    def pages(
        self,
        request: Request,
        pk=None,
    ) -> Response:
        issue = self.get_object()

        queryset = issue.pages.all().order_by(
            "page_number"
        )

        serializer = PageListSerializer(
            queryset,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class AdminPageViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Gazeta betlarini ko‘rish, matnini tahrirlash
    va tasdiqlash API'si.
    """

    queryset = (
        Page.objects.select_related(
            "issue",
            "issue__newspaper",
        )
        .all()
        .order_by(
            "issue_id",
            "page_number",
        )
    )

    http_method_names = [
        "get",
        "patch",
        "post",
        "head",
        "options",
    ]

    def get_permissions(self):
        if self.action == "partial_update":
            permission_classes = [
                IsEditorOrSuperAdmin,
            ]

        elif self.action in {
            "approve",
            "reject",
        }:
            permission_classes = [
                IsReviewerOrSuperAdmin,
            ]

        else:
            permission_classes = [
                IsActiveAdmin,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    def get_serializer_class(self):
        if self.action == "partial_update":
            return PageTextUpdateSerializer

        return PageDetailSerializer

    def perform_update(self, serializer):
        serializer.save(
            processing_status=(
                Page.ProcessingStatus.REVIEW
            ),
            is_approved=False,
        )

    def partial_update(
        self,
        request: Request,
        *args,
        **kwargs,
    ) -> Response:
        page = self.get_object()

        serializer = self.get_serializer(
            page,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(
            raise_exception=True
        )

        self.perform_update(serializer)

        page.refresh_from_db()

        output_serializer = (
            PageDetailSerializer(
                page,
                context={
                    "request": request,
                },
            )
        )

        return Response(
            {
                "detail": (
                    "Bet matni muvaffaqiyatli "
                    "saqlandi."
                ),
                "page": output_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="approve",
    )
    def approve(
        self,
        request: Request,
        pk=None,
    ) -> Response:
        page = self.get_object()

        if not page.final_text.strip():
            fallback_text = (
                page.ocr_text.strip()
                or page.raw_text.strip()
            )

            if fallback_text:
                page.final_text = fallback_text

        page.processing_status = (
            Page.ProcessingStatus.APPROVED
        )
        page.is_approved = True

        page.save(
            update_fields=[
                "final_text",
                "processing_status",
                "is_approved",
                "updated_at",
            ]
        )

        serializer = PageDetailSerializer(
            page,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "detail": (
                    f"{page.page_number}-bet "
                    "tasdiqlandi."
                ),
                "page": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="reject",
    )
    def reject(
        self,
        request: Request,
        pk=None,
    ) -> Response:
        page = self.get_object()

        page.processing_status = (
            Page.ProcessingStatus.REVIEW
        )
        page.is_approved = False

        page.save(
            update_fields=[
                "processing_status",
                "is_approved",
                "updated_at",
            ]
        )

        serializer = PageDetailSerializer(
            page,
            context={
                "request": request,
            },
        )

        return Response(
            {
                "detail": (
                    f"{page.page_number}-bet "
                    "qayta tahrirlashga yuborildi."
                ),
                "page": serializer.data,
            },
            status=status.HTTP_200_OK,
        )