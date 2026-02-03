window.Employee = window.Employee || {};

Employee.notify = {
  push(type, message) {
    const host = document.querySelector("[data-toasts]");
    if (!host) return console.log(`[${type}] ${message}`);

    const el = document.createElement("div");
    el.className = "rounded-xl border border-white/10 bg-[#18181b] px-4 py-3 text-sm shadow-2xl";
    el.innerHTML = `<div class="text-gray-100 font-semibold">${type}</div><div class="text-gray-400">${message}</div>`;
    host.appendChild(el);

    setTimeout(() => el.remove(), 2800);
  },
  ok(msg) { this.push("OK", msg); },
  err(msg) { this.push("Error", msg); },
};
