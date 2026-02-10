# BookMate
# Appointment Scheduling System

A production-oriented appointment scheduling system built with **Django** and **JavaScript**, designed to handle **real-world constraints** such as working hours, lunch breaks, holidays, and complex appointment moves across days. This project got my interes while i was schadule an appointment at my barber and i saw him that he note all his appointments on a paper. I won't write a whole story about it. Short: I saw him strugle with clients, with double booking and so on.

So this is made to be a gift for him and a nice project for my portfolio. 

I learned many libraries and python for only one reason: to create something that can really help others.

This is **not** a demo calendar. It is a rule-driven scheduling engine with a custom UI and strict backend validation.
---

## Features

### Interactive Calendar
- Day-based time grid
- Navigation: **previous / next / today / quick jump**
- URL-driven state using `start` and `end` query parameters
- State persistence on refresh

### Working Time Rules (Later admin dashboard will create employees. for now i used only django/admin to create them)
- Configurable working hours per employee 
- Lunch break blocking
- Automatic blocking for:
  - weekends
  - public holidays
  - full-day and partial holidays
- Visual shading + logical enforcement

### 🧠 Smart Booking Logic
- Appointments can only be created if they **fully fit** in available time
- No overlapping appointments
- No booking inside lunch breaks or holidays
- Hover preview appears **only** for valid slots
- Backend validation mirrors frontend rules (UI cannot bypass logic)

### Appointment MOVE Mode
- Dedicated MOVE mode for rescheduling existing appointments
- Live preview of the new position
- Supports moving appointments across different days
- MOVE preview persists during calendar navigation
- Confirm / cancel workflow
- MOVE blocked on invalid days or time ranges

### Optimized Data Fetching
- Lightweight endpoint for calendar rendering
- Detailed appointment data fetched **only on demand** (`More` action)
- Reduced payload and improved performance

---

## Tech Stack

- **Backend:** Django 6.0.1
- **Frontend:** JavaScript and Tailwind generated with A.I. ... small contributions on UI and UX
- **Database:** Django ORM
- **Architecture:** REST-style endpoints with strict server-side validation

---

## 🛠️ Setup (Local)

```bash
python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py runserver

