window.Employee = window.Employee || {};

Employee.http = {
  async json(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    // CSRF for unsafe methods (POST/PUT/PATCH/DELETE)
    if (Employee.csrf?.isUnsafe(method)) {
      const token = Employee.csrf.token();
      if (!token) {
        // Fail fast with clear message
        throw new Error("Missing csrftoken cookie. Ensure @ensure_csrf_cookie on dashboard view.");
      }
      headers["X-CSRFToken"] = token;
    }

    const res = await fetch(url, {
      credentials: "same-origin", // important for session + csrftoken cookie
      ...options,
      method,
      headers,
    });

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }

    if (!res.ok) {
      const msg = (data && (data.message || data.detail)) || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  },
};
