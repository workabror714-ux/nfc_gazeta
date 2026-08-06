import os

from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


class Command(BaseCommand):
    help = "Environment variables orqali boshlang‘ich super admin yaratadi."

    def handle(self, *args, **options):
        email = os.getenv("INITIAL_ADMIN_EMAIL", "").strip().lower()
        password = os.getenv("INITIAL_ADMIN_PASSWORD", "")
        full_name = os.getenv(
            "INITIAL_ADMIN_FULL_NAME",
            "Temiryo‘lchi Super Admin",
        ).strip()

        if not email and not password:
            self.stdout.write(
                self.style.WARNING(
                    "INITIAL_ADMIN_EMAIL va INITIAL_ADMIN_PASSWORD berilmagan; "
                    "admin yaratish o‘tkazib yuborildi."
                )
            )
            return

        if not email or not password:
            raise CommandError(
                "INITIAL_ADMIN_EMAIL va INITIAL_ADMIN_PASSWORD ikkalasi ham "
                "berilishi kerak."
            )

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "full_name": full_name,
                "role": User.Role.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        changed_fields: list[str] = []

        if not created:
            required_values = {
                "full_name": full_name,
                "role": User.Role.SUPER_ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            }

            for field_name, field_value in required_values.items():
                if getattr(user, field_name) != field_value:
                    setattr(user, field_name, field_value)
                    changed_fields.append(field_name)

        if created or not user.check_password(password):
            user.set_password(password)
            changed_fields.append("password")

        if created or changed_fields:
            user.save()

        action = "yaratildi" if created else "tekshirildi va yangilandi"
        self.stdout.write(
            self.style.SUCCESS(f"Super admin {action}: {email}")
        )
