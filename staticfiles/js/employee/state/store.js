window.Employee = window.Employee || {};

const STORAGE = {
  selectedClient: "employee:selectedClient",
  confirmedServices: "employee:confirmedServices",
};

Employee.store = {
  selectedClient: null,
  confirmedServices: [],

  load() {
    // ---- client
    try {
      const raw = localStorage.getItem(STORAGE.selectedClient);
      this.selectedClient = raw ? JSON.parse(raw) : null;
    } catch {
      this.selectedClient = null;
      localStorage.removeItem(STORAGE.selectedClient);
    }

    // ---- confirmed services
    try {
      const rawS = localStorage.getItem(STORAGE.confirmedServices);
      this.confirmedServices = rawS ? JSON.parse(rawS) : [];
      if (!Array.isArray(this.confirmedServices)) {
        this.confirmedServices = [];
      }
    } catch {
      this.confirmedServices = [];
      localStorage.removeItem(STORAGE.confirmedServices);
    }
  },

  persist() {
    // client
    if (this.selectedClient && this.selectedClient.id != null) {
      const c = this.selectedClient;
      localStorage.setItem(STORAGE.selectedClient, JSON.stringify({
        id: c.id,
        first_name: c.first_name || "",
        last_name: c.last_name || "",
        phone: c.phone || "",
        email: c.email || "",
      }));
    } else {
      localStorage.removeItem(STORAGE.selectedClient);
    }

    // confirmed services
    if (this.confirmedServices.length) {
      localStorage.setItem(
        STORAGE.confirmedServices,
        JSON.stringify(this.confirmedServices)
      );
    } else {
      localStorage.removeItem(STORAGE.confirmedServices);
    }
  },

  // -------- client
  setClient(client) {
    this.selectedClient = client || null;
    this.persist();
    document.dispatchEvent(
      new CustomEvent("employee:client-selected", { detail: this.selectedClient })
    );
  },

  clearClient() {
    this.setClient(null);
  },

  get selectedClientId() {
    return this.selectedClient?.id ?? null;
  },

  // -------- services (CONFIRMED)
  setConfirmedServices(ids) {
    this.confirmedServices = Array.isArray(ids) ? ids : [];
    this.persist();
    document.dispatchEvent(
      new CustomEvent("employee:services-confirmed", {
        detail: this.confirmedServices
      })
    );
  },

  clearConfirmedServices() {
    this.setConfirmedServices([]);
  },

  get confirmedServiceIds() {
    return this.confirmedServices || [];
  }
};
