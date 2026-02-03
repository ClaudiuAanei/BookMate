from django.urls import path
from . import views

urlpatterns = [
    path("api/clients/", views.create_client, name="create_client"),
    path("api/clients/search/", views.search_client, name="search_client"),
    path("api/clients/<int:pk>/", views.update_client, name="update_client"),
]