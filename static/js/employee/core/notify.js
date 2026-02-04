window.Employee = window.Employee || {};

Employee.notify = (function () {

  const toast = document.getElementById("toast-notification");
  const iconBg = document.getElementById("toast-icon-bg");
  const icon = document.getElementById("toast-icon");
  const msg = document.getElementById("toast-message");
  const bar = document.getElementById("toast-progress");

  let timer;
  const DURATION = 3000;

  function reset() {
    toast.classList.remove("border-emerald-500", "border-red-500");
    iconBg.className = "inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg";
    icon.className = "ph text-sm";
    bar.className = "absolute bottom-0 left-0 h-[3px] w-full";
  }

  function show(type, message) {
    if (!toast) return;

    clearTimeout(timer);
    reset();

    if (type === "success") {
      toast.classList.add("border-emerald-500");
      iconBg.classList.add("bg-emerald-500/10", "text-emerald-400");
      icon.classList.add("ph-check-circle");
      bar.classList.add("bg-emerald-500");
    }

    if (type === "error") {
      toast.classList.add("border-red-500");
      iconBg.classList.add("bg-red-500/10", "text-red-400");
      icon.classList.add("ph-x-circle");
      bar.classList.add("bg-red-500");
    }

    msg.textContent = message || "Something happened.";

    // reset bar
    bar.style.transition = "none";
    bar.style.width = "100%";

    toast.classList.remove("toast-hidden");
    toast.classList.add("toast-visible");

    requestAnimationFrame(() => {
      bar.style.transition = `width ${DURATION}ms linear`;
      bar.style.width = "0%";
    });

    timer = setTimeout(hide, DURATION);
  }

  function hide() {
    toast.classList.remove("toast-visible");
    toast.classList.add("toast-hidden");
  }

  return {
    ok(message) { show("success", message); },
    err(message) { show("error", message); },
    hide
  };

})();
