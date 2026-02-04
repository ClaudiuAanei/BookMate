from django.shortcuts import render
from apps.clients.forms import ClientForm

# Create your views here.
def index(request):

    return render(request, "employee/calendar/index.html")