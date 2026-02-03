window.Employee = window.Employee || {};

Employee.clientForm = {
  mode: "add", // add | update

  get el() { return document.querySelector('[data-modal="client"]'); },

  openAdd() {
    this.mode = "add";
    this._fill(null);
    this._setTitle("Add New Client", "Add Client", "blue");
    Employee.modal.open("client");
  },

  openUpdate(client) {
    this.mode = "update";
    this._fill(client);
    this._setTitle("Update Client", "Update Client", "indigo");
    Employee.modal.open("client");
  },

  bind() {
    const form = document.querySelector("[data-client-form]");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = form.querySelector("[data-client-id]").value || null;
      const payload = {
        first_name: form.querySelector("[data-client-firstname]").value.trim(),
        last_name: form.querySelector("[data-client-lastname]").value.trim(),
        phone: form.querySelector("[data-client-phone]").value.trim(),
        email: form.querySelector("[data-client-email]").value.trim(),
      };

      try {
        const createUrl = form.dataset.createUrl;
        const updateUrlTpl = form.dataset.updateUrl;

        if (!createUrl || !updateUrlTpl) {
            throw new Error("Missing data-create-url or data-update-url on [data-client-form]");
        }

        let saved;

        if (this.mode === "add") {
        saved = await Employee.http.json(createUrl, {
            method: "POST",
            body: JSON.stringify(payload),
            });
        Employee.notify.ok("Client added");
        } else {
        if (!id) throw new Error("Missing client id for update");

        // updateUrlTpl arată ca "/.../0/"; îl transformăm în "/.../<id>/"
        const url = updateUrlTpl.replace("/0/", `/${id}/`);

        saved = await Employee.http.json(url, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        Employee.notify.ok("Client updated");
        }

        // select client after save
        Employee.store.setClient(saved);
        Employee.modal.close("client");
      } catch (err) {
        Employee.notify.err(err.message || "Save failed");
      }
    });
  },

  _fill(client) {
    const form = document.querySelector("[data-client-form]");
    if (!form) return;

    form.querySelector("[data-client-id]").value = client?.id || "";
    form.querySelector("[data-client-firstname]").value = client?.first_name || "";
    form.querySelector("[data-client-lastname]").value = client?.last_name || "";
    form.querySelector("[data-client-phone]").value = client?.phone || "";
    form.querySelector("[data-client-email]").value = client?.email || "";
  },

  _setTitle(title, buttonText, color) {
    const titleEl = document.querySelector("[data-client-modal-title]");
    const btn = document.querySelector("[data-client-submit]");

    if (titleEl) titleEl.textContent = title;
    if (btn) btn.textContent = buttonText;

    if (!btn) return;

    // reset
    btn.classList.remove("bg-indigo-600", "hover:bg-indigo-500", "bg-sky-600", "hover:bg-sky-700");

    if (color === "indigo") {
      btn.classList.add("bg-indigo-600", "hover:bg-indigo-500");
    } else {
      btn.classList.add("bg-blue-600", "hover:bg-blue-500");
    }
  }
};
