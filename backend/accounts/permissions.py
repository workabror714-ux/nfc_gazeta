from rest_framework.permissions import BasePermission

from .models import User


class IsActiveAdmin(BasePermission):
    """
    Faqat faol va admin panelga kirish huquqiga ega
    administratorlarga ruxsat beradi.
    """

    message = "Admin paneldan foydalanish uchun ruxsat yo‘q."

    allowed_roles = {
        User.Role.SUPER_ADMIN,
        User.Role.EDITOR,
        User.Role.REVIEWER,
    }

    def has_permission(self, request, view) -> bool:
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.is_staff
            and user.role in self.allowed_roles
        )


class IsEditorOrSuperAdmin(IsActiveAdmin):
    """
    Kontent yaratish va PDF yuklash huquqi.
    """

    message = "Nashr yaratish yoki tahrirlash uchun ruxsat yo‘q."

    allowed_roles = {
        User.Role.SUPER_ADMIN,
        User.Role.EDITOR,
    }


class IsReviewerOrSuperAdmin(IsActiveAdmin):
    """
    Nashr va betlarni tasdiqlash huquqi.
    """

    message = "Materiallarni tasdiqlash uchun ruxsat yo‘q."

    allowed_roles = {
        User.Role.SUPER_ADMIN,
        User.Role.REVIEWER,
    }


class IsSuperAdmin(IsActiveAdmin):
    """
    Faqat super administrator.
    """

    message = "Bu amal faqat super administrator uchun."

    allowed_roles = {
        User.Role.SUPER_ADMIN,
    }