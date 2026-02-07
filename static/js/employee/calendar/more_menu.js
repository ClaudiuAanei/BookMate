window.Employee = window.Employee || {};

Employee.calendarMoreMenu = {
openSlotExtra(slot) {
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
    setTimeout(() => {
      Employee.calendarActions.updateActionBar(slot, true);
      requestAnimationFrame(() => pill.classList.remove("is-switching"));
    }, 150);
  } else {
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

    S.isMovingMode = true;
    S.slotToMoveId = S.currentActiveSlotId;
    S.currentActiveSlotId = null;
    Employee.calendarActions.hidePill(); // hide management bar while moving
    Employee.calendarGrid.render();
  },

  cancelMoveMode() {
    const S = Employee.calendarState;
    S.isMovingMode = false;
    S.slotToMoveId = null;
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

    const original = S.confirmedSlots.find(s => s.id === S.slotToMoveId);
    if (!original) return;

    const vTop = K.getValidPreviewPos(y, original.duration, col);
    if (vTop == null) return;

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
    if (!S.proposedMoveSlot || !S.slotToMoveId) return;

    const idx = S.confirmedSlots.findIndex(s => s.id === S.slotToMoveId);
    if (idx !== -1) {
      const p = S.proposedMoveSlot;
      S.confirmedSlots[idx].y = p.y;
      S.confirmedSlots[idx].startTime = p.startTime;
      S.confirmedSlots[idx].endTime = p.endTime;
      S.confirmedSlots[idx].fullDate = p.fullDate;
      // keep status (or force confirmed — după preferință)
      if (!S.confirmedSlots[idx].status) S.confirmedSlots[idx].status = "confirmed";
    }

    this.cancelMoveMode();
  }
};
