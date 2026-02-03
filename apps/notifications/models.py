from django.db import models
from django.utils.translation import gettext_lazy as _

# Create your models here.
class Notification(models.Model):

    class NotificationType(models.TextChoices):
        NEW_APPOINTMENT = "new_appointment", _("New Appointment")
        CANCELED_APPOINTMENT = "appointment_cancel", _("Appointment Cancelled")
        SYSTEM_ALERT = "system_alert", _("System Alert")
        REMINDER="reminder", _("Reminder")

    type = models.CharField(max_length=50, choices=NotificationType.choices, default=NotificationType.NEW_APPOINTMENT)
    title=models.CharField(max_length=250)
    body=models.CharField(max_length=500)
    appointment = models.ForeignKey("appointments.Appointment", on_delete=models.CASCADE, related_name="notifications")
    is_read = models.BooleanField(default=False)
    action_taken=models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.NotificationType(self.type).label
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.appointment}"
