window.Employee = window.Employee || {};

// utilitar global în fișier (nu în obiect)
function formatMinutes(totalMinutes) {
  const minutes = Number(totalMinutes) || 0;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `0 h ${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

Employee.serviceDropdown = {
  bind() {
    const root = document.querySelector("[data-services-dropdown]");
    if (!root) return;

    const btn = root.querySelector("[data-services-btn]");
    const menu = root.querySelector("[data-services-menu]");

    const badge = root.querySelector("[data-services-badge]");
    const label = root.querySelector("[data-services-label]");
    const meta = root.querySelector("[data-services-meta]");
    const clearBtn = root.querySelector("[data-services-clear]");
    const confirmBtn = root.querySelector("[data-services-confirm]");
    const inputs = Array.from(root.querySelectorAll('input[name="service_type"]'));

    if (!btn || !menu) return;

    // ✅ format duratele din listă (30 -> 0 h 30 min etc)
    root.querySelectorAll("[data-service-duration-text]").forEach(el => {
      const raw = el.textContent.trim();
      el.textContent = formatMinutes(raw);
    });

    // ✅ format prices in list (25 -> 25.00 EUR)
    root.querySelectorAll("[data-service-price-text]").forEach(el => {
      const raw = Number(el.textContent.trim());
      const value = Number.isFinite(raw) ? raw.toFixed(2) : "0.00";
      el.textContent = `${value} EUR`;
    });

    // ---- hover UX timings
    const OPEN_DELAY = 80;
    const CLOSE_DELAY = 220;

    let openTimer = null;
    let closeTimer = null;

    const show = () => {
      if (root.classList.contains("force-close")) return;
      menu.classList.remove("invisible", "opacity-0", "scale-95");
      menu.classList.add("visible", "opacity-100", "scale-100");
      btn?.setAttribute("aria-expanded", "true");
    };

    const hide = () => {
      menu.classList.add("invisible", "opacity-0", "scale-95");
      menu.classList.remove("visible", "opacity-100", "scale-100");
      btn?.setAttribute("aria-expanded", "false");
    };

    const scheduleOpen = () => {
      clearTimeout(closeTimer);
      clearTimeout(openTimer);
      openTimer = setTimeout(show, OPEN_DELAY);
    };

    const scheduleClose = () => {
      if (root.classList.contains("keep-open")) return;
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(hide, CLOSE_DELAY);
    };

    root.addEventListener("mouseenter", scheduleOpen);
    root.addEventListener("mouseleave", scheduleClose);

    menu.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
      show();
    });

    // ---- hydrate from store (CONFIRMED)
    const confirmed = (Employee.store?.confirmedServiceIds || []).map(Number);
    let draft = new Set(confirmed);
    
    // 🔁 keep UI in sync if store changes from outside (ex: after booking)
document.addEventListener("employee:services-confirmed", (e) => {
  const ids = (e.detail || []).map(Number);

  // update internal state
  confirmed.length = 0;
  confirmed.push(...ids);
  draft = new Set(ids);

  // update checkboxes
  inputs.forEach(i => { i.checked = draft.has(Number(i.value)); });

  // reset UX state and close menu
  root.classList.remove("keep-open");
  root.classList.remove("force-close");
  hide();

  // refresh label/badge/meta
  this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });
});


    inputs.forEach(i => {
      i.checked = draft.has(Number(i.value));
    });

    this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });

    // după refresh: selecția e confirmată => NU keep-open
    root.classList.remove("keep-open");
    root.classList.remove("force-close");
    hide();

    const sorted = (arr) => arr.slice().map(Number).sort((a, b) => a - b);

    function isDirty() {
      const a = sorted(Array.from(draft));
      const b = sorted(confirmed);
      if (a.length !== b.length) return true;
      return a.some((v, idx) => v !== b[idx]);
    }

    // ✅ UX: când ajungi la 0 servicii, asta este RESET => commit instant + close (fără confirm)
    const commitEmptyAndClose = () => {
      // commit empty
      Employee.store?.setConfirmedServices?.([]);
      confirmed.length = 0;
      draft.clear();

      // UX state
      root.classList.remove("keep-open");
      root.classList.add("force-close");
      hide();

      // allow normal open again after mouseleave
      const removeForceClose = () => {
        root.classList.remove("force-close");
        root.removeEventListener("mouseleave", removeForceClose);
      };
      root.addEventListener("mouseleave", removeForceClose);
    };

    // ---- changes (draft)
    inputs.forEach(i => {
      i.addEventListener("change", () => {
        const id = Number(i.value);
        if (i.checked) draft.add(id);
        else draft.delete(id);

        // ✅ dacă draft ajunge la 0 => reset instant (fără confirm)
        if (draft.size === 0) {
          inputs.forEach(x => (x.checked = false));
          this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });
          commitEmptyAndClose();
          return;
        }

        // normal flow: dirty => keep-open, clean => release
        if (isDirty()) root.classList.add("keep-open");
        else root.classList.remove("keep-open");

        root.classList.remove("force-close");
        this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });

        if (isDirty()) show();
      });
    });

    // ✅ clear = RESET => commit direct + close (fără confirm)
    clearBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      draft.clear();
      inputs.forEach(i => (i.checked = false));

      this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });
      commitEmptyAndClose();
    });

    // confirm (commit draft -> confirmed)
    confirmBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const ids = Array.from(draft);

      // dacă vrei să permiți confirm pe 0, șterge blocul ăsta
      if (!ids.length) {
        Employee.notify?.err?.("Select at least one service.");
        return;
      }

      const original = confirmBtn.innerHTML;

      Employee.store?.setConfirmedServices?.(ids);
      confirmed.length = 0;
      confirmed.push(...ids);

      confirmBtn.textContent = "Confirmed!";
      confirmBtn.classList.remove("bg-blue-600", "hover:bg-blue-500");
      confirmBtn.classList.add("bg-emerald-600");

      root.classList.remove("keep-open");
      root.classList.add("force-close");
      hide();

      setTimeout(() => {
        confirmBtn.innerHTML = original;
        confirmBtn.classList.remove("bg-emerald-600");
        confirmBtn.classList.add("bg-blue-600", "hover:bg-blue-500");
      }, 350);

      const removeForceClose = () => {
        root.classList.remove("force-close");
        root.removeEventListener("mouseleave", removeForceClose);
      };
      root.addEventListener("mouseleave", removeForceClose);

      // refresh UI after confirm (optional, but keeps everything consistent)
      this._refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs });
    });
  },

  _refreshUI({ badge, label, meta, clearBtn, confirmBtn, root, inputs }) {
    const checked = inputs.filter(i => i.checked);
    const count = checked.length;

    // disable confirm when empty (UX polish)
    if (confirmBtn) {
      if (count === 0) confirmBtn.classList.add("opacity-50", "pointer-events-none");
      else confirmBtn.classList.remove("opacity-50", "pointer-events-none");
    }

    if (count > 0) {
      badge.textContent = String(count);
      badge.classList.remove("opacity-0", "scale-0");
      badge.classList.add("opacity-100", "scale-100");

      clearBtn?.classList.remove("opacity-0", "pointer-events-none");
      clearBtn?.classList.add("opacity-100", "pointer-events-auto");

      label.textContent = count === 1 ? "1 Service Selected" : `${count} Services Selected`;
      label.classList.add("text-blue-400");

      let total = 0;
      for (const i of checked) {
        const price = Number(i.dataset.servicePrice || 0);
        if (!Number.isNaN(price)) total += price;
      }

      meta.textContent = `Total: ${total.toFixed(2)} EUR`;
      meta.classList.remove("text-gray-400");
      meta.classList.add("text-emerald-400");
    } else {
      badge.classList.add("opacity-0", "scale-0");
      badge.classList.remove("opacity-100", "scale-100");

      clearBtn?.classList.add("opacity-0", "pointer-events-none");
      clearBtn?.classList.remove("opacity-100", "pointer-events-auto");

      label.textContent = "Select Services";
      label.classList.remove("text-blue-400");

      meta.textContent = "Multiple allowed";
      meta.classList.remove("text-emerald-400");
      meta.classList.add("text-gray-400");
    }
  }
};
