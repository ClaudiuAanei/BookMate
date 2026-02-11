window.Employee = window.Employee || {};

Employee.servicesCatalog = {
  _byId: new Map(),

  refreshFromDom() {
    this._byId.clear();
    const inputs = Array.from(document.querySelectorAll('input[name="service_type"][data-service-id]'));
    for (const i of inputs) {
      const id = Number(i.dataset.serviceId || i.value);
      if (!Number.isFinite(id)) continue;

      this._byId.set(id, {
        id,
        name: i.dataset.serviceName || "",
        price: Number(i.dataset.servicePrice || 0),
        duration: Number(i.dataset.serviceDuration || 0),
      });
    }
  },

  listAll() {
    return Array.from(this._byId.values()).sort((a,b) => a.name.localeCompare(b.name));
  },

  get(id) { return this._byId.get(Number(id)) || null; },

  computeTotals(ids) {
    const list = (ids || []).map(x => this.get(x)).filter(Boolean);
    const duration = list.reduce((a,s) => a + (Number(s.duration)||0), 0);
    const total = list.reduce((a,s) => a + (Number(s.price)||0), 0);
    const names = list.map(s => s.name).filter(Boolean);
    return { list, duration, total, names };
  }
};
