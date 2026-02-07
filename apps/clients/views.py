import json
from .models import Client
from .forms import ClientForm
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from .services import search_clients, serialize_client



def create_client(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=403)
    
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON'}, status=400)
    
    form = ClientForm(data)

    if not form.is_valid():
        return JsonResponse({"status": "errors", "errors": form.errors.get_json_data()}, status=400)
    
    new_client = form.save()
    return JsonResponse({
        'status': 'success', 
        "message": "Client was successful created.", 
        "client": serialize_client(new_client)})


def update_client(request, pk):
    if request.method != "PUT":
        return JsonResponse({"status": "error", "message": "Method not allowed"}, status=403)
    
    client = get_object_or_404(Client, pk=pk)
    data = json.loads(request.body)

    form = ClientForm(data, instance=client)
    if form.is_valid():
        update_client = form.save()

        return JsonResponse({
            "status": "success",
            "message": "Client updated succesfull",
            "client": serialize_client(update_client)})
    
    return JsonResponse({"errors": form.errors}, status=400)

def search_client(request):
    query = request.GET.get('q', '')
    clients = search_clients(query)

    return JsonResponse(list(clients), safe=False)