from django.db import models
from django.utils import timezone
import secrets


class EmailToken(models.Model):
    email = models.EmailField()
    token = models.CharField(max_length=64, unique=True, db_index=True)
    purpose = models.CharField(max_length=32)  # e.g. 'verify'
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    @staticmethod
    def generate(email: str, purpose: str, minutes_valid: int = 60):
        """Create an EmailToken instance with a secure token and expiry."""
        from datetime import timedelta
        return EmailToken(
            email=email,
            token=secrets.token_urlsafe(32),
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=minutes_valid),
        )

    def is_expired(self) -> bool:
        return self.expires_at < timezone.now()