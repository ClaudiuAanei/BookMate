from django.contrib import admin
from datetime import datetime, timedelta, time
from .models import Appointment

# Register your models here.
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['client', 'slot', 'date', 'employee', 'services_list', 'price_in_euro', 'status']

    exclude = ('time_length', )
    search_fields = ['date', "first_name", "last_name", "phone", "email"]
    ordering = ['start']
    readonly_fields = ('end', 'price_in_euro')
    filter_horizontal = ('services',)


    def price_in_euro(self, obj):
        if obj.price is not None:
            return f"{obj.price} €"
        return "-"

    price_in_euro.short_description = "Price"

    def slot(self, obj):
        return f"{self.to_time(obj.start)} - {self.to_time(obj.end)}"
    slot.short_description = "Slot Booked"

    def services_list(self, obj):
        return ", ".join([s.name for s in obj.services.all()])

    @staticmethod
    def to_time(hour):
        return time.strftime(hour, "%H:%M")
    
    def save_model(self, request, obj, form, change):

        appointment_start = form.cleaned_data.get('start')
        services = form.cleaned_data.get('services')
        date_appointment = form.cleaned_data.get('date')

        total_cost = sum(service.price for service in services)

        services_length = sum(service.duration for service in services)


        full_start_datetime = datetime.combine(date_appointment, appointment_start)

        end_time = full_start_datetime + timedelta(minutes=services_length)

        obj.end = end_time.time()
        obj.price = total_cost

        super().save_model(request, obj, form, change)


# Admin register
admin.site.register(Appointment, AppointmentAdmin)
