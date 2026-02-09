from decimal import Decimal
from datetime import datetime, timedelta
from django import forms
from .models import Appointment
from apps.program.models import EmployeeHoliday

class AppointmentForm(forms.ModelForm):
    price = forms.DecimalField(
    required=False,
    min_value=Decimal("0.00"),
    decimal_places=2,
    max_digits=10
)
    class Meta:
        model = Appointment
        fields = ["client", "date", "start", "services"]
        error_messages = {
            'client': {'required': "Client is required.",
                       'invalid': "Invalid client selection.",
                       'does_not_exist': "Selected client does not exist.",},
            'date': {'required': "Date is required.",
                     'invalid': "Invalid date format.",},
            'start': {'required': "Start time is required.",
                      'invalid': "Invalid time format.",},
                        
        }

    def __init__(self, *args, employee=None, by_employee=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.employee = employee
        self.by_employee = by_employee

    def clean(self):
        cleaned = super().clean()

        # We need employee context to validate, so we check it first
        if self.employee is None:
            raise forms.ValidationError("Employee is required for appointment validation.")
        
        date = cleaned.get("date") # type: ignore
        start = cleaned.get("start")  # type: ignore
        services = cleaned.get("services")  # type: ignore

        if not date or not start:
            return cleaned
        
        self._validate_services_ownership(services)

        # Calculate the slot time, based on selected services
        start_dt, end_dt = self._calculate_time_window(date, start, services)

        # Check for overlapping appointments
        self._check_existing_appointments(date, start_dt, end_dt)
        # Check against employee schedule constraints
        self._check_schedule_constraints(date, start_dt, end_dt)
        
        cleaned["_computed_end_time"] = end_dt.time()  # type: ignore
        return cleaned
    
    def _validate_services_ownership(self, services):
        allowed_ids = set(self.employee.services.values_list("id", flat=True))
        picked_ids = set(services.values_list("id",flat=True))
        invalid = picked_ids - allowed_ids

        if invalid:
            raise forms.ValidationError("One or more selected services are not offered by this employee.")

    def _calculate_time_window(self, date,start, services):
        total_minutes = sum(s.duration for s in services)
        start_dt = datetime.combine(date, start)
        end_dt = start_dt + timedelta(minutes=total_minutes)
        return start_dt, end_dt
    
    def _check_existing_appointments(self, date, start_dt, end_dt):
        qs = Appointment.objects.filter(employee=self.employee, date=date, status__in=[
                Appointment.Status.CONFIRMED, 
                Appointment.Status.PENDING, 
                Appointment.Status.COMPLETED, 
                Appointment.Status.NO_SHOW
                ])

        if self.instance and self.instance.pk:
            qs = qs.exclude(pk=self.instance.pk)
        
        if qs.filter(start__lt=end_dt.time(), end__gt=start_dt.time()).exists():
            raise forms.ValidationError("This time slot overlaps an existing appointment.")
        
    def _check_schedule_constraints(self, date, start_dt, end_dt):
        """
        Validates the requested time slot against various employee constraints.
        Checks for:
        1. Full-day or partial-day holidays/leave.
        2. Working hours boundaries.
        3. Lunch break overlaps.
        """
        working_conf = self.employee.program

        holiday = self.employee.holidays.filter(
            status__in= [EmployeeHoliday.Status.CONFIRMED, EmployeeHoliday.Status.PENDING], 
            startdate__lte= date, 
            enddate__gte= date
            ).first()
        
        day = str(date.isoweekday())
        
        if day not in working_conf.wdays:
            raise forms.ValidationError("Appointment must be within working days.")
        
        if holiday:
            if holiday.is_full_day:
                raise forms.ValidationError("You can not book any appointment on this day.")
        
            if end_dt.time() > holiday.start_time and start_dt.time() < holiday.end_time:
                raise forms.ValidationError("Appointment must be within working hours.")
            
        if working_conf.lunch_start < end_dt.time() and working_conf.lunch_end > start_dt.time():
            raise forms.ValidationError("This time slot overlaps with lunch time.")
        
        if not self.by_employee and (start_dt.time() < working_conf.start or end_dt.time() > working_conf.end):
            raise forms.ValidationError("Appointment must be within working hours.")
        
    
    def save(self, commit=True):
        appointment = super().save(commit=False)
        appointment.employee = self.employee
        services = self.cleaned_data["services"]

        end_time = self.cleaned_data.get("_computed_end_time")

        custom_price = self.cleaned_data.get("price")
        calculated_price = sum((s.price for s in services))

        appointment.price = custom_price if custom_price and self.instance.pk else calculated_price
        
        if self.by_employee and self.instance.pk is None:
            appointment.status = appointment.Status.CONFIRMED

        if end_time is None:
            total_minutes = sum(s.duration for s in services)
            start_dt = datetime.combine(self.cleaned_data["date"], self.cleaned_data["start"])
            end_time = (start_dt + timedelta(minutes=total_minutes)).time()
            
        appointment.end = end_time

        if commit:
            appointment.save()
            self.save_m2m()
        
        return appointment

