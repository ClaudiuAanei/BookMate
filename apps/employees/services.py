from apps.program.models import WorkConfig, EmployeeHoliday, PublicHoliday, LeaveEntitlement

def serialize_program(program: WorkConfig) -> dict:
    return {
        'workdays': list(program.wdays) if program else [], 
        'worktime': {
            'start': program.start.strftime("%H:%M") if program else "00:00",
            'end': program.end.strftime("%H:%M") if program else "00:00"
        },
        'launchtime': {
            'start': program.lunch_start.strftime("%H:%M") if program else None,
            'end': program.lunch_end.strftime("%H:%M") if program else None
        }
    }

def serialize_holiday(holidays: list[EmployeeHoliday]) -> list[dict]:
    return [
        {
        'id': h.id,
        'start': h.startdate.strftime('%Y-%m-%d'),
        'end': h.enddate.strftime('%Y-%m-%d'),
        'reason': h.reason,
        'is_full_day': h.is_full_day,
        'start_time': h.start_time,
        'end_time': h.end_time,
        'days': h.days_off,
        'status': h.status,
        'status_label': h.get_status_display()
        } 
    for h in holidays
    ]


def serialize_public_holiday() -> list[dict]:
    return [
        {
        "date": ph.date.strftime('%Y-%m-%d'),
        'name': ph.name
        } 
        for ph in PublicHoliday.objects.all()
    ]