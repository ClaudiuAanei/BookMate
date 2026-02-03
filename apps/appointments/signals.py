from django.apps import apps
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Appointment


@receiver(pre_save, sender=Appointment)
def appointment_remember_old_status(sender, instance: Appointment, **kwargs):
    if not instance.pk:
        instance._old_status = None
        return

    instance._old_status = (
        sender.objects.filter(pk=instance.pk)
        .values_list("status", flat=True)
        .first()
    )


@receiver(post_save, sender=Appointment)
def appointment_manage_notifications(sender, instance: Appointment, created: bool, **kwargs):
    Notification = apps.get_model("notifications", "Notification")

    if created:
        Notification.objects.create(
            appointment=instance,
            body=instance.show_appointment(),
        )
        return

    finals = Appointment.final_statuses()
    old = getattr(instance, "_old_status", None)

    if instance.status in finals and old not in finals:
        instance.notifications.filter(action_taken=False).update(
            action_taken=True,
            is_read=True,
        )
