from django.contrib import admin
from .models import Notification

# Register your models here.
class NotificationAdmin(admin.ModelAdmin):
    list_display= ["title", "appointment", "body", "created_at", "modified_at", "type"]


admin.site.register(Notification, NotificationAdmin)