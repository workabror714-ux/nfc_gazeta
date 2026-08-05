from rest_framework import serializers
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
)

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "role",
            "is_active",
            "is_staff",
        )
        read_only_fields = fields


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT javobiga administrator ma’lumotlarini qo‘shadi."""

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_active:
            raise serializers.ValidationError(
                "Administrator hisobi faol emas."
            )

        if not self.user.is_staff:
            raise serializers.ValidationError(
                "Admin panelga kirish uchun ruxsat yo‘q."
            )

        data["user"] = UserSerializer(self.user).data

        return data