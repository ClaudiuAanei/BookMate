from django.db import models

# Create your models here.
class Service(models.Model):
    name = models.CharField(max_length=50, unique=True, db_index=True)
    duration = models.IntegerField()
    price = models.FloatField()
    description = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name