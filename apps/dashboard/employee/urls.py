from django.urls import path
from . import views

app_name = "employee"

urlpatterns = [
    path("", views.index, name="employee_dashboard"),
]