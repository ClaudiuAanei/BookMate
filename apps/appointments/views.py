import json
from datetime import datetime, timedelta

from .helpers import *
from .models import Appointment

from django.forms import model_to_dict
from django.http import JsonResponse
from django.shortcuts import get_object_or_404


@employee_required
def create_appointment(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    data = json.loads(request.body)
    appointment = process_appointment_form(request, data, by_employee= True)

    if isinstance(appointment, JsonResponse):
        return appointment

    return JsonResponse({"message": "Appointment created successfully", "appointment_id": appointment.id})

@employee_required
def get_appointments(request):
    start = request.GET.get("start") or datetime.today().strftime('%Y-%m-%d')
    end = request.GET.get("end") or (datetime.today() + timedelta(days=10)).strftime('%Y-%m-%d')

    appointments = Appointment.objects.filter(
        employee=request.user.employee, 
        date__gte=start, date__lte=end,
                status__in=[
            Appointment.Status.CONFIRMED, 
            Appointment.Status.PENDING, 
            Appointment.Status.COMPLETED, 
            Appointment.Status.NO_SHOW
        ]
        ).order_by("-date", "-start")

    data = [{
                "id": appointment.id,
                "client": f"{appointment.client.first_name} {appointment.client.last_name}",
                "date": appointment.date,
                "start": appointment.start,
                "end": appointment.end,
                "status": appointment.status,
            }
            for appointment in appointments
        ]

    return JsonResponse({"appointments": data}, safe=False)


@employee_required
def get_appointment_details(request, appointment_id):
    appointment = get_object_or_404(Appointment, employee=request.user.employee, id=appointment_id)

    context = {
        "id": appointment.id,
        "client": model_to_dict(appointment.client, fields=["id", "phone", "email", "first_name", "last_name"]),
        "services": list(appointment.services.values("id", "name", "duration", "price")) or [],
        "total_price": appointment.price,
    }

    return JsonResponse(context, safe=False)

@employee_required
def update_appointment_status(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)
    
    appointment = get_object_or_404(Appointment, employee=request.user.employee, id=appointment_id)
    
    action = {
        "CONF": appointment.Status.CONFIRMED,
        "CANC": appointment.Status.CANCELLED,
        "DECL": appointment.Status.DECLINED,
        "NOSH": appointment.Status.NO_SHOW,
        "COMP": appointment.Status.COMPLETED,
    }
    try:
        data = json.loads(request.body)
        new_status = data.get('status', None)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    
    if new_status == appointment.status:
        return JsonResponse({"message": f"The status is already {appointment.get_status_display()}"}, status=200)

    if new_status is None or new_status not in action:
        return JsonResponse({"error": "Invalid status."}, status=400)
    
    appointment.status = action[new_status]
    appointment.save()
    
    return JsonResponse({'message': f"Appointment was successful changed to {appointment.get_status_display()}"}, status=200)

@employee_required
def move_appointment(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    appointment = get_object_or_404(Appointment, employee=request.user.employee, pk=appointment_id)
    data = json.loads(request.body)

    current_data = {
            "client": appointment.client_id,
            "services": list(appointment.services.values_list('id', flat=True)),
            "date": data.get("date", appointment.date),
            "start": data.get("start", appointment.start),
            "price": appointment.price,
        }
    
    result = process_appointment_form(request, current_data, True, instance=appointment)

    if isinstance(result, JsonResponse):
        return result

    return JsonResponse({"message": "Appointment moved."}, status=200)

@employee_required
def update_appointment_services(request, appointment_id):
    if request.method != "PATCH":
        return JsonResponse({"error": "Method not allowed."}, status=405)

    appointment = get_object_or_404(Appointment, employee=request.user.employee, pk=appointment_id)
    data = json.loads(request.body)

    services = data.get("services", [])

    current_data = {
            "client": appointment.client_id,
            "services": services,
            "date": appointment.date,
            "start": appointment.start,
        }
    
    result = process_appointment_form(request, current_data, True, appointment)

    if isinstance(result, JsonResponse):
        return result

    return JsonResponse({"message": "Services updated successfully."})


