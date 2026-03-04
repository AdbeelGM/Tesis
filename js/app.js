// js/app.js
document.addEventListener("DOMContentLoaded", () => {
  const sidebarRoot = document.getElementById("sidebar-nav");
  if (sidebarRoot) {
    new window.SidebarNav(sidebarRoot);
  }

});
