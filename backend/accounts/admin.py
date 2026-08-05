from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = (
        "email",
        "full_name",
        "role",
        "is_active",
        "is_staff",
    )
    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )
    search_fields = (
        "email",
        "full_name",
    )

    fieldsets = (
        (
            "Asosiy ma’lumotlar",
            {
                "fields": (
                    "email",
                    "password",
                    "full_name",
                    "role",
                )
            },
        ),
        (
            "Ruxsatlar",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Muhim sanalar",
            {
                "fields": (
                    "last_login",
                    "date_joined",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            "Yangi administrator",
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "role",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )