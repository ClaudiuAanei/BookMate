window.Employee = window.Employee || {};

Employee.calendarData = {
  endpoints: {
    list: "/employee/api/appointments/",
    create: "/employee/api/appointments/create-appointment/",
    details: (id) => `/employee/api/appointments/${id}/details`,
  },
  async _getJSON(url) {
    const res = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} for ${url} :: ${txt}`);
    }
    return res.json();
  },

  _mapStatus(raw) {
    const s = String(raw || "").toLowerCase();

    // ajustează aici în funcție de ce ai în model (ex: "PEND", "CONF" etc)
    if (s === "pend" || s === "pending") return "pending";
    if (s === "conf" || s === "confirmed") return "confirmed";
    if (s === "comp" || s === "completed") return "completed";
    if (s === "nosh" || s === "no_show" || s === "no-show") return "noshow";
    if (s === "decl" || s === "declined" || s === "canceled" || s === "cancelled") return "declined";

    return "confirmed";
  },

  applyBackend(payload) {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;

    if (!payload) return;

    const prog = payload.program || {};
    const wt = prog.worktime || {};
    const lt = prog.launchtime || {};

    // parse "HH:MM" -> hour as number (08:00 -> 8)
    const hourFrom = (t) => Number(String(t || "0:0").split(":")[0] || 0);

    const programStart = hourFrom(wt.start);
    const programEnd = hourFrom(wt.end);
    const lunchStart = hourFrom(lt.start);
    const lunchEnd = hourFrom(lt.end);

    // config update
    if (Number.isFinite(programStart)) C.programStart = programStart;
    if (Number.isFinite(programEnd)) C.programEnd = programEnd;

    // grid hours: startHour = programStart; endHour = programEnd + 4
    C.startHour = C.programStart;
    C.endHour = C.programEnd + 4;

    if (Number.isFinite(lunchStart)) C.lunchStart = lunchStart;
    if (Number.isFinite(lunchEnd)) C.lunchEnd = lunchEnd;

    // reset blocks
    S.blockedDays = new Set();
    S.partialBlocked = new Map();
    S.blockedDayLabels = new Map();

    // add public holidays => full-day blocks
    for (const ph of (payload.public_holidays || [])) {
      if (!ph?.date) continue;
      const key = String(ph.date);
      S.blockedDays.add(key);

      // label = name (ex: Easter)
      const label = String(ph.name || "").trim();
      if (label) S.blockedDayLabels.set(key, label);
    }

    const okStatuses = new Set(["PEND", "CONF"]);

    // helper iterate inclusive dates
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      x.setHours(0,0,0,0);
      return x;
    };

    for (const h of (payload.holidays || [])) {
      if (!h?.start || !h?.end) continue;
      if (!okStatuses.has(String(h.status))) continue;

      const start = U.parseDateOnly(h.start);
      const end = U.parseDateOnly(h.end);

      // inclusive
      for (let d = new Date(start); d.getTime() <= end.getTime(); d = addDays(d, 1)) {
        const key = U.toDateKey(d);

        if (h.is_full_day) {
          S.blockedDays.add(key);

          // label = reason, fallback HOLIDAY
          const reason = String(h.reason || "").trim();
          if (reason) S.blockedDayLabels.set(key, reason);
          else if (!S.blockedDayLabels.has(key)) S.blockedDayLabels.set(key, "HOLIDAY");
        } else {
          const st = String(h.start_time || "").trim();
          const en = String(h.end_time || "").trim();
          if (!st || !en) continue;

          const list = S.partialBlocked.get(key) || [];
          list.push({ start: st, end: en });
          S.partialBlocked.set(key, list);
        }
      }
    }
  },


  // ready for fetch later
async fetchSlots(rangeStart, rangeEnd) {
  const U = Employee.calendarUtils;

  const toYMD = (d) => {
    if (typeof d === "string") return d;
    return U.toDateKey(d); // YYYY-MM-DD
  };

  const params = new URLSearchParams({
    start: toYMD(rangeStart),
    end: toYMD(rangeEnd),
  });

  const url = `${this.endpoints.list}?${params.toString()}`;

  const data = await this._getJSON(url);

  return Array.isArray(data.appointments) ? data.appointments : [];
},

async loadRangeAndRender() {
  const C = Employee.calendarConfig;
  const S = Employee.calendarState;
  const U = Employee.calendarUtils;
  const K = Employee.calendarCompute;

  if (!S.startDate) return;

  // rangeStart
  const rangeStart = new Date(S.startDate);
  rangeStart.setHours(0,0,0,0);

  // rangeEnd (CORECT: definit înainte de URL)
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + (C.COLUMNS - 1));
  rangeEnd.setHours(0,0,0,0);

  // 🔗 sync URL (start + end)
  try {
    const params = new URLSearchParams(window.location.search);
    params.set("start", U.toDateKey(rangeStart));
    params.set("end", U.toDateKey(rangeEnd));

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  } catch (e) {}

  // fetch
  let rows = [];
  try {
    rows = await this.fetchSlots(rangeStart, rangeEnd);
  } catch (e) {
    console.error(e);
    Employee.notify?.err?.("Failed to load appointments.");
    rows = [];
  }

  S.confirmedSlots = rows.map(a => {
    const dateObj = U.parseDateOnly(a.date);
    const fullDate = dateObj.getTime();

    const startStr = String(a.start || "").slice(0,5);
    const endStr   = String(a.end || "").slice(0,5);

    const [sh, sm] = startStr.split(":").map(Number);
    const [eh, em] = endStr.split(":").map(Number);
    const duration = Math.max(5, ((eh*60+em) - (sh*60+sm)) || 0);

    return {
      id: a.id,
      fullDate,
      y: K.calculateYFromTime(startStr),
      duration,
      startTime: startStr,
      endTime: endStr,
      status: this._mapStatus(a.status),
      clientName: a.client || "Client",
      email: "",
      phone: "",
      services: "",
      serviceIds: [],
      price: null,
      _detailsLoaded: false,
    };
  });

  Employee.calendarGrid.render();
  requestAnimationFrame(() => Employee.calendarSelection.refreshPreview());
},

  async fetchAppointmentDetails(appointmentId) {
    const url = this.endpoints.details(appointmentId);
    return this._getJSON(url);
  },

  async ensureDetailsForSlot(slot) {
    if (!slot || !slot.id) return slot;
    if (slot._detailsLoaded) return slot;

    let data;
    try {
      data = await this.fetchAppointmentDetails(slot.id);
    } catch (e) {
      console.error(e);
      Employee.notify?.err?.("Failed to load appointment details.");
      return slot;
    }

    // backend response:
    // { id, client:{...}, services:[{id,name,duration,price}], total_price }
    const c = data.client || {};
    const services = Array.isArray(data.services) ? data.services : [];

    slot.clientName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || slot.clientName || "Client";
    slot.email = c.email || "";
    slot.phone = c.phone || "";
    slot.services = services.map(s => s.name).filter(Boolean).join(", ");
    slot.serviceIds = services.map(s => Number(s.id)).filter(Number.isFinite);
    slot.price = Number(data.total_price || 0);

    slot._detailsLoaded = true;
    return slot;
  },



  async createSlot(payload) {
  if (!payload) throw new Error("Missing payload");

  const res = await fetch(this.endpoints.create, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "X-CSRFToken": Employee.csrf.token(),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch { data = { raw: text }; }

  if (!res.ok) {
    const msg = data?.message || data?.detail || "Booking failed";
    const err = new Error(msg);
    err.data = data;
    throw err;
  }

  return data;
},

  async updateSlot(/* id, payload */) { return null; }
};
