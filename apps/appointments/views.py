import json
from datetime import date, datetime, timedelta
from django.utils.dateparse import parse_date

from .helpers import *
from .models import Appointment

from django.forms import model_to_dict
from django.http import JsonResponse
from django.shortcuts import get_object_or_404

@employee_required # Only employees can access a CRUD method
def create_appointment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    data = json.loads(request.body)

    # Process our requirment to create --> helpers.py
    appointment = process_appointment_form(request, data, by_employee= True)

    # If the answare is an error will return a Json response
    if isinstance(appointment, JsonResponse):
        return appointment

    return JsonResponse({"message": "Appointment created successfully", "appointment_id": appointment.id}, status= 201)

@employee_required
def get_appointments(request):
    # parse date safely (avoid comparing strings)
    start_str = request.GET.get("start") or date.today().strftime("%Y-%m-%d")
    end_str = request.GET.get("end") or (date.today() + timedelta(days=10)).strftime("%Y-%m-%d")

    start = parse_date(start_str) or date.today()
    end = parse_date(end_str) or (date.today() + timedelta(days=10))

    qs = (
        Appointment.objects
        .filter(
            employee=request.user.employee,
            date__range=(start, end),
            status__in=[
                Appointment.Status.CONFIRMED,
                Appointment.Status.PENDING,
                Appointment.Status.COMPLETED,
                Appointment.Status.NO_SHOW,
            ],
        )
        .select_related("client")
        .values("id", "date", "start", "end", "status", "client__first_name", "client__last_name")
        .order_by("-date", "-start")
    )

    data = [
        {
            "id": a["id"],
            "client": f'{a["client__first_name"] or ""} {a["client__last_name"] or ""}'.strip(),
            "date": a["date"],
            "start": a["start"],
            "end": a["end"],
            "status": a["status"],
        }
        for a in qs
    ]

    return JsonResponse({"appointments": data})


@employee_required 
def get_appointment_details(request, appointment_id):
    appointment = (
        Appointment.objects
        .filter(employee=request.user.employee, id=appointment_id)
        .select_related("client")
        .prefetch_related("services")
        .first()
    )
    if not appointment:
        return JsonResponse({"error": "Not found."}, status=404)

    services = [{
        "id": s.id,
        "name": s.name,
        "duration": s.duration,
        "price": s.price
    } for s in appointment.services.all()]

    c = appointment.client
    
    return JsonResponse({
        "id": appointment.id,
        "client": {
            "id": c.id if c else None,
            "phone": c.phone if c else "",
            "email": c.email if c else "",
            "first_name": c.first_name if c else "",
            "last_name": c.last_name if c else "",
        },
        "services": services,
        "total_price": appointment.price,
    })

@employee_required
def update_appointment_status(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    appointment = get_object_or_404(
        Appointment,
        employee=request.user.employee,
        id=appointment_id
    )

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    new_status = data.get("status")
    if not new_status:
        return JsonResponse({"error": "Missing status."}, status=400)

    # accept only known statuses
    allowed = {
        Appointment.Status.CONFIRMED,
        Appointment.Status.CANCELLED,
        Appointment.Status.DECLINED,
        Appointment.Status.NO_SHOW,
        Appointment.Status.COMPLETED,
    }
    if new_status not in allowed:
        return JsonResponse({"error": "Invalid status."}, status=400)

    if new_status == appointment.status:
        return JsonResponse(
            {"message": f"The status is already {appointment.get_status_display().lower()}."},
            status=200
        )

    appointment.status = new_status
    appointment.save(update_fields=["status", "modified_at"])

    return JsonResponse(
        {"message": f"Appointment was successfully changed to {appointment.get_status_display().lower()}."},
        status=200
    )

@employee_required
def move_appointment(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    appointment = (
        Appointment.objects
        .filter(employee=request.user.employee, pk=appointment_id)
        .select_related("client")
        .prefetch_related("services")
        .first()
    )
    if not appointment:
        return JsonResponse({"error": "Not found."}, status=404)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    new_date_raw = data.get("date", None)
    new_date = parse_date(new_date_raw) if isinstance(new_date_raw, str) else None
    if new_date_raw and not new_date:
        return JsonResponse({"error": "Invalid date."}, status=400)

    new_start = data.get("start", None)

    current_data = {
        "client": appointment.client_id,
        "services": [s.id for s in appointment.services.all()],
        "date": new_date or appointment.date,
        "start": new_start or appointment.start,
        "price": appointment.price,
    }

    result = process_appointment_form(request, current_data, True, instance=appointment)

    if isinstance(result, JsonResponse):
        return result

    return JsonResponse({"message": "Appointment was successfully moved."}, status=200)

@employee_required
def update_appointment_services(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    appointment = (
        Appointment.objects
        .filter(employee=request.user.employee, pk=appointment_id)
        .prefetch_related("services")
        .first()
    )
    if not appointment:
        return JsonResponse({"error": "Not found."}, status=404)

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    services = data.get("services", [])
    if not isinstance(services, list):
        return JsonResponse({"error": "services must be a list."}, status=400)

    try:
        services_ids = [int(x) for x in services]
    except (TypeError, ValueError):
        return JsonResponse({"error": "services must contain only integers."}, status=400)

    current_ids = set(s.id for s in appointment.services.all())
    if set(services_ids) == current_ids:
        return JsonResponse({"message": "Services unchanged."}, status=200)

    current_data = {
        "client": appointment.client_id,
        "services": services_ids,
        "date": appointment.date,
        "start": appointment.start,
    }

    result = process_appointment_form(request, current_data, True, instance=appointment)

    if isinstance(result, JsonResponse):
        return result

    return JsonResponse({"message": "Services updated successfully."}, status=200)
