window.Employee = window.Employee || {};

const STORAGE_KEY = "employee:selectedClient"; // păstrează un obiect mic

Employee.store = {
  selectedClient: null, // {id, first_name, last_name, phone, email}

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.selectedClient = raw ? JSON.parse(raw) : null;
    } catch {
      this.selectedClient = null;
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  persist() {
    if (this.selectedClient && this.selectedClient.id != null) {
      // salvează DOAR câmpuri utile (evită să îngropi junk în storage)
      const c = this.selectedClient;
      const minimal = {
        id: c.id,
        first_name: c.first_name || "",
        last_name: c.last_name || "",
        phone: c.phone || "",
        email: c.email || "",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

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

  // pentru backend: folosești mereu asta
  get selectedClientId() {
    return this.selectedClient?.id ?? null;
  }
};
