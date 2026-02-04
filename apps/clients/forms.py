import re
from django import forms
from .models import Client
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

E164_RE = r'^(?:\+[1-9]\d{7,14}|00[1-9]\d{7,14})$'

phone_validator = RegexValidator(
    regex=E164_RE,
    message="Phone number must be e.g. (+32 470 123 456) or (0032 470 123 456)",
)

def normalize_phone(raw: str) -> str:
    if not raw:
        return ""
    
    s = raw.strip()

    s = re.sub(r"[^\d+]", "", s)

    if s.startswith("00"):
        s = "+" + s[2:]

    return s

class ClientForm(forms.ModelForm):
    email = forms.EmailField(required=False, error_messages={"invalid": "Email is not valid."})

    class Meta:
        model = Client
        fields = ["first_name", "last_name", "phone", "email"]

    def clean_first_name(self):
        firstname = (self.cleaned_data.get("first_name") or "").strip()

        if not firstname:
            raise ValidationError("First name is required", code="required")
        if len(firstname) < 2:
            raise ValidationError("First name is too short.", code="to_short")
        
        return firstname
    
    def clean_last_name(self):
        lastname = (self.cleaned_data.get("last_name") or "").strip()
        
        if not lastname:
            raise ValidationError("First name is required", code="required")
        if len(lastname) < 2:
            raise ValidationError("First name is too short.", code="to_short")
        
        return lastname
    
    def clean_phone(self):
        phone = (self.cleaned_data.get("phone") or "").strip()
        if not phone:
            raise ValidationError("Phone is required.", code="required")
        
        phone = normalize_phone(phone)
        phone_validator(phone)
        return phone
    
        