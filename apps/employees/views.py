from django.shortcuts import render
from apps.services.models import Service

# Create your views here.
def index(request):
    context = {}
    context["services"] = list(Service.objects.all().values("id", "name", "duration", "price", "description")) or []

    return render(request, "employee/calendar/index.html", context)