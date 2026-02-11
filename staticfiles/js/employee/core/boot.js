window.Employee = window.Employee || {};

Employee.boot = function boot() {
  Employee.modal.bind();
  Employee.clientForm.bind();
  Employee.navbar.init();

};

document.addEventListener("DOMContentLoaded", Employee.boot);
Employee.store.load();

