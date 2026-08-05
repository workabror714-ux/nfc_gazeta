from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminTokenObtainPairView,
    LogoutView,
    MeView,
)

app_name = "accounts"

urlpatterns = [
    path(
        "login/",
        AdminTokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        MeView.as_view(),
        name="me",
    ),
]