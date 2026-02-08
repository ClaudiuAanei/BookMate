from datetime import datetime, timedelta
from django.forms import model_to_dict
from django.http import Http404, JsonResponse
from .models import Appointment


# Create your views here.
def get_appointments(request):
    if not request.user.is_authenticated:
        raise Http404()
    
    employee = getattr(request.user, "employee", None)
    if not employee:
        raise Http404() 

    start = request.GET.get("start") or datetime.today().strftime('%Y-%m-%d')
    end = request.GET.get("end") or (datetime.today() + timedelta(days=10)).strftime('%Y-%m-%d')

    appointments = Appointment.objects.filter(employee=request.user.employee, date__gte=start, date__lte=end).order_by("-date", "-start")

    context = {
        "appointments": [
            {
                "id": appointment.id,
                "client": f"{appointment.client.first_name} {appointment.client.last_name}",
                "date": appointment.date,
                "start": appointment.start,
                "end": appointment.end,
                "status": appointment.status,
            }
            for appointment in appointments
        ]
    }

    return JsonResponse(context, safe=False)


def get_appointment_details(request, appointment_id):
    if not request.user.is_authenticated:
        raise Http404()
    
    employee = getattr(request.user, "employee", None)
    if not employee:
        raise Http404() 

    appointment = Appointment.objects.filter(employee=request.user.employee, id=appointment_id).first()

    if not appointment:
        raise Http404()
    
    context = {
        "id": appointment.id,
        "client": model_to_dict(appointment.client, fields=["id", "phone", "email", "first_name", "last_name"]),
        "services": list(appointment.services.values("id", "name", "duration", "price")) or [],
        "total_price": appointment.price,
    }

    return JsonResponse(context, safe=False)

