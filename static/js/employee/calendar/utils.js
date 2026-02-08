window.Employee = window.Employee || {};

Employee.calendarUtils = {
  dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
  monthNames: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

  pad2(n) { return String(n).padStart(2, "0"); },
  dayName(d) { return this.dayNames[d.getDay()]; },
  monthName(d) { return this.monthNames[d.getMonth()]; },
  isWeekend(d) { const g = d.getDay(); return g === 0 || g === 6; },

  fmtRange(startDate, columns) {
    const end = new Date(startDate);
    end.setDate(startDate.getDate() + (columns - 1));
    return `${startDate.getDate()} ${this.monthName(startDate)} - ${end.getDate()} ${this.monthName(end)} ${end.getFullYear()}`;
  },

  minutesToLabel(total) {
    const m = Number(total) || 0;
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r === 0 ? `${h} h` : `${h} h ${r} min`;
  },

  safeText(v, fallback="—") {
    const s = (v == null) ? "" : String(v).trim();
    return s ? s : fallback;
  },
  
    toDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  },

  parseDateOnly(ymd) {
    // ymd: "YYYY-MM-DD" -> Date la 00:00 local
    const [y, m, d] = String(ymd).split("-").map(Number);
    const dt = new Date(y, (m - 1), d);
    dt.setHours(0, 0, 0, 0);
    return dt;
  },

};
