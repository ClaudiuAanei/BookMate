window.Employee = window.Employee || {};

Employee.clientForm = {
  mode: "add", // add | update

  get el() { return document.querySelector('[data-modal="client"]'); },

  openAdd() {
    this.mode = "add";
    this._fill(null);
    this._setTitle("Add New Client", "Add Client", "blue");
    this._clearErrors();
    Employee.modal.open("client");
  },

  openUpdate(client) {
    this.mode = "update";
    this._fill(client);
    this._setTitle("Update Client", "Update Client", "indigo");
    this._clearErrors();
    Employee.modal.open("client");
  },

  bind() {
    const form = document.querySelector("[data-client-form]");
    if (!form) return;

    // Disable browser native popups (HTML5 validation tooltips)
    form.noValidate = true;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._clearErrors();

      const id = form.querySelector("[data-client-id]")?.value || null;

      const payload = {
        first_name: form.querySelector("[data-client-firstname]")?.value.trim() || "",
        last_name: form.querySelector("[data-client-lastname]")?.value.trim() || "",
        phone: form.querySelector("[data-client-phone]")?.value.trim() || "",
        email: form.querySelector("[data-client-email]")?.value.trim() || "",
      };

      const createUrl = form.dataset.createUrl;
      const updateUrlTpl = form.dataset.updateUrl;
      if (!createUrl || !updateUrlTpl) {
        Employee.notify.err("Missing data-create-url or data-update-url on [data-client-form]");
        return;
      }

      try {
        let data;

        if (this.mode === "add") {
          data = await Employee.http.json(createUrl, {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } else {
          if (!id) throw new Error("Missing client id for update");
          const url = updateUrlTpl.replace("/0/", `/${id}/`);
          data = await Employee.http.json(url, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
        }

        // Contract:
        // - {status:"errors", errors:{...}} => inline field errors only (NO toast)
        // - {status:"error", message:"..."} => toast error
        // - {status:"success", message:"...", client:{...}} OR client object => toast success + select client

        if (data?.status === "errors") {
          this._renderErrors(data.errors || {});
          return;
        }

        if (data?.status === "error") {
          Employee.notify.err(data.message || "An unexpected error occurred.");
          return;
        }

        if (data?.status === "success") {
          if (data.message) Employee.notify.ok(data.message);

          // prefer explicit client payload if provided; otherwise assume response IS the client
          const client = data.client || data.data || null;
          if (client) Employee.store.setClient(client);

          Employee.modal.close("client");
          return;
        }

        // Back-compat: if backend returns the saved client object directly
        if (data && typeof data === "object" && data.id != null) {
          Employee.store.setClient(data);
          Employee.notify.ok(this.mode === "add" ? "Saved." : "Updated.");
          Employee.modal.close("client");
          return;
        }

        // Unknown response shape
        Employee.notify.err("Unexpected server response.");
      } catch (err) {
        // If your backend sometimes returns 400 with {errors: ...}
        if (err.data?.errors) {
          this._renderErrors(err.data.errors);
          return;
        }

        // If your backend sometimes returns 400 with {status:"errors", errors:{...}}
        if (err.data?.status === "errors") {
          this._renderErrors(err.data.errors || {});
          return;
        }

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

    btn.classList.remove("bg-indigo-600", "hover:bg-indigo-500", "bg-sky-600", "hover:bg-sky-700", "bg-blue-600", "hover:bg-blue-500");

    if (color === "indigo") {
      btn.classList.add("bg-indigo-600", "hover:bg-indigo-500");
    } else {
      btn.classList.add("bg-blue-600", "hover:bg-blue-500");
    }
  },

  _clearErrors() {
    const form = document.querySelector("[data-client-form]");
    if (!form) return;

    form.querySelectorAll("[data-error]").forEach(p => {
      p.textContent = "";
      p.classList.add("hidden");
    });

    form.querySelectorAll("[data-field-invalid]").forEach(i => {
      i.classList.remove("border-red-500");
      i.removeAttribute("data-field-invalid");
    });
  },

  _renderErrors(errors) {
    const form = document.querySelector("[data-client-form]");
    if (!form) return;

    this._clearErrors();

    const fieldMap = {
      first_name: "first_name",
      last_name: "last_name",
      phone: "phone",
      email: "email",
    };

    const inputMap = {
      first_name: "[data-client-firstname]",
      last_name: "[data-client-lastname]",
      phone: "[data-client-phone]",
      email: "[data-client-email]",
    };

    for (const [field, items] of Object.entries(errors || {})) {
      const message = items?.[0]?.message || "Invalid value";

      const inputSel = inputMap[field];
      const input = inputSel ? form.querySelector(inputSel) : null;
      if (input) {
        input.classList.add("border-red-500");
        input.setAttribute("data-field-invalid", "1");
      }

      const wrap = form.querySelector(`[data-field="${fieldMap[field] || field}"]`);
      const p = wrap?.querySelector("[data-error]");
      if (p) {
        p.textContent = message;
        p.classList.remove("hidden");
      }
    }

    form.querySelector("[data-field-invalid]")?.focus();
  }
};
