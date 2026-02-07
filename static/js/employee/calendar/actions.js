window.Employee = window.Employee || {};

Employee.calendarActions = {
  el: {},

  bind(root) {
    const el = this.el;

    // top controls

    el.btnPrev = root.querySelector("[data-cal-prev]");
    el.btnNext = root.querySelector("[data-cal-next]");
    el.btnToday = root.querySelector("[data-cal-today]");
    el.inDate = root.querySelector("[data-cal-date]");
    el.range = root.querySelector("[data-cal-range]");
    el.btnQuickNav = root.querySelector("[data-cal-quick-nav-btn]");


    // pill
    el.pill = root.querySelector("[data-cal-pill]");
    el.otIcon = root.querySelector("[data-cal-ot-icon]");
    el.pillTitle = root.querySelector("[data-cal-pill-title]");
    el.titleNormal = root.querySelector("[data-cal-title-normal]");
    el.titleOvertime = root.querySelector("[data-cal-title-overtime]");
    el.pillClient = root.querySelector("[data-cal-pill-client-name]");
    el.pillTime = root.querySelector("[data-cal-pill-time]");
    el.pillDate = root.querySelector("[data-cal-pill-date]");
    el.pillServices = root.querySelector("[data-cal-pill-services]");

    el.grpNormal = root.querySelector("[data-cal-actions-normal]");
    el.grpOT = root.querySelector("[data-cal-actions-overtime]");
    el.grpMng = root.querySelector("[data-cal-actions-mng]");

    el.btnClear = root.querySelector("[data-cal-clear]");
    el.btnBook = root.querySelector("[data-cal-book]");
    el.btnOtCancel = root.querySelector("[data-cal-ot-cancel]");
    el.btnOtAgree = root.querySelector("[data-cal-ot-agree]");
    el.btnMngClose = root.querySelector("[data-cal-mng-close]");

    // management buttons
    el.btnMngInfo = root.querySelector("[data-cal-mng-info]");
    el.btnMngConfirm = root.querySelector("[data-cal-mng-confirm]");
    el.btnMngComplete = root.querySelector("[data-cal-mng-complete]");
    el.btnMngNoShow = root.querySelector("[data-cal-mng-noshow]");
    el.btnMngDecline = root.querySelector("[data-cal-mng-decline]");
    el.btnMngMove = root.querySelector("[data-cal-mng-move]");
    el.btnMngEdit = root.querySelector("[data-cal-mng-edit]");

    // modals
    el.clientModal = root.querySelector("[data-cal-client-modal]");
    el.clientModalClose = Array.from(root.querySelectorAll("[data-cal-client-modal-close]"));
    el.detailName = root.querySelector("[data-cal-detail-name]");
    el.detailStatus = root.querySelector("[data-cal-detail-status]");
    el.detailPhone = root.querySelector("[data-cal-detail-phone]");
    el.detailEmail = root.querySelector("[data-cal-detail-email]");
    el.detailDatetime = root.querySelector("[data-cal-detail-datetime]");
    el.detailServices = root.querySelector("[data-cal-detail-services]");
    el.detailPrice = root.querySelector("[data-cal-detail-price]");

    el.editModal = root.querySelector("[data-cal-edit-modal]");
    el.editCard = root.querySelector("[data-cal-edit-card]");
    el.editClose = root.querySelector("[data-cal-edit-close]");
    el.editList = root.querySelector("[data-cal-edit-services-list]");
    el.editSave = root.querySelector("[data-cal-edit-save]");

    el.moveModal = root.querySelector("[data-cal-move-modal]");
    el.moveCard = root.querySelector("[data-cal-move-card]");
    el.moveClose = root.querySelector("[data-cal-move-close]");
    el.moveFrom = root.querySelector("[data-cal-move-from]");
    el.moveTo = root.querySelector("[data-cal-move-to]");
    el.moveDate = root.querySelector("[data-cal-move-date]");
    el.moveCancel = root.querySelector("[data-cal-move-cancel]");
    el.moveConfirm = root.querySelector("[data-cal-move-confirm]");

    // top nav handlers
    this._bindTopControls();
    this._bindPill();
    this._bindModals();

    // initial sync
    this.syncTopBar();
  },

  _bindTopControls() {
    const S = Employee.calendarState;
    const C = Employee.calendarConfig;

    this.el.btnPrev?.addEventListener("click", () => {
      S.startDate.setDate(S.startDate.getDate() - C.COLUMNS);
      S.selectedDate = new Date(S.startDate);
      Employee.calendarGrid.render();
    });

    this.el.btnNext?.addEventListener("click", () => {
      S.startDate.setDate(S.startDate.getDate() + C.COLUMNS);
      S.selectedDate = new Date(S.startDate);
      Employee.calendarGrid.render();
    });

    this.el.btnToday?.addEventListener("click", () => {
      const d = new Date(); d.setHours(0,0,0,0);
      S.startDate = d;
      S.selectedDate = new Date(d);
      Employee.calendarGrid.render();
    });

    this.el.inDate?.addEventListener("change", (e) => {
      if (!e.target.value) return;
      const d = new Date(e.target.value);
      d.setHours(0,0,0,0);
      S.startDate = new Date(d);
      S.selectedDate = new Date(d);
      Employee.calendarGrid.render();
    });
this.el.btnQuickNav?.addEventListener("click", (e) => {
  e.preventDefault();
  const input = this.el.inDate;
  if (!input) return;

  // Chrome/Edge moderne
  if (typeof input.showPicker === "function") input.showPicker();
  else { input.focus(); input.click(); }
});

  },

  _bindPill() {
    const S = Employee.calendarState;

    this.el.btnClear?.addEventListener("click", () => {
      S.clearSelection();
      this.hidePill();
      Employee.calendarGrid.render();
    });

    this.el.btnOtCancel?.addEventListener("click", () => {
      S.clearSelection();
      this.hidePill();
      Employee.calendarGrid.render();
    });

    this.el.btnOtAgree?.addEventListener("click", () => {
      S.overtimeAgreed = true;
      if (S.bookedSlot) this.updateActionBar(S.bookedSlot, false);
      Employee.calendarGrid.render();
    });

    this.el.btnBook?.addEventListener("click", () => this.bookNow());

    this.el.btnMngClose?.addEventListener("click", () => {
      S.currentActiveSlotId = null;
      this.hidePill();
      Employee.calendarGrid.render();
    });

    // management actions
    this.el.btnMngConfirm?.addEventListener("click", () => Employee.calendarMoreMenu.updateSlotStatus("confirmed"));
    this.el.btnMngComplete?.addEventListener("click", () => Employee.calendarMoreMenu.updateSlotStatus("completed"));
    this.el.btnMngNoShow?.addEventListener("click", () => Employee.calendarMoreMenu.updateSlotStatus("noshow"));
    this.el.btnMngDecline?.addEventListener("click", () => Employee.calendarMoreMenu.updateSlotStatus("declined"));

    this.el.btnMngMove?.addEventListener("click", () => Employee.calendarMoreMenu.startMoveMode());
    this.el.btnMngEdit?.addEventListener("click", () => this.openEditServices());
    this.el.btnMngInfo?.addEventListener("click", () => this.openClientDetails());

    // click client name in pill opens details too
    this.el.pillClient?.addEventListener("click", () => this.openClientDetails());
  },

  _bindModals() {
    const el = this.el;

    // overlay click closes (except inner card)
    el.clientModal?.addEventListener("click", (e) => { if (e.target === el.clientModal) this.closeClientModal(); });
    el.clientModalClose?.forEach((btn) => btn.addEventListener("click", () => this.closeClientModal()));

    el.editModal?.addEventListener("click", (e) => { if (e.target === el.editModal) this.closeEditModal(); });
    el.editClose?.addEventListener("click", () => this.closeEditModal());
    el.editCard?.addEventListener("click", (e) => e.stopPropagation());

    el.moveModal?.addEventListener("click", (e) => { if (e.target === el.moveModal) this.closeMoveModal(); });
    el.moveClose?.addEventListener("click", () => this.closeMoveModal());
    el.moveCard?.addEventListener("click", (e) => e.stopPropagation());

    el.moveCancel?.addEventListener("click", () => this.closeMoveModal());
    el.moveConfirm?.addEventListener("click", () => Employee.calendarMoreMenu.confirmMove());

    el.editSave?.addEventListener("click", () => this.saveEditServices());
  },

  hidePill() {
    this.el.pill?.classList.remove("is-visible", "is-overtime", "is-switching");
  },

  _showPill() {
    this.el.pill?.classList.add("is-visible");
  },

  syncTopBar() {
    const store = Employee.store;

    // păstrează refresh-ul + totals pentru state (booking depinde de ele)
    Employee.servicesCatalog.refreshFromDom();
    const ids = store?.confirmedServiceIds || [];
    const totals = Employee.servicesCatalog.computeTotals(ids);

    const S = Employee.calendarState;
    S.durationMin = totals.duration;
    S.totalPrice = totals.total;
    S.serviceNames = totals.names;

    // IMPORTANT: am scos orice update în header (data-cal-client/services/duration/total)
  },


  updateActionBar(slot, isManagement) {
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;

    // reset groups
    this.el.pill.classList.remove("is-overtime");
    this.el.otIcon.classList.add("hidden");
    this.el.grpNormal.classList.add("hidden");
    this.el.grpOT.classList.add("hidden");
    this.el.grpMng.classList.add("hidden");

    this.el.pillTitle.classList.remove("hidden");
    this.el.pillClient.classList.add("hidden");
    this.el.pillServices.classList.add("hidden");
    this.el.pillDate.classList.remove("hidden");
    const normalTitle = this.el.pill.querySelector("[data-cal-title-normal]");
    const overtimeTitle = this.el.pill.querySelector("[data-cal-title-overtime]");

    normalTitle.classList.remove("hidden");
    overtimeTitle.classList.add("hidden");
    // compute date label
    // compute date label (UNIFIED): Monday, 9 Feb
    const day = new Date(slot.fullDate);
    const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(day);
    const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(day);
    const dateLabel = `${weekday}, ${day.getDate()} ${month}`;


    this.el.pillTime.textContent = `${slot.startTime} - ${slot.endTime}`;
    this.el.pillDate.textContent = dateLabel;

    if (isManagement) {
      // management UI
      this.el.grpMng.classList.remove("hidden");

      this.el.pillTitle.classList.add("hidden");
      this.el.pillClient.classList.remove("hidden");
      this.el.pillClient.textContent = U.safeText(slot.clientName, "Client");
      this.el.pillServices.classList.remove("hidden");
      this.el.pillServices.textContent = U.safeText(slot.services, "No services listed");

      this._showPill();
      return;
    }

    // booking UI (normal / overtime)
if (slot.isOvertime && !S.overtimeAgreed) {
  this.el.pill.classList.add("is-overtime");
  this.el.otIcon.classList.remove("hidden");     // (poți păstra) — fără CSS tweak, asta e necesar
  this.el.grpOT.classList.remove("hidden");

  this.el.titleNormal?.classList.add("hidden");
  this.el.titleOvertime?.classList.remove("hidden");
} else {
  this.el.grpNormal.classList.remove("hidden");
}


    this._showPill();
  },

  bookNow() {
    const S = Employee.calendarState;
    const store = Employee.store;

    if (!S.bookedSlot) return;

    const client = store?.selectedClient;
    const ids = store?.confirmedServiceIds || [];

    if (!client?.id || !ids.length) {
      Employee.notify?.err?.("Select client + services first.");
      return;
    }

    if (S.bookedSlot.isOvertime && !S.overtimeAgreed) {
      // force overtime flow
      this.updateActionBar(S.bookedSlot, false);
      return;
    }

    const totals = Employee.servicesCatalog.computeTotals(ids);

    // payload ready for API
    const payload = {
      client_id: client.id,
      service_ids: ids,
      start_at_date: S.bookedSlot.fullDate,
      start_time: S.bookedSlot.startTime,
      end_time: S.bookedSlot.endTime,
      duration_min: S.bookedSlot.duration,
      overtime: !!S.bookedSlot.isOvertime
    };

    // TODO later: await Employee.calendarData.createSlot(payload)
    // Mock add now:
    S.confirmedSlots.push({
      id: Date.now(),
      y: S.bookedSlot.y,
      duration: S.bookedSlot.duration,
      startTime: S.bookedSlot.startTime,
      endTime: S.bookedSlot.endTime,
      fullDate: S.bookedSlot.fullDate,
      status: "pending",
      clientName: `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Client",
      email: client.email || "",
      phone: client.phone || "",
      serviceIds: ids.slice(),
      services: totals.names.join(", "),
      price: totals.total
    });

    Employee.notify?.ok?.("Booked (mock). Ready for API later.");
    S.clearSelection();
    this.hidePill();
    Employee.calendarGrid.render();

    // Debug:
    // console.log("BOOK PAYLOAD (ready for fetch):", payload);
  },

  openClientDetails() {
    const S = Employee.calendarState;
    const U = Employee.calendarUtils;

    const slot = S.confirmedSlots.find(s => s.id === S.currentActiveSlotId);
    if (!slot) return;

    const day = new Date(slot.fullDate);

    this.el.detailName.textContent = U.safeText(slot.clientName, "Client");
    this.el.detailPhone.textContent = U.safeText(slot.phone, "No phone");
    this.el.detailEmail.textContent = U.safeText(slot.email, "No email");
    this.el.detailDatetime.textContent = `${U.dayName(day)}, ${day.getDate()} ${U.monthName(day)} at ${slot.startTime}`;
    this.el.detailServices.textContent = U.safeText(slot.services, "—");
    this.el.detailPrice.textContent = `${Number(slot.price || 0).toFixed(2)} EUR`;

    // status badge style
    const status = String(slot.status || "pending").toLowerCase();
    this.el.detailStatus.textContent = status;

    // basic styling map
    const cls = this.el.detailStatus.classList;
    cls.remove("is-pending","is-confirmed","is-completed","is-noshow","is-declined");
    cls.add(`is-${status}`);

    // open
    this.el.clientModal.classList.add("is-open");
  },

  closeClientModal() {
    this.el.clientModal?.classList.remove("is-open");
  },
  openEditServices() {
  const S = Employee.calendarState;
  const slot = S.confirmedSlots.find(s => s.id === S.currentActiveSlotId);
  if (!slot) return;

  if (!this.el.editModal || !this.el.editList) return;

  // refresh catalog (DOM -> catalog)
  Employee.servicesCatalog.refreshFromDom();
  const all = Employee.servicesCatalog.listAll();

  // initial selection
  const selected = new Set((slot.serviceIds || []).map(Number).filter(Number.isFinite));

  // Fallback (optional): if slot.serviceIds is empty but slot.services has names
  // Try to match by name (case-insensitive, trimmed)
  if (!selected.size && slot.services) {
    const wantedNames = String(slot.services)
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    if (wantedNames.length) {
      all.forEach(svc => {
        const n = String(svc.name || "").trim().toLowerCase();
        if (n && wantedNames.includes(n)) selected.add(Number(svc.id));
      });
    }
  }

  // --- Render (NO Tailwind state classes; only our semantic state class) ---
  this.el.editList.innerHTML = all.map(svc => {
    const id = Number(svc.id);
    const isChecked = selected.has(id);

    return `
      <div
        class="svc-item service-item group relative grid grid-cols-[1fr_auto] items-center gap-4 cursor-pointer rounded-xl p-4 transition-all ${isChecked ? "is-selected" : ""}"
        data-edit-svc
        data-svc-id="${id}"
        data-selected="${isChecked}"
      >
        <div class="block">
          <h4 class="svc-title text-sm" data-el="title">${svc.name || "Service"}</h4>
          <p class="svc-meta text-xs" data-el="meta">
            ${Number(svc.duration || 0)} min • ${Number(svc.price || 0).toFixed(2)} EUR
          </p>
        </div>

        <div class="svc-checkbox" data-el="checkbox" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="3"
               stroke="currentColor"
               class="svc-checkmark"
               data-el="checkmark">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>
    `;
  }).join("");

  // --- Toggle on click (single class + data-selected for save) ---
  this.el.editList.querySelectorAll("[data-edit-svc]").forEach(row => {
    row.addEventListener("click", () => {
      const isSelected = row.getAttribute("data-selected") === "true";
      const newState = !isSelected;

      row.setAttribute("data-selected", String(newState));
      row.classList.toggle("is-selected", newState);
    });
  });

  // open modal
  this.el.editModal.classList.add("is-open");
},

  closeEditModal() {
    this.el.editModal?.classList.remove("is-open");
  },

saveEditServices() {
    const S = Employee.calendarState;
    const slot = S.confirmedSlots.find(s => s.id === S.currentActiveSlotId);
    if (!slot) return;

    // Selector actualizat pentru noua logică
    const selectedIds = Array.from(this.el.editList.querySelectorAll('[data-edit-svc][data-selected="true"]'))
        .map(el => Number(el.getAttribute("data-svc-id")))
        .filter(Number.isFinite);

    const totals = Employee.servicesCatalog.computeTotals(selectedIds);

    slot.serviceIds = selectedIds;
    slot.services = totals.names.join(", ");
    slot.price = totals.total;

    // NOTE: duration change implies slot duration/time/y should change,
    // but for safety you can keep duration as-is or enforce:
    // slot.duration = totals.duration; (then recompute endTime)
    // I keep duration unchanged by default to avoid overlapping logic.
    // If you want strict behavior, tell me and I’ll enforce recalculation + collision handling.

    this.closeEditModal();
    this.updateActionBar(slot, true);
    Employee.calendarGrid.render();
    Employee.notify?.ok?.("Services updated (local).");
},

  openMoveModal({ from, to, date }) {
    this.el.moveFrom.textContent = from || "--";
    this.el.moveTo.textContent = to || "--";
    this.el.moveDate.textContent = date || "--";
    this.el.moveModal.classList.add("is-open");
  },

  closeMoveModal() {
    this.el.moveModal?.classList.remove("is-open");
  }
};

// optional: status badge CSS classes (minimal)
(() => {
  const style = document.createElement("style");
  style.textContent = `
    .cal-statusBadge.is-pending { color:#fbbf24; border-color: rgba(245,158,11,0.25); }
    .cal-statusBadge.is-confirmed { color:#34d399; border-color: rgba(16,185,129,0.25); }
    .cal-statusBadge.is-completed { color:#60a5fa; border-color: rgba(59,130,246,0.25); }
    .cal-statusBadge.is-noshow { color:#f87171; border-color: rgba(239,68,68,0.25); }
    .cal-statusBadge.is-declined { color:#a1a1aa; border-color: rgba(82,82,91,0.25); }
  `;
  document.head.appendChild(style);
})();
