window.Employee = window.Employee || {};

Employee.csrf = {
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length !== 2) return null;
    return parts.pop().split(";").shift() || null;
  },

  token() {
    return this.getCookie("csrftoken");
  },

  isUnsafe(method) {
    const m = (method || "GET").toUpperCase();
    return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(m);
  }
};
