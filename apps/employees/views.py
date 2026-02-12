from .models import Employee
from .services import *
from django.http import Http404
from django.shortcuts import render
from apps.appointments.helpers import employee_required
# from django.contrib.auth.decorators import login_required


@employee_required
def index(request):
    employee = (
        Employee.objects
        .filter(user=request.user)
        .prefetch_related(
            "holidays",
            "services",
        )
        .only("id", "program")  # ajustează dacă program e FK/OneToOne; vezi nota de mai jos
        .first()
    )
    if not employee:
        raise Http404()

    calendar = {
        "program": serialize_program(employee.program),
        "holidays": serialize_holiday(employee.holidays.all()),
        "public_holidays": serialize_public_holiday(),
    }

    services = list(
        employee.services.all().values("id", "name", "duration", "price", "description")
    )

    context = {
        "calendar": calendar,
        "services": services,
    }
    return render(request, "employee/calendar/index.html", context)