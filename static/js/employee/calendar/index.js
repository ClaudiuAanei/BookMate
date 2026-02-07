window.Employee = window.Employee || {};

Employee.calendar = {
  init() {
    const root = document.querySelector("[data-employee-calendar]");
    if (!root) return;

    const canvas = root.querySelector("[data-cal-canvas]");
    const rangeEl = root.querySelector("[data-cal-range]");
    if (!canvas) return;

    // dates
    const d = new Date(); d.setHours(0,0,0,0);
    Employee.calendarState.startDate = new Date(d);
    Employee.calendarState.selectedDate = new Date(d);

    // catalog
    Employee.servicesCatalog.refreshFromDom();

    // init
    Employee.calendarGrid.init({ canvas, rangeEl });
    Employee.calendarSelection.init({ canvas });
    Employee.calendarActions.bind(root);

    // GLOBAL CLICK OUTSIDE -> clear booking selection
// GLOBAL CLICK OUTSIDE -> close pill (booking + management)
document.addEventListener("click", (e) => {
  const S = Employee.calendarState;
  const el = Employee.calendarActions.el;

  const pillVisible = el.pill?.classList.contains("is-visible");
  const hasBooking = !!S.bookedSlot;
  const hasActiveMng = !!S.currentActiveSlotId;

  // nimic de închis
  if (!pillVisible && !hasBooking && !hasActiveMng) return;

  // click în pill -> nu închidem
  if (e.target.closest("[data-cal-pill]")) return;

  // click pe canvas -> nu închidem (selection.js / more click le gestionează)
  if (e.target.closest("[data-cal-canvas]")) return;

  // click într-un modal (overlay sau card) -> nu închidem
  if (
    el.clientModal?.contains(e.target) ||
    el.editModal?.contains(e.target) ||
    el.moveModal?.contains(e.target)
  ) return;

  // altfel -> închidem TOT (booking + management)
  S.currentActiveSlotId = null;
  S.clearSelection(); // asta îți curăță bookedSlot etc.
  Employee.calendarActions.hidePill();
  Employee.calendarGrid.render();
});



    // mock seed
    Employee.calendarData.seedMock();

    // initial render
    Employee.calendarActions.syncTopBar();
    Employee.calendarGrid.render();

    // react to navbar events (store emits these)
    document.addEventListener("employee:client-selected", () => {
      Employee.calendarActions.syncTopBar();
    });

    document.addEventListener("employee:services-confirmed", () => {
      Employee.servicesCatalog.refreshFromDom();
      Employee.calendarActions.syncTopBar();
    });

    // keyboard UX
    window.addEventListener("keydown", (e) => {
      const S = Employee.calendarState;

      if (e.key !== "Escape") return;

      // close modals first
      const el = Employee.calendarActions.el;
      if (el.editModal?.classList.contains("is-open")) { Employee.calendarActions.closeEditModal(); return; }
      if (el.clientModal?.classList.contains("is-open")) { Employee.calendarActions.closeClientModal(); return; }
      if (el.moveModal?.classList.contains("is-open")) { Employee.calendarActions.closeMoveModal(); return; }

      // cancel move mode
      if (S.isMovingMode) { Employee.calendarMoreMenu.cancelMoveMode(); return; }

      // else clear selection
      S.clearSelection();
      Employee.calendarActions.hidePill();
      Employee.calendarGrid.render();
    });

    // move modal “Cancel” should also cancel move mode
    Employee.calendarActions.el.moveCancel?.addEventListener("click", () => {
      if (Employee.calendarState.isMovingMode) Employee.calendarMoreMenu.cancelMoveMode();
    });
    Employee.calendarActions.el.moveClose?.addEventListener("click", () => {
      if (Employee.calendarState.isMovingMode) Employee.calendarMoreMenu.cancelMoveMode();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Employee.calendar.init();
});
