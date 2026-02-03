from django.db.models.signals import post_delete
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

@receiver(post_delete, sender=Employee)
def unset_user_employee_flag(sender, instance, **kwargs):
    if instance.user_id:
        User.objects.filter(pk=instance.user_id).update(is_employee=False)

@receiver(post_save, sender=Employee)
def set_user_employee_flag(sender, instance, created, **kwargs):
    if instance.user_id:
        User.objects.filter(pk=instance.user_id).update(is_employee=True)
