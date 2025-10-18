from django.db import models

PLATFORMS = (
    ("win", "Windows"),
    ("mac", "macOS"),
)

class Game(models.Model):
    title = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    short_desc = models.TextField(blank=True)
    tags = models.CharField(max_length=160, blank=True)
    thumbnail = models.ImageField(upload_to="thumbs/", blank=True, null=True)

    # (legacy fields; OK to keep, but unused by WebGL flow)
    windows_zip = models.FileField(upload_to="build_zips/windows/", blank=True, null=True)
    mac_zip     = models.FileField(upload_to="build_zips/mac/",     blank=True, null=True)

    # NEW: upload a Unity WebGL zip via Studio and auto-extract it
    web_zip = models.FileField(
        upload_to="web_zips/",
        blank=True,
        null=True,
        help_text="Upload a Unity WebGL .zip (index.html + Build/, TemplateData/). "
                  "It will be extracted to /media/web_builds/<slug>/."
    )

    published = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    external_download_url = models.URLField(
        blank=True, null=True,
        help_text="Play URL (will auto-fill after a successful WebGL zip upload)"
    )

    def tag_list(self):
        return [t.strip() for t in (self.tags or "").split(",") if t.strip()]

    def __str__(self):
        return self.title

    # Remove files from storage when the model is deleted
    def delete(self, using=None, keep_parents=False):
        for f in (self.thumbnail, self.windows_zip, self.mac_zip, self.web_zip):
            try:
                if f and f.name and f.storage.exists(f.name):
                    f.storage.delete(f.name)
            except Exception:
                pass
        super().delete(using=using, keep_parents=keep_parents)
