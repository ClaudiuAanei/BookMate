window.Employee = window.Employee || {};

Employee.calendarCompute = {
  calculateYFromTime(timeString) {
    const C = Employee.calendarConfig;
    const [hours, minutes] = String(timeString).split(":").map(Number);
    const totalMinutes = (hours - C.startHour) * 60 + minutes;
    const gridStartY = C.headerHeight + C.emptyRowHeight;
    return gridStartY + (totalMinutes / 60) * C.pixelPerHour;
  },

  getMinutesFromY(y) {
    const C = Employee.calendarConfig;
    return ((y - (C.headerHeight + C.emptyRowHeight)) / C.pixelPerHour) * 60;
  },

  getTimeFromY(y) {
    const C = Employee.calendarConfig;
    const U = Employee.calendarUtils;
    const min = Math.max(0, Math.round(this.getMinutesFromY(y) / 5) * 5);
    const h = Math.floor(min/60) + C.startHour;
    const m = min % 60;
    return `${U.pad2(h)}:${U.pad2(m)}`;
  },

  isOvertime(minFromStart, durationMin) {
    const C = Employee.calendarConfig;
    const startOk = (minFromStart >= (C.programStart - C.startHour) * 60);
    const endOk = ((minFromStart + durationMin) <= (C.programEnd - C.startHour) * 60);
    return !(startOk && endOk);
  },

  getBlockedZones(colIndex) {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;

    const gridStartY = C.headerHeight + C.emptyRowHeight;
    const day = new Date(S.startDate);
    day.setDate(S.startDate.getDate() + colIndex);

    const zones = []; // ✅ trebuie să fie AICI, înainte de orice zones.push

    const dayKey = U.toDateKey(day);

    // full blocked day
    if (S.blockedDays?.has(dayKey)) {
      zones.push({
        y: gridStartY,
        h: (C.endHour - C.startHour) * C.pixelPerHour
      });
      return zones;
    }

    // partial blocks
    const partial = S.partialBlocked?.get(dayKey) || [];
    for (const b of partial) {
      const y1 = this.calculateYFromTime(b.start);
      const y2 = this.calculateYFromTime(b.end);
      const top = Math.min(y1, y2);
      const bottom = Math.max(y1, y2);
      const h = Math.max(0, bottom - top);
      if (h > 0) zones.push({ y: top, h });
    }

    // lunch
    if (!U.isWeekend(day)) {
      zones.push({
        y: gridStartY + (C.lunchStart - C.startHour) * C.pixelPerHour,
        h: (C.lunchEnd - C.lunchStart) * C.pixelPerHour
      });
    }

    // existing slots (exclude slot being moved)
    for (const slot of (S.confirmedSlots || [])) {
      const sDay = new Date(slot.fullDate);
      const sCol = Math.round((sDay.getTime() - S.startDate.getTime()) / 86400000);

      if (sCol === colIndex && slot.status !== "declined" && slot.id !== S.slotToMoveId) {
        zones.push({ y: slot.y, h: (slot.duration / 60) * C.pixelPerHour });
      }
    }

    return zones;
  },

  getValidPreviewPos(mouseY, durationMin, colIndex) {
    const C = Employee.calendarConfig;
    const gridStartY = C.headerHeight + C.emptyRowHeight;

    const cH = (durationMin / 60) * C.pixelPerHour;
    const zones = this.getBlockedZones(colIndex);

    // reject inside blocked zone
    if (zones.some(z => mouseY >= z.y && mouseY <= z.y + z.h)) return null;

    let vTop = Math.max(
      gridStartY,
      Math.min(
        mouseY - (cH / 2),
        gridStartY + (C.endHour - C.startHour) * C.pixelPerHour - cH
      )
    );

    // slide away from zones
    for (const z of zones) {
      if (mouseY < z.y && vTop + cH > z.y) vTop = z.y - cH;
      else if (mouseY > z.y + z.h && vTop < z.y + z.h) vTop = z.y + z.h;
    }

    // final overlap
    const conflict = zones.some(z => vTop < z.y + z.h && vTop + cH > z.y);
    return conflict ? null : vTop;
  }
};
