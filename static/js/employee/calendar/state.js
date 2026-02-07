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
  proposedMoveSlot: null,

  clearSelection() {
    this.bookedSlot = null;
    this.overtimeAgreed = false;
    this.currentActiveSlotId = null;
  }
};
