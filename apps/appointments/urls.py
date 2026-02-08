from django.urls import path
from . import views

urlpatterns = [
    path("api/get-appointments/", views.get_appointments, name="get_appointments"),
    path("api/get-appointments/<int:appointment_id>/", views.get_appointment_details, name="get_appointment_details"),
]

