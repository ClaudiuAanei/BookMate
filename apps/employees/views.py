from .models import Employee
from .services import *
from django.shortcuts import render, get_object_or_404
from apps.appointments.helpers import employee_required
# from django.contrib.auth.decorators import login_required


@employee_required
def index(request):
    employee = get_object_or_404(Employee, user=request.user)
    context = {}

    calendar = {
        "program": serialize_program(employee.program),
        "holidays": serialize_holiday(employee.holidays.all()),
        "public_holidays": serialize_public_holiday(),
    }

    context["calendar"] = calendar
    context["services"] = list(employee.services.all().values("id", "name", "duration", "price", "description")) or []

    return render(request, "employee/calendar/index.html", context)