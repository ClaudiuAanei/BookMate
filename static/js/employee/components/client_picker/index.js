window.Employee = window.Employee || {};

Employee.clientPicker = {
  _open: false,
  _lastQuery: "",
  _debounce: null,
  _results: [],

  bind() {
    const root = document.querySelector("[data-client-picker]");
    if (!root) return;

    const input = root.querySelector("[data-client-search-input]");
    const box = root.querySelector("[data-client-results]");
    const list = root.querySelector("[data-client-results-list]");
    const title = root.querySelector("[data-client-results-title]");
    const editBtn = root.querySelector("[data-client-edit-btn]");
    const clearBtn = root.querySelector("[data-client-clear-btn]");
    const addBtn = root.querySelector("[data-client-add-btn]");
    const addFooterBtn = root.querySelector("[data-client-add-footer-btn]");

    const open = () => { box.classList.remove("hidden"); this._open = true; };
    const close = () => { box.classList.add("hidden"); this._open = false; };
    const setTitle = (n) => { if (title) title.textContent = `Clients Found (${n})`; };

    // click outside closes
    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) close();
    });

    // add new
    const openAdd = () => Employee.clientForm.openAdd();
    addBtn?.addEventListener("click", openAdd);
    addFooterBtn?.addEventListener("click", openAdd);

    // quick edit selected
    editBtn?.addEventListener("click", () => {
      if (!Employee.store.selectedClient) return;
      Employee.clientForm.openUpdate(Employee.store.selectedClient);
    });

    // enable/disable edit button when client selected
    const syncSelectedUi = (client) => {
    const has = !!client;

    editBtn?.classList.toggle("hidden", !has);
    clearBtn?.classList.toggle("hidden", !has);

    // IMPORTANT: sincronizează input-ul cu selecția
    if (has) {
        input.value = `${client.first_name || ""} ${client.last_name || ""}`.trim();
    } else {
        input.value = "";
    }
    };

    document.addEventListener("employee:client-selected", (e) => {
    syncSelectedUi(e.detail || null);
    });
    syncSelectedUi(Employee.store.selectedClient);


    // input typing
    input.addEventListener("focus", () => {
      if (this._results.length) open();
    });

input.addEventListener("input", () => {
  const q = input.value.trim();
  this._lastQuery = q;

  if (this._debounce) clearTimeout(this._debounce);

  if (q.length < 2) {
    this._results = [];
    list.innerHTML = "";
    setTitle(0);
    close();
    return;
  }

  this._debounce = setTimeout(async () => {
    try {
      const searchUrl = root.dataset.searchUrl;
      if (!searchUrl) throw new Error("Missing data-search-url on [data-client-picker]");

      const url = searchUrl + "?q=" + encodeURIComponent(q);
      const data = await Employee.http.json(url, { method: "GET" });

      const results = Array.isArray(data) ? data : (data.results || []);
      this._results = results;

      list.innerHTML = results.map(this._rowHtml).join("");
      setTitle(results.length);
      open();
    } catch (err) {
      Employee.notify.err(err.message || "Search failed");
    }
  }, 800);
});

    list.addEventListener("click", (e) => {
      const row = e.target.closest("[data-client-row]");
      if (!row) return;

      const id = row.getAttribute("data-client-id");
      const client = this._results.find(x => String(x.id) === String(id));
      if (!client) return;

      Employee.store.setClient(client);

      input.value = `${client.first_name || ""} ${client.last_name || ""}`.trim();

      close();
    });

    list.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-client-row-edit]");
      if (!btn) return;
      e.stopPropagation();

      const id = btn.getAttribute("data-client-id");
      const client = this._results.find(x => String(x.id) === String(id));
      if (!client) return;

      Employee.clientForm.openUpdate(client);
    });

    clearBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    Employee.store.setClient(null);

    this._lastQuery = "";
    this._results = [];
    list.innerHTML = "";
    setTitle(0);
    close();

    input.focus();
    });

  },

  _rowHtml(c) {
    const name = `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unnamed";
    const phone = c.phone || "-";
    const email = c.email || "-";

    return `
      <div class="group/item relative border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
           data-client-row data-client-id="${c.id}">
        <div class="flex items-center justify-between p-4">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="h-10 w-10 rounded-full bg-[#27272a] flex items-center justify-center text-gray-400 group-hover/item:text-purple-400 group-hover/item:bg-[#3f3f46] transition-colors flex-shrink-0">
              <i class="ph ph-user text-xl"></i>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-gray-200 truncate group-hover/item:text-white">${name}</p>
              <div class="flex items-center gap-2 text-xs text-gray-500 group-hover/item:text-gray-400">
                <span class="flex items-center gap-1"><i class="ph ph-phone"></i> ${phone}</span>
                <span class="hidden sm:inline text-gray-700">|</span>
                <span class="flex items-center gap-1 truncate"><i class="ph ph-envelope"></i> ${email}</span>
              </div>
            </div>
          </div>

          <button class="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-all shadow-sm border border-transparent hover:border-white/10 z-10"
                  data-client-row-edit data-client-id="${c.id}" type="button">
            <i class="ph ph-pencil-simple text-lg"></i>
          </button>
        </div>
        <div class="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
      </div>
    `;
  }
};
