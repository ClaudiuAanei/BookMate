from django.shortcuts import redirect, render
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

# Create your views here.
def home(request):
    return render(request, "site/index.html")

def register_view(request):
    return render(request, "site/partials/register.html")

def login_view(request):
    next_url = request.GET.get("next", "home")

    if request.method == "POST":
        next_url = request.POST.get("next", "home")
        user = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=user, password=password)
        if user is not None:
            login(request, user)
            return redirect(next_url)
        
        else:
            messages.error(request, "Invalid username or password")

    return render(request, "site/partials/login.html", {"next": next_url})

def logout_view(request):
    logout(request)
    return redirect("home") 