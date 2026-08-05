from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdminIssueViewSet,
    AdminNewspaperListView,
    AdminPageViewSet,
    AdminPageImageViewSet,
    AdminArticleViewSet,
    AdminCategoryListView,
)

app_name = "newspapers"

router = DefaultRouter()

router.register(
    "issues",
    AdminIssueViewSet,
    basename="admin-issues",
)

router.register(
    "pages",
    AdminPageViewSet,
    basename="admin-pages",
)

router.register(
    "page-images",
    AdminPageImageViewSet,
    basename="admin-page-images",
)

router.register(
    "articles",
    AdminArticleViewSet,
    basename="admin-articles",
)

urlpatterns = [
    path(
        "newspapers/",
        AdminNewspaperListView.as_view(),
        name="admin-newspaper-list",
    ),
    path(
        "",
        include(router.urls),
    ),

    path(
        "categories/",
        AdminCategoryListView.as_view(),
        name="admin-category-list",
    ),
]