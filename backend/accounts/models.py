from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    """Email orqali foydalanuvchi yaratish menejeri."""

    use_in_migrations = True

    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields,
    ):
        if not email:
            raise ValueError("Email manzil kiritilishi shart.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields,
    ):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("role", User.Role.SUPER_ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Super admin uchun is_staff=True bo‘lishi kerak.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError(
                "Super admin uchun is_superuser=True bo‘lishi kerak."
            )

        return self.create_user(
            email=email,
            password=password,
            **extra_fields,
        )


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super administrator"
        EDITOR = "EDITOR", "Muharrir"
        REVIEWER = "REVIEWER", "Tekshiruvchi"

    username = None

    email = models.EmailField(
        unique=True,
        verbose_name="Email",
    )
    full_name = models.CharField(
        max_length=160,
        verbose_name="To‘liq ism",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EDITOR,
        verbose_name="Rol",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "Administrator"
        verbose_name_plural = "Administratorlar"
        ordering = ["full_name", "email"]

    def __str__(self) -> str:
        return f"{self.full_name} — {self.email}"