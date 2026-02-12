from django.db import models
from django.conf import settings

# Create your models here.
class Appointment(models.Model):

    class Meta:
        indexes = [
            models.Index(fields=["employee", "date"], name="appt_emp_date_idx"), 
            models.Index(fields=["employee", "date", "start"], name="appt_emp_date_start_idx")
            ]

    class Status(models.TextChoices):
        PENDING = "PEND", "Pending"
        CONFIRMED = "CONF", "Confirmed"
        CANCELLED = "CANC", "Cancelled"
        DECLINED = "DECL", "Declined"
        COMPLETED = "COMP", "Completed"
        NO_SHOW = "NOSH", "Not Showed"


    date = models.DateField()
    start = models.TimeField()
    end = models.TimeField()
    employee = models.ForeignKey("employees.Employee", null=True, on_delete=models.SET_NULL, related_name="appointments")
    client = models.ForeignKey("clients.Client",on_delete=models.SET_NULL, null=True, related_name="appointments")
    services = models.ManyToManyField("services.Service", related_name="appointments")
    price = models.FloatField(max_length=6, null=True, blank=True)
    status = models.CharField(max_length=10, default=Status.PENDING, choices=Status.choices, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    @classmethod
    def final_statuses(cls):
        return {
            cls.Status.CONFIRMED,
            cls.Status.CANCELLED,
            cls.Status.DECLINED,
            cls.Status.COMPLETED,
            cls.Status.NO_SHOW,
        }

    def show_appointment(self):
        return f"{self.client}: {self.date} at {self.show_appointment_time()}"

    def show_appointment_time(self):
        return self.start

    def __str__(self):
        return self.show_appointment()