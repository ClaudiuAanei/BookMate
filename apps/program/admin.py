from django.contrib import admin
from .models import *

# Register your models here.

class LeaveEntitlementAdmin(admin.ModelAdmin):
    # Această linie transformă dropdown-ul într-un select cu search bar
    autocomplete_fields = ['employee']
    
    list_display = ['employee', 'year', 'days_allocated']
    list_filter = ['year']
    
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = ['date', 'name']

class EmployeeHolidayAdmin(admin.ModelAdmin):
    list_display = ['employee', 'startdate', 'enddate']

class WorkConfigAdmin(admin.ModelAdmin):
    list_display = ['program', 'lunch', "display_working_days"]

    @admin.display(description="Lunch Time")
    def lunch(self, obj):
        return f"{obj.lunch_start.strftime("%H:%M")} - {obj.lunch_end.strftime("%H:%M")}"
    
    @admin.display(description="Working Time")
    def program(self, obj):
        return f"{obj.start.strftime("%H:%M")} - {obj.end.strftime("%H:%M")}"
    
    @admin.display(description="Working Days")
    def display_working_days(self, obj):
        return "".join(obj.get_wdays_display())


admin.site.register(EmployeeHoliday, EmployeeHolidayAdmin)
admin.site.register(PublicHoliday, PublicHolidayAdmin)
admin.site.register(LeaveEntitlement, LeaveEntitlementAdmin)
admin.site.register(WorkConfig, WorkConfigAdmin)