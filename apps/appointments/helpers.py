from django.http import JsonResponse, Http404
from functools import wraps
from .forms import AppointmentForm

def get_form_error_message(form):
    """Will look at the first error in a form and will return it"""
    all_errors = form.errors.get_json_data()
    if '__all__' in all_errors:
        error_msg = all_errors['__all__'][0]['message']
    else:
        first_field = next(iter(all_errors))
        error_msg = all_errors[first_field][0]['message']

    return error_msg

def process_appointment_form(request, form_data, by_employee=False, instance=None):
    """Process the form for creating/updating an appointment"""
    employee = request.user.employee
    form = AppointmentForm(form_data, employee=employee, by_employee=by_employee, instance=instance)
    
    if not form.is_valid():
        error_msg = get_form_error_message(form)
        return JsonResponse({"error": str(error_msg)}, status=400)
    
    appointment = form.save()

    return appointment

def employee_required(func):
    """Decorator to verify if user is loged in and employee"""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:

            if request.content_type == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                 return JsonResponse({"error": "Unauthorized"}, status=401)
            return JsonResponse({"error": "Unauthorized"}, status=401)

        if not getattr(request.user, "employee", None) or not request.user.is_staff:
            raise Http404()
        
        return func(request, *args, **kwargs)
    return wrapper