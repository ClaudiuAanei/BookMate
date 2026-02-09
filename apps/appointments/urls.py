from django.urls import path
from . import views

urlpatterns = [
    path("employee/api/appointments/create-appointment/", views.create_appointment, name="create_appointment"),
    path("employee/api/appointments/", views.get_appointments, name="get_appointments"),
    path("employee/api/appointments/<int:appointment_id>/details/", views.get_appointment_details, name="get_appointment_details"),
    path("employee/api/appointments/<int:appointment_id>/update-status/", views.update_appointment_status, name="update-appointment-status"),
    path("employee/api/appointments/<int:appointment_id>/move/", views.move_appointment, name="move-appointments"),
]

