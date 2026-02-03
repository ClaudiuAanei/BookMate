from django.contrib import admin
from .models import Service

class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'service_length_min', 'price_with_currency']

    @admin.display(description='price')
    def price_with_currency(self, obj):
        return f"{obj.price} €"

    @admin.display(description='Time Length')
    def service_length_min(self, obj):
        return f"{obj.duration} min"
    
admin.site.register(Service, ServiceAdmin)