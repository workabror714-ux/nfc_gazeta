# Generated for Temiryo‘lchi analytics integration.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("analytics_app", "0001_initial"),
        ("newspapers", "0005_article_published_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="nfcvisit",
            name="article",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="analytics_visits",
                to="newspapers.article",
                verbose_name="Maqola",
            ),
        ),
        migrations.AlterField(
            model_name="nfcvisit",
            name="browser",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=50,
                verbose_name="Brauzer",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="client_event_id",
            field=models.UUIDField(
                blank=True,
                editable=False,
                null=True,
                unique=True,
                verbose_name="Klient hodisa identifikatori",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("ISSUE_OPEN", "Gazeta soni ochilishi"),
                    ("ARTICLE_OPEN", "Maqola ochilishi"),
                    ("PAGE_VIEW", "Gazeta beti ko‘rilishi"),
                    ("PDF_OPEN", "Original PDF ochilishi"),
                ],
                db_index=True,
                default="ISSUE_OPEN",
                max_length=30,
                verbose_name="Hodisa turi",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="is_bot",
            field=models.BooleanField(
                db_index=True,
                default=False,
                verbose_name="Bot tashrifi",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="metadata",
            field=models.JSONField(
                blank=True,
                default=dict,
                verbose_name="Qo‘shimcha ma’lumot",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="operating_system",
            field=models.CharField(
                blank=True,
                max_length=50,
                verbose_name="Operatsion tizim",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="page_number",
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name="Gazeta beti",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="path",
            field=models.CharField(
                blank=True,
                max_length=500,
                verbose_name="Sahifa yo‘li",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="referrer",
            field=models.TextField(
                blank=True,
                verbose_name="Yo‘naltiruvchi sahifa",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="source",
            field=models.CharField(
                choices=[
                    ("NFC", "NFC"),
                    ("WEB", "Sayt ichki havolasi"),
                    ("DIRECT", "To‘g‘ridan-to‘g‘ri"),
                    ("EXTERNAL", "Tashqi havola"),
                    ("UNKNOWN", "Aniqlanmagan"),
                ],
                db_index=True,
                default="NFC",
                max_length=20,
                verbose_name="Tashrif manbasi",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="user_agent",
            field=models.TextField(
                blank=True,
                verbose_name="User-Agent",
            ),
        ),
        migrations.AddField(
            model_name="nfcvisit",
            name="visitor_hash",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=64,
                verbose_name="Tashrifchi nazorat summasi",
            ),
        ),
        migrations.AlterField(
            model_name="nfcvisit",
            name="device_type",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=30,
                verbose_name="Qurilma turi",
            ),
        ),
        migrations.AlterModelOptions(
            name="nfcvisit",
            options={
                "ordering": ["-opened_at"],
                "verbose_name": "Analitika hodisasi",
                "verbose_name_plural": "Analitika hodisalari",
            },
        ),
        migrations.AddIndex(
            model_name="nfcvisit",
            index=models.Index(
                fields=["event_type", "opened_at"],
                name="analytics_ev_opened_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="nfcvisit",
            index=models.Index(
                fields=["source", "opened_at"],
                name="analytics_src_opened_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="nfcvisit",
            index=models.Index(
                fields=["issue", "opened_at"],
                name="analytics_issue_open_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="nfcvisit",
            index=models.Index(
                fields=["article", "opened_at"],
                name="analytics_article_open_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="nfcvisit",
            index=models.Index(
                fields=["anonymous_session_id", "opened_at"],
                name="analytics_session_open_idx",
            ),
        ),
    ]
