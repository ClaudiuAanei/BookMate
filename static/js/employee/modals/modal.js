window.Employee = window.Employee || {};

Employee.modal = {
  open(name) {
    const el = document.querySelector(`[data-modal="${name}"]`);
    if (!el) return;
    el.classList.remove("hidden");
  },
  close(name) {
    const el = document.querySelector(`[data-modal="${name}"]`);
    if (!el) return;
    el.classList.add("hidden");
  },
  bind() {
    Employee.dom.on(document, "click", "[data-modal-close]", () => {
      // close nearest modal
      const modal = document.querySelector("[data-modal]:not(.hidden)");
      if (modal) modal.classList.add("hidden");
    });

    Employee.dom.on(document, "click", "[data-modal-backdrop]", (e, backdrop) => {
      const modal = backdrop.closest("[data-modal]");
      if (modal) modal.classList.add("hidden");
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.querySelector("[data-modal]:not(.hidden)");
        if (modal) modal.classList.add("hidden");
      }
    });
  }
};
