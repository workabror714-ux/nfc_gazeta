from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsActiveAdmin
from .serializers import (
    AdminTokenObtainPairSerializer,
    UserSerializer,
)


class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsActiveAdmin]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [IsActiveAdmin]

    def post(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response(
                {"detail": "Refresh token yuborilishi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"detail": "Refresh token noto‘g‘ri yoki eskirgan."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Tizimdan muvaffaqiyatli chiqildi."},
            status=status.HTTP_200_OK,
        )