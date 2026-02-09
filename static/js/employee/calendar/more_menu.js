window.Employee = window.Employee || {};

Employee.calendarMoreMenu = {
async openSlotExtra(slot) {
  const S = Employee.calendarState;

  // ✅ dacă aveai un booking slot selectat, îl ștergem când intri în "More"
  if (S.bookedSlot) {
    S.clearSelection();
    Employee.calendarActions.hidePill();
  }

  // 🔁 dacă dai click din nou pe același slot -> retrigger animation
  if (S.currentActiveSlotId === slot.id) {
    const pill = Employee.calendarActions.el.pill;
    if (pill?.classList.contains("is-visible")) {
      pill.classList.remove("is-switching");
      void pill.offsetWidth;          // force reflow => CSS animation restarts
      pill.classList.add("is-switching");
      setTimeout(() => pill.classList.remove("is-switching"), 150);
    }
    return;
  }


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

  async updateSlotStatus(status) {
    const S = Employee.calendarState;

    const id = S.currentActiveSlotId;
    if (!id) return;

    // optimistic UI (opțional)
    const idx = S.confirmedSlots.findIndex(s => String(s.id) === String(id));
    const prev = (idx !== -1) ? S.confirmedSlots[idx].status : null;

    try {
      // 1) call backend
      const res = await Employee.calendarData.updateAppointmentStatus(id, status);

      // 2) update UI local
      if (idx !== -1) {
        S.confirmedSlots[idx].status = status;
        Employee.calendarGrid.render();
      }

      // 3) toast OK (folosește ce întoarce backend-ul dacă există)
      const okMsg = res?.message || "Status updated.";
      Employee.notify?.ok?.(okMsg);

      Employee.calendarData.scheduleReload(1000);

    } catch (err) {
      console.error(err);

      // rollback UI dacă ai făcut optimistic
      if (idx !== -1 && prev != null) {
        S.confirmedSlots[idx].status = prev;
        Employee.calendarGrid.render();
      }

      const serverMsg =
        err?.data?.error ||
        err?.data?.message ||
        err?.message ||
        "Failed to update status.";

      Employee.notify?.err?.(serverMsg);
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

async confirmMove() {
  const S = Employee.calendarState;
  const U = Employee.calendarUtils;

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

  const appointmentId = snap.id;

  // payload către backend
  const dateStr = U.toDateKey(new Date(p.fullDate)); // "YYYY-MM-DD"
  const payload = {
    date: dateStr,
    start: p.startTime,
    end: p.endTime
  };

  try {
    const res = await Employee.calendarData.moveAppointment(appointmentId, payload);

    // ✅ update local UI (mutăm slot-ul în calendar)
    const idx = S.confirmedSlots.findIndex(s => String(s.id) === String(appointmentId));
    if (idx !== -1) {
      S.confirmedSlots[idx].y = p.y;
      S.confirmedSlots[idx].startTime = p.startTime;
      S.confirmedSlots[idx].endTime = p.endTime;
      S.confirmedSlots[idx].fullDate = p.fullDate;
    }

    // ✅ ieșim din move mode + rerender
    this.cancelMoveMode();
    Employee.calendarGrid.render();

    const okMsg = res?.message || "Appointment moved.";
    Employee.notify?.ok?.(okMsg);
    Employee.calendarData.scheduleReload(1000);

  } catch (err) {
    console.error(err);

    const serverMsg =
      err?.data?.error ||
      err?.data?.message ||
      err?.message ||
      "Failed to move appointment.";

    Employee.notify?.err?.(serverMsg);

    // rămâi în move mode ca să poți încerca alt interval
    // (NU apelăm cancelMoveMode aici)
  }
},

};
