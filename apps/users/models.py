# accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

class User(AbstractUser):
    phone = models.CharField(max_length=20, unique=True)
    is_employee = models.BooleanField(default=False)

    def __str__(self):
        return self.get_full_name() or self.username
