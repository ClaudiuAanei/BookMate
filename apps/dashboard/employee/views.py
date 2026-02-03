import json
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse

def index(request):
    return render(request, "employee/calendar/index.html")