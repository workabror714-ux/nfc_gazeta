from django.urls import path

from .public_views import (
    PublicArticleDetailView,
    PublicArticleListView,
    PublicHomeView,
    PublicIssueDetailView,
    PublicIssueListView,
)


app_name = "public-newspapers"


urlpatterns = [
    path(
        "home/",
        PublicHomeView.as_view(),
        name="home",
    ),
    path(
        "issues/",
        PublicIssueListView.as_view(),
        name="issue-list",
    ),
    path(
        "issues/<slug:nfc_slug>/",
        PublicIssueDetailView.as_view(),
        name="issue-detail",
    ),
    path(
        "articles/",
        PublicArticleListView.as_view(),
        name="article-list",
    ),
    path(
        "articles/<int:pk>/",
        PublicArticleDetailView.as_view(),
        name="article-detail",
    ),
]