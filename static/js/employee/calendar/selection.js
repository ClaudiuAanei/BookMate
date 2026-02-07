window.Employee = window.Employee || {};

Employee.calendarSelection = {
  init({ canvas }) {
    this.canvas = canvas;

    canvas.addEventListener("mousemove", (e) => this._onMove(e));
    canvas.addEventListener("mousedown", (e) => this._onDown(e));
  },

  _colFromX(x) {
    const C = Employee.calendarConfig;
    const colW = (window.innerWidth - C.timeColWidth) / C.COLUMNS;
    return Math.floor((x - C.timeColWidth) / colW);
  },

  _onMove(e) {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;
    const K = Employee.calendarCompute;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = this._colFromX(x);
    Employee.calendarGrid.setMouse(x, y, col);

    const gridStartY = C.headerHeight + C.emptyRowHeight;
    const day = new Date(S.startDate);
    day.setDate(S.startDate.getDate() + col);
    const isWK = U.isWeekend(day);

    // detect hover on "more dots"
    let isOverMoreBtn = false;
    const colW = (window.innerWidth - C.timeColWidth) / C.COLUMNS;

    if (col >= 0 && col < C.COLUMNS && !S.isMovingMode) {
      for (const slot of S.confirmedSlots) {
        const sDay = new Date(slot.fullDate);
        const sCol = Math.round((sDay.getTime() - S.startDate.getTime()) / 86400000);
        if (sCol !== col) continue;

        const dotX = C.timeColWidth + (col * colW) + colW - 14;
        const dotCenterY = slot.y + 14;
        if (x >= dotX - 12 && x <= dotX + 12 && y >= dotCenterY - 12 && y <= dotCenterY + 12) {
          isOverMoreBtn = true;
          break;
        }
      }
    }

    if (isOverMoreBtn) {
      this.canvas.style.cursor = "pointer";
    } else if (col >= 0 && col < C.COLUMNS && x >= C.timeColWidth) {
      if (isWK) {
        this.canvas.style.cursor = "not-allowed";
      } else {
        const isHead = y < C.headerHeight;

        const dur =
          (S.isMovingMode && S.slotToMoveId)
            ? (S.confirmedSlots.find(s => s.id === S.slotToMoveId)?.duration || 0)
            : (S.durationMin || 0);

        const vTop = K.getValidPreviewPos(y, dur, col);
        const isGrid = (!S.bookedSlot && dur > 0 && y >= gridStartY && vTop != null);

        if (S.isMovingMode) {
          this.canvas.style.cursor = isGrid ? "move" : "not-allowed";
        } else {
          this.canvas.style.cursor = (isHead || isGrid) ? "pointer" : "default";
        }
      }
    } else {
      this.canvas.style.cursor = "default";
    }

    requestAnimationFrame(() => Employee.calendarGrid.render());
  },

  _onDown(e) {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;
    const K = Employee.calendarCompute;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < C.timeColWidth) return;

    const col = this._colFromX(x);
    const gridStartY = C.headerHeight + C.emptyRowHeight;

    if (col < 0 || col >= C.COLUMNS) return;

    // MOVING MODE: click grid to propose move
    if (S.isMovingMode) {
      if (y >= gridStartY) {
        const target = new Date(S.startDate);
        target.setDate(S.startDate.getDate() + col);
        if (!U.isWeekend(target)) Employee.calendarMoreMenu.onCanvasClickMoveMode(col, y);
      }
      return;
    }

    // MORE BUTTON CLICK?
    const colW = (window.innerWidth - C.timeColWidth) / C.COLUMNS;
    for (const slot of S.confirmedSlots) {
      const sDay = new Date(slot.fullDate);
      const sCol = Math.round((sDay.getTime() - S.startDate.getTime()) / 86400000);
      if (sCol !== col) continue;

      const dotX = C.timeColWidth + (col * colW) + colW - 14;
      const dotCenterY = slot.y + 14;

      if (x >= dotX - 12 && x <= dotX + 12 && y >= dotCenterY - 12 && y <= dotCenterY + 12) {
        Employee.calendarMoreMenu.openSlotExtra(slot);
        Employee.calendarGrid.render();
        return;
      }
    }

    // HEADER CLICK -> select day
// HEADER CLICK -> select day
if (y < C.headerHeight) {
  // ✅ dacă era un slot selectat, îl ștergem când dai click pe header
  if (S.bookedSlot) {
    S.clearSelection();
    Employee.calendarActions.hidePill();
  }

  const target = new Date(S.startDate);
  target.setDate(S.startDate.getDate() + col);
  if (!U.isWeekend(target)) {
    S.selectedDate = target;
    Employee.calendarGrid.render();
  }
  return;
}


    // GRID CLICK -> booking selection
if (y >= gridStartY) {
  const target = new Date(S.startDate);
  target.setDate(S.startDate.getDate() + col);

  // ✅ dacă dai click pe weekend, ștergem selecția curentă
  if (U.isWeekend(target)) {
    if (S.bookedSlot) {
      S.clearSelection();
      Employee.calendarActions.hidePill();
      Employee.calendarGrid.render();
    }
    return;
  }

  if (S.bookedSlot) {
    S.clearSelection();
    Employee.calendarActions.hidePill();
    Employee.calendarGrid.render();
    return;
  }

  const hasClient = !!Employee.store?.selectedClientId;
  const hasServices = (Employee.store?.confirmedServiceIds || []).length > 0;

  if (!hasClient || !hasServices) {
    // aici e alegere de UX: eu NU aș șterge automat, doar afișez mesajul
    Employee.notify?.err?.("Select a client and confirm services first.");
    return;
  }

  const duration = S.durationMin || 0;
  if (duration <= 0) {
    Employee.notify?.err?.("Selected services have no duration.");
    return;
  }

  const vTop = K.getValidPreviewPos(y, duration, col);

  // ✅ click în grid dar poziție invalidă (coliziune / în afara zonei) => clear selecția veche
  if (vTop == null) {
    if (S.bookedSlot) {
      S.clearSelection();
      Employee.calendarActions.hidePill();
      Employee.calendarGrid.render();
    }
    return;
  }

  // ... restul rămâne identic (setezi bookedSlot nou)


      const min = Math.round(K.getMinutesFromY(vTop) / 5) * 5;
      const isOT = K.isOvertime(min, duration);

      S.overtimeAgreed = false;
      S.bookedSlot = {
        col,
        y: vTop,
        duration,
        startTime: K.getTimeFromY(vTop),
        endTime: K.getTimeFromY(vTop + (duration/60)*C.pixelPerHour),
        isOvertime: isOT,
        fullDate: target.getTime(),
        status: "pending"
      };

      Employee.calendarActions.updateActionBar(S.bookedSlot, false);
      Employee.calendarGrid.render();
    }
  }
};
