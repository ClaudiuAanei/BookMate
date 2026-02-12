window.Employee = window.Employee || {};

Employee.calendarMoreMenu = {

async refreshPillForSlot(slot) {
  if (!slot || !slot.id) return;

  const A = Employee.calendarActions;

  // Forțează refetch de detalii (GET /details/)
  slot._detailsLoaded = false;
  await Employee.calendarData.ensureDetailsForSlot(slot);

  // Reafișează pill-ul pe baza datelor actualizate
  A.updateActionBar(slot, true);

  // Redraw
  Employee.calendarGrid.render();
},


async openSlotExtra(slot) {
  const S = Employee.calendarState;
  const A = Employee.calendarActions;

  // dacă aveai booking slot selectat, îl ștergem când intri în "More"
  if (S.bookedSlot) {
    S.clearSelection();
    A.hidePill();
  }

  // retrigger animation la același slot (fără fetch nou)
  if (S.currentActiveSlotId === slot.id) {
    const pill = A.el.pill;
    if (pill?.classList.contains("is-visible")) {
      pill.classList.remove("is-switching");
      void pill.offsetWidth;
      pill.classList.add("is-switching");
      setTimeout(() => pill.classList.remove("is-switching"), 150);
    }
    return;
  }

  const pill = A.el.pill;
  const isVisible = pill.classList.contains("is-visible");

  S.currentActiveSlotId = slot.id;

  // ✅ token: ultimul click câștigă
  const reqId = ++S.moreReqSeq;

  const startDotsLoading = () => {
    S.loadingMoreSlotId = slot.id;
    Employee.calendarGrid.startMoreSpinner();
    Employee.calendarGrid.render();
  };

  const stopDotsLoadingIfCurrent = () => {
    // oprește DOAR dacă acesta e încă request-ul curent
    if (S.moreReqSeq !== reqId) return;
    S.loadingMoreSlotId = null;
    Employee.calendarGrid.stopMoreSpinner();
    Employee.calendarGrid.render();
  };

  const doLoad = async () => {
    // (opțional) dacă vrei și spinner în pill, lasă:
    A.setPillLoading(true);
    startDotsLoading();

    try {
      await Employee.calendarData.ensureDetailsForSlot(slot);

      // dacă între timp user a dat click pe alt slot -> ignori rezultatul
      if (S.moreReqSeq !== reqId) return;

      A.updateActionBar(slot, true);
    } finally {
      // închizi loadere doar dacă e încă request-ul curent
      stopDotsLoadingIfCurrent();
      if (S.moreReqSeq === reqId) A.setPillLoading(false);

      if (isVisible && S.moreReqSeq === reqId) {
        requestAnimationFrame(() => pill.classList.remove("is-switching"));
      }
    }
  };

  if (isVisible) {
    pill.classList.add("is-switching");
    setTimeout(() => { doLoad(); }, 150);  // păstrează timing-ul tău
  } else {
    doLoad();
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

      // 2) update UI local + refresh pill doar pentru slotul ăsta
      if (idx !== -1) {
        const slot = S.confirmedSlots[idx];
        slot.status = status;

        // redraw ca să vezi status color imediat
        Employee.calendarGrid.render();

        // 🔥 refresh pill din backend (GET /details/) doar pentru slot
        await this.refreshPillForSlot(slot);
      }

      // 3) toast OK
      Employee.notify?.ok?.(res?.message || "Status updated.");

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
    let slot = null;

    if (idx !== -1) {
      slot = S.confirmedSlots[idx];
      slot.y = p.y;
      slot.startTime = p.startTime;
      slot.endTime = p.endTime;
      slot.fullDate = p.fullDate;
    }

    // ieșim din move mode + rerender
    this.cancelMoveMode();
    Employee.calendarGrid.render();

    // 🔥 dacă slot există, redeschidem pill-ul și îl refresh-uim din backend
    if (slot) {
      S.currentActiveSlotId = slot.id;      // setăm iar “slot activ”
      await this.refreshPillForSlot(slot);  // GET /details + update pill
    }

    Employee.notify?.ok?.(res?.message || "Appointment moved.");

    // ❌ scoate reload complet
    // Employee.calendarData.scheduleReload(1000);

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
