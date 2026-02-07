from django.utils.text import slugify
from django.db import models
from django.conf import settings
# Create your models here.


class Employee(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="employee")
    first_name = models.CharField(max_length=100, blank=True, null= True)
    last_name = models.CharField(max_length=100, blank=True, null= True)
    phone = models.CharField(unique=True, db_index=True, blank=True)
    slug = models.SlugField(db_index=True, unique=True, blank=True)
    program = models.ForeignKey("program.WorkConfig", on_delete=models.CASCADE)
    services = models.ManyToManyField("services.Service", related_name="employees")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def fullname(self) -> str:
        if self.user:
            return f"{self.first_name} {self.last_name}"
        return f"Employee #{self.pk}"

    def days_used(self, year: int) -> float:
        qs = self.holidays.filter(status="CONF")
        total = 0
        for h in qs:
            total += float(str(h.days_off_in_year(year, exclude_public_holidays=True)))
        return total
    
    def days_remaining(self, year: int) -> float:
        ent = self.entitlements.filter(year=year).first() 
        allocated = ent.days_allocated if ent else 0
        return allocated - self.days_used(year)
    
    def days_allocated(self, year:int) -> float:
        ent = self.entitlements.filter(year=year).first()
        return ent.days_allocated if ent else 0

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f"{self.first_name} {self.last_name}")
            slug = base
            i = 2

            while Employee.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1

            self.slug = slug

        super().save(*args, **kwargs)
    
    def __str__(self) -> str:
        return self.fullname()


