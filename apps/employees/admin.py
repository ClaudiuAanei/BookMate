from django.contrib import admin
from datetime import date
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

class EmployeeAdmin(admin.ModelAdmin):

    autocomplete_fields = ("user", )

    list_display = (
        "user_name",
        "user_email",
        "phone",
        "services_list",
        "working_program",
        "lunch_time",
        "current_year_entitlement",
        "current_year_remaining",
        "current_year_used",
    )

    search_fields = (
        "first_name",
        "last_name",
        "user__email",
        "user__username",
        "phone",
        "slug",
    )

    filter_horizontal = ("services",)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("user", "program").prefetch_related("services", "entitlements")

    @admin.display(description="Name", ordering="first_name")
    def user_name(self, obj):
        if obj.first_name and obj.last_name:
            return obj.fullname()
        return obj.pk

    @admin.display(description="Email", ordering="user__email")
    def user_email(self, obj):
        return obj.user.email or "-"

    @admin.display(description="Entitled (this year)")
    def current_year_entitlement(self, obj):
        year = date.today().year
        ent = obj.entitlements.filter(year=year).first()
        return ent.days_allocated if ent else 0

    @admin.display(description="Used (this year)")
    def current_year_used(self, obj):
        return obj.days_used(date.today().year)

    @admin.display(description="Remaining (this year)")
    def current_year_remaining(self, obj):
        return obj.days_remaining(date.today().year)

    @admin.display(description="Services")
    def services_list(self, obj):
        return ", ".join(s.name for s in obj.services.all()) or "-"

    @admin.display(description="Working Program")
    def working_program(self, obj):
        if not obj.program:
            return "-"
        return f'{obj.program.start.strftime("%H:%M")} - {obj.program.end.strftime("%H:%M")}'

    @admin.display(description="Lunch Time")
    def lunch_time(self, obj):
        if not obj.program:
            return "-"
        return f'{obj.program.break_start.strftime("%H:%M")} - {obj.program.break_end.strftime("%H:%M")}'


admin.site.register(Employee, EmployeeAdmin)