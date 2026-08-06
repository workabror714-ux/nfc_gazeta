from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Article,
    Category,
    Issue,
)
from .serializers import (
    CategoryOptionSerializer,
    PublicArticleCardSerializer,
    PublicArticleDetailSerializer,
    PublicIssueDetailSerializer,
    PublicIssueListSerializer,
)


def get_public_issues():
    return (
        Issue.objects.select_related(
            "newspaper",
        )
        .filter(
            status=Issue.Status.PUBLISHED,
            is_public=True,
        )
        .order_by(
            "-publication_date",
            "-issue_number",
        )
    )


def get_public_articles():
    return (
        Article.objects.select_related(
            "issue",
            "issue__newspaper",
            "category",
            "source_image",
        )
        .filter(
            is_published=True,
            issue__status=(
                Issue.Status.PUBLISHED
            ),
            issue__is_public=True,
        )
        .order_by(
            "-published_at",
            "-created_at",
        )
    )


class PublicHomeView(APIView):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    def get(
        self,
        request: Request,
    ) -> Response:
        issues = get_public_issues()
        articles = get_public_articles()

        latest_issue = issues.first()

        featured_articles = (
            articles.filter(
                is_featured=True
            )[:5]
        )

        latest_articles = articles[:12]

        categories = (
            Category.objects.filter(
                is_active=True
            )
            .order_by(
                "order",
                "name",
            )
        )

        return Response(
            {
                "latest_issue": (
                    PublicIssueListSerializer(
                        latest_issue,
                        context={
                            "request": request,
                        },
                    ).data
                    if latest_issue
                    else None
                ),
                "featured_articles": (
                    PublicArticleCardSerializer(
                        featured_articles,
                        many=True,
                        context={
                            "request": request,
                        },
                    ).data
                ),
                "latest_articles": (
                    PublicArticleCardSerializer(
                        latest_articles,
                        many=True,
                        context={
                            "request": request,
                        },
                    ).data
                ),
                "categories": (
                    CategoryOptionSerializer(
                        categories,
                        many=True,
                    ).data
                ),
            }
        )


class PublicIssueListView(
    generics.ListAPIView
):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    serializer_class = (
        PublicIssueListSerializer
    )

    def get_queryset(self):
        queryset = get_public_issues()

        year = self.request.query_params.get(
            "year"
        )

        if year and year.isdigit():
            queryset = queryset.filter(
                year=int(year)
            )

        return queryset


class PublicIssueDetailView(
    generics.RetrieveAPIView
):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    serializer_class = (
        PublicIssueDetailSerializer
    )

    lookup_field = "nfc_slug"
    lookup_url_kwarg = "nfc_slug"

    def get_queryset(self):
        return (
            get_public_issues()
            .prefetch_related(
                "pages",
                "articles",
            )
        )


class PublicArticleListView(
    generics.ListAPIView
):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    serializer_class = (
        PublicArticleCardSerializer
    )

    def get_queryset(self):
        queryset = get_public_articles()

        category = (
            self.request.query_params.get(
                "category"
            )
        )

        issue = (
            self.request.query_params.get(
                "issue"
            )
        )

        search = (
            self.request.query_params.get(
                "search"
            )
        )

        if category:
            queryset = queryset.filter(
                category__slug=category
            )

        if issue:
            queryset = queryset.filter(
                issue__nfc_slug=issue
            )

        if search:
            normalized_search = (
                search.strip()
            )

            if normalized_search:
                queryset = queryset.filter(
                    Q(
                        title__icontains=(
                            normalized_search
                        )
                    )
                    | Q(
                        summary__icontains=(
                            normalized_search
                        )
                    )
                    | Q(
                        content__icontains=(
                            normalized_search
                        )
                    )
                    | Q(
                        author__icontains=(
                            normalized_search
                        )
                    )
                )

        return queryset


class PublicArticleDetailView(
    generics.RetrieveAPIView
):
    permission_classes = [
        AllowAny,
    ]

    authentication_classes = []

    serializer_class = (
        PublicArticleDetailSerializer
    )

    lookup_field = "pk"

    def get_queryset(self):
        return get_public_articles()