from django.contrib import admin
from .models import Client

# Register your models here.
class ClientAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "email", "phone", "user_account"]

    @admin.display(description="User Account")
    def user_account(self, obj):
        if obj.user:
            return obj.user
        return "-"

admin.site.register(Client, ClientAdmin)