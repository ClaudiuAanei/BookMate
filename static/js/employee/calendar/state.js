window.Employee = window.Employee || {};

Employee.calendarState = {
  startDate: null,
  selectedDate: null,

  // derived from navbar (store + DOM catalog)
  durationMin: 0,
  totalPrice: 0,
  serviceNames: [],

  // booking selection
  bookedSlot: null,
  overtimeAgreed: false,

  // confirmed data (mock now, API later)
  confirmedSlots: [],

  // management state
  currentActiveSlotId: null,

  // move mode
  isMovingMode: false,
  slotToMoveId: null,
  slotToMoveSnapshot: null,
  proposedMoveSlot: null,

  // blocked days (public holidays + full-day holidays)
  blockedDays: new Set(), // Set<"YYYY-MM-DD">

  // partial holidays: Map<"YYYY-MM-DD", Array<{start:"HH:MM", end:"HH:MM"}>>
  partialBlocked: new Map(),

  // labels for blocked days: Map<"YYYY-MM-DD", string>
  blockedDayLabels: new Map(),


  clearSelection() {
    this.bookedSlot = null;
    this.overtimeAgreed = false;
    this.currentActiveSlotId = null;
  }
};
