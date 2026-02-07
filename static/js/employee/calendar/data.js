window.Employee = window.Employee || {};

Employee.calendarData = {
  endpoints: {
    // list: "/employee/api/calendar/slots",
    // create: "/employee/api/calendar/slots/create",
    // update: "/employee/api/calendar/slots/{id}",
  },

  seedMock() {
    const S = Employee.calendarState;
    const calcY = Employee.calendarCompute.calculateYFromTime.bind(Employee.calendarCompute);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0,0,0,0);

    S.confirmedSlots = [
      {
        id: 1,
        y: calcY("09:00"),
        duration: 60,
        startTime: "09:00",
        endTime: "10:00",
        clientName: "John Doe",
        email: "john.doe@email.com",
        phone: "+40 722 123 456",
        fullDate: tomorrow.getTime(),
        status: "confirmed",
        serviceIds: [],
        services: "Haircut",
        price: 45
      },
      {
        id: 2,
        y: calcY("10:00"),
        duration: 30,
        startTime: "10:00",
        endTime: "10:30",
        clientName: "New Client",
        email: "client@example.com",
        phone: "+40 744 987 654",
        fullDate: tomorrow.getTime(),
        status: "completed",
        serviceIds: [],
        services: "Beard Trim",
        price: 25
      }
    ];
  },

  // ready for fetch later
  async fetchSlots(/* rangeStart, rangeEnd */) { return []; },
  async createSlot(/* payload */) { return null; },
  async updateSlot(/* id, payload */) { return null; }
};
