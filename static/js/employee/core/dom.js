window.Employee = window.Employee || {};

Employee.dom = {
  qs(root, sel) { return (root || document).querySelector(sel); },
  qsa(root, sel) { return Array.from((root || document).querySelectorAll(sel)); },
  on(root, event, sel, handler) {
    (root || document).addEventListener(event, (e) => {
      const el = e.target.closest(sel);
      if (el) handler(e, el);
    });
  }
};
