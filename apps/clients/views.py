import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .services import search_clients, serialize_client
from .models import Client
from .forms import ClientForm


def create_client(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=403)
    
    data = json.loads(request.body)

    form = ClientForm(data)
    if form.is_valid():
        new_client = form.save()

        return JsonResponse({
            'status': 'success', 
            "message": "Client was successful created.", 
            } | serialize_client(new_client))
    
    return JsonResponse({"errors": form.errors}, status=400)

def update_client(request, pk):
    if request.method != "PUT":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=403)
    
    client = get_object_or_404(Client, pk=pk)
    data = json.loads(request.body)

    form = ClientForm(data, instance=client)
    if form.is_valid():
        update_client = form.save()

        return JsonResponse({
            "status": "updated",
            "message": "Client updated succesfull",
            } | serialize_client(update_client))
    
    return JsonResponse({"errors": form.errors}, status=400)

def search_client(request):
    query = request.GET.get('q', '')
    clients = search_clients(query)

    return JsonResponse(list(clients), safe=False)