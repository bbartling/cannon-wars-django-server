# games/admin.py
from django.contrib import admin
from .models import Game

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    # columns in the changelist
    list_display = ("title", "slug", "published", "order", "has_win", "has_mac", "external_download_url")
    list_editable = ("published", "order")
    search_fields = ("title", "slug", "tags")
    ordering = ("order", "title")

    # show helpful read-only flags on the edit page
    readonly_fields = ("has_win", "has_mac")

    # fields shown on the edit form (order matters)
    fields = (
        "title", "slug", "short_desc", "tags", "thumbnail",
        "windows_zip", "mac_zip",
        "published", "order",
        "has_win", "has_mac",
        "external_download_url"
    )

    def has_win(self, obj):
        return bool(obj.windows_zip)
    has_win.boolean = True
    has_win.short_description = "Win ZIP"

    def has_mac(self, obj):
        return bool(obj.mac_zip)
    has_mac.boolean = True
    has_mac.short_description = "Mac ZIP"
