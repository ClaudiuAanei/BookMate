# users/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username", "email", "is_staff", "is_active", "is_employee"
    )
    search_fields = ("username", "email", "first_name", "last_name")

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "username",
                "email",
                "phone",
                "password1",
                "password2",
            ),
        }),
    )

    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)

        if request.GET.get("app_label") == "employees" and \
           request.GET.get("model_name") == "employee" and \
           request.GET.get("field_name") == "user":

            queryset = queryset.filter(employee_profile__isnull=True)

        return queryset, use_distinct

