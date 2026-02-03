from .models import *
from django.db.models import Q
from django.shortcuts import get_object_or_404

def serialize_client(c):
    return {
        "id": c.id,
        "first_name": c.first_name,
        "last_name": c.last_name,
        "phone": c.phone,
        "email": c.email,
    }

def search_clients(query):
    if not query:
        return []
    
    terms= query.split()

    final_query = Q()

    for term in terms:
        term_query = (
            Q(last_name__icontains=term) | 
            Q(first_name__icontains=term) | 
            Q(phone__icontains=term) | 
            Q(email__icontains=term)
        )
        final_query &= term_query

    
    return Client.objects.filter(final_query).all()[:10].values("id", "first_name", "last_name", "phone", "email")