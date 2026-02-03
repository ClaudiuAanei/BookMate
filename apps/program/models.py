from django.db import models
from datetime import date, timedelta, time
from django.core.exceptions import ValidationError
from multiselectfield import MultiSelectField


class WorkConfig(models.Model):
    WEEKDAYS = (('1', 'Monday'), ('2', "Tuesday"), ('3', "Wednesday"), ('4', "Thursday"), ('5', "Friday"), ('6', "Saturday"), ('7', "Sunday"))

    wdays= MultiSelectField(choices=WEEKDAYS, max_choices=7, max_length = 14, verbose_name="Working Days")
    start = models.TimeField()
    end = models.TimeField()
    lunch_start = models.TimeField()
    lunch_end = models.TimeField()

    class Meta:
        verbose_name = "Working Program"
        verbose_name_plural = "Working Programs"

    def clean(self):
        if self.start and self.end and self.start >= self.end:
            raise ValidationError("Starting hour can't be bigger than ending.")

        if self.lunch_start and self.lunch_end and self.lunch_start >= self.lunch_end:
            raise ValidationError("Starting break can't be bigger or equal than break ending.")

        if self.start and self.end and self.lunch_start and self.lunch_end:
            if not (self.start <= self.lunch_start < self.lunch_end <= self.end):
                raise ValidationError("Break must be inside working hours.")
        
        if self.to_minutes(self.end) - self.to_minutes(self.start) < 240:
            raise ValidationError("The differance between start and end must be at least 4 hours")
        
    def to_minutes(self, t):
        return (t.hour * 60 + t.minute / 60)

    @property
    def interval(self) -> tuple:
        return self.start, self.end

    @staticmethod
    def time_format(the_time: time):
        return the_time.strftime("%H:%M")

    def __str__(self):
        return f"{self.time_format(self.start)} - {self.time_format(self.end)}"

class EmployeeHoliday(models.Model):

    class Status(models.TextChoices):
        PENDING = "PEND", "Pending"
        CONFIRMED = "CONF", "Confirmed"
        DECLINED = "DECL", "Declined"

    startdate = models.DateField()
    enddate = models.DateField()
    status = models.CharField(max_length=10, default=Status.PENDING, choices=Status.choices, db_index=True)
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="holidays")
    is_full_day = models.BooleanField(default=True)
    
    # Those are optional for half day dayoff
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    reason = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['employee', 'startdate', 'enddate'],
                name='unique_employee_holiday'
            )
        ]
    
    def clean(self):
        if not self.is_full_day and self.startdate != self.enddate:
            raise ValidationError("Half-day leave must be a single day.")

    def _compute_days_off_between(self, start, end, exclude_public_holidays=True) -> float:
        wc = self.employee.program
        workdays = set(wc.wdays or [])
        if not workdays:
            return 0

        holidays = set()
        if exclude_public_holidays:
            holidays = set(
                PublicHoliday.objects.filter(date__range=(start, end))
                .values_list("date", flat=True)
            )

        cur = start
        count = 0
        while cur <= end:
            if cur.isoweekday() in workdays and cur not in holidays:
                count += 1
            cur += timedelta(days=1)

        if not self.is_full_day:
            return 0.5 if count == 1 else 0.0

        return float(count)

    def days_off_in_year(self, year: int, exclude_public_holidays=True) -> float:
        if not self.startdate or not self.enddate:
            return 0

        year_start = date(year, 1, 1)
        year_end = date(year, 12, 31)

        start = max(self.startdate, year_start)
        end = min(self.enddate, year_end)
        if end < start:
            return 0

        return self._compute_days_off_between(start, end, exclude_public_holidays)

    @property
    def days_off(self) -> float:
        return self._compute_days_off_between(self.startdate, self.enddate, True)
    
class LeaveEntitlement(models.Model):
    employee = models.ForeignKey("employees.Employee", on_delete=models.CASCADE, related_name="entitlements")
    year = models.IntegerField(db_index=True)
    days_allocated = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["employee", "year"], name="uniq_employee_year_entitlement")
        ]

class PublicHoliday(models.Model):
    date = models.DateField(unique=True)
    name = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name