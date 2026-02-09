window.Employee = window.Employee || {};

Employee.calendarMoreMenu = {
async openSlotExtra(slot) {
  const S = Employee.calendarState;

  // ✅ dacă aveai un booking slot selectat, îl ștergem când intri în "More"
  if (S.bookedSlot) {
    S.clearSelection();
    Employee.calendarActions.hidePill();
  }

  if (S.currentActiveSlotId === slot.id) return;

  const pill = Employee.calendarActions.el.pill;
  const isVisible = pill.classList.contains("is-visible");

  S.currentActiveSlotId = slot.id;

  if (isVisible) {
    pill.classList.add("is-switching");
    setTimeout(async () => {
      await Employee.calendarData.ensureDetailsForSlot(slot);
      Employee.calendarActions.updateActionBar(slot, true);
      requestAnimationFrame(() => pill.classList.remove("is-switching"));
    }, 150);
  } else {
    await Employee.calendarData.ensureDetailsForSlot(slot);
    Employee.calendarActions.updateActionBar(slot, true);
  }

},

  updateSlotStatus(status) {
    const S = Employee.calendarState;
    if (!S.currentActiveSlotId) return;

    const idx = S.confirmedSlots.findIndex(s => s.id === S.currentActiveSlotId);
    if (idx !== -1) {
      S.confirmedSlots[idx].status = status;
      Employee.calendarGrid.render();
    }
  },

  startMoveMode() {
    const S = Employee.calendarState;
    if (!S.currentActiveSlotId) return;

    const original = S.confirmedSlots.find(s => s.id === S.currentActiveSlotId);
    if (!original) return;

    S.slotToMoveSnapshot = {
      id: original.id,
      duration: original.duration,
      startTime: original.startTime,
      endTime: original.endTime,
      fullDate: original.fullDate,
      y: original.y,
      status: original.status,
      clientName: original.clientName,
      services: original.services,
      serviceIds: Array.isArray(original.serviceIds) ? [...original.serviceIds] : [],
      price: original.price
    };

    S.isMovingMode = true;
    S.slotToMoveId = original.id;
    S.currentActiveSlotId = null;
    Employee.calendarActions.hidePill();
    Employee.calendarGrid.render();
  },

  cancelMoveMode() {
    const S = Employee.calendarState;
    S.isMovingMode = false;
    S.slotToMoveId = null;
    S.slotToMoveSnapshot = null;
    S.proposedMoveSlot = null;
    S.currentActiveSlotId = null;
    Employee.calendarActions.closeMoveModal();
    Employee.calendarGrid.render();
  },

  onCanvasClickMoveMode(col, y) {
    const C = Employee.calendarConfig;
    const S = Employee.calendarState;
    const K = Employee.calendarCompute;
    const U = Employee.calendarUtils;

    const original = S.slotToMoveSnapshot;
    if (!original) return;

    if (col < 0 || col >= C.COLUMNS) return;

    const vTop = K.getValidPreviewPos(y, original.duration, col);
    if (vTop == null) {
      Employee.notify?.err?.("Cannot move here (blocked/collision). Try another time slot.");
      return;
    }



    const targetDate = new Date(S.startDate);
    targetDate.setDate(S.startDate.getDate() + col);

    S.proposedMoveSlot = {
      col,
      y: vTop,
      startTime: K.getTimeFromY(vTop),
      endTime: K.getTimeFromY(vTop + (original.duration/60)*C.pixelPerHour),
      fullDate: targetDate.getTime()
    };

    Employee.calendarActions.openMoveModal({
      from: `${original.startTime} - ${original.endTime}`,
      to: `${S.proposedMoveSlot.startTime} - ${S.proposedMoveSlot.endTime}`,
      date: `${targetDate.getDate()} ${U.monthName(targetDate)}`
    });
  },

confirmMove() {
  const S = Employee.calendarState;

  const snap = S.slotToMoveSnapshot;
  if (!snap) {
    Employee.notify?.err?.("Move mode is not active.");
    return;
  }

  const p = S.proposedMoveSlot;
  if (!p) {
    Employee.notify?.err?.("Click in the grid to choose a new position first.");
    return;
  }

  const idx = S.confirmedSlots.findIndex(s => String(s.id) === String(snap.id));

  if (idx !== -1) {
    S.confirmedSlots[idx].y = p.y;
    S.confirmedSlots[idx].startTime = p.startTime;
    S.confirmedSlots[idx].endTime = p.endTime;
    S.confirmedSlots[idx].fullDate = p.fullDate;
  } else {
    S.confirmedSlots.push({
      id: snap.id,
      fullDate: p.fullDate,
      y: p.y,
      duration: snap.duration,
      startTime: p.startTime,
      endTime: p.endTime,
      status: snap.status,
      clientName: snap.clientName,
      email: "",
      phone: "",
      services: snap.services,
      serviceIds: Array.isArray(snap.serviceIds) ? [...snap.serviceIds] : [],
      price: snap.price,
      _detailsLoaded: true,
    });
  }

  this.cancelMoveMode();
  Employee.calendarGrid.render();
}
};
