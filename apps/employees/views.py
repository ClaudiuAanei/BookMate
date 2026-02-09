import json
from django.http import Http404
from django.shortcuts import render
# from django.contrib.auth.decorators import login_required
from .models import Employee
from .services import *
from django.shortcuts import get_object_or_404


def index(request):
    if not request.user.is_authenticated:
        raise Http404()
    
    employee = get_object_or_404(Employee, user=request.user)
    context = {}

    calendar = {
        "program": serialize_program(employee.program),
        "holidays": serialize_holiday(employee.holidays.all()),
        "public_holidays": serialize_public_holiday(),
    }

    context["services"] = list(employee.services.all().values("id", "name", "duration", "price", "description")) or []
    context["calendar"] = calendar

    return render(request, "employee/calendar/index.html", context)