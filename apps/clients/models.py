import re
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from django.db.models import Q, UniqueConstraint


E164_RE = r'^(?:\+[1-9]\d{7,14}|00[1-9]\d{7,14})$'

phone_validator = RegexValidator(
    regex=E164_RE,
    message="Phone number must be (+32 470 123 456) or (0032 470 123 456)",
)

def normalize_phone(raw: str) -> str:
    if not raw:
        return ""
    
    s = raw.strip()

    s = re.sub(r"[^\d+]", "", s)

    if s.startswith("00"):
        s = "+" + s[2:]

    return s


class Client(models.Model):
    class Status(models.TextChoices):
        ACTIVE = ('active', 'Active')
        INACTIVE = ('inactive', 'Inactive')
        BLOCKED = ('blocked', 'Blocked')

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="client_profile", blank=True, null=True)
    first_name = models.CharField()
    last_name = models.CharField()
    phone = models.CharField(max_length=16, unique=True, validators=[phone_validator])
    email = models.EmailField(max_length=100, blank=True, null=True, error_messages={"invalid": "Email is not valid."})
    status = models.CharField(max_length=10, default=Status.ACTIVE, choices=Status.choices)
    reason = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["email"],
                condition=Q(email__isnull=False) & ~Q(email=""),
                name="uniq_client_email_when_present",
            )
        ]

    def clean(self):
        super().clean()
        self.phone = normalize_phone(self.phone)
        
    def save(self, *args, **kwargs):
        self.phone = normalize_phone(self.phone)
        super().save(*args, **kwargs)


    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"