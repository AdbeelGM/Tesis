import { loadSession, clearSession } from "./user-session.js";
import { refreshStatusBar } from "./statusbar.js";

const LOGIN_URL = "login.html";

document.addEventListener("DOMContentLoaded", async () => {
  const sidebarRoot = document.getElementById("sidebar-nav");
  if (sidebarRoot) new window.SidebarNav(sidebarRoot);

  const logoutBtn = document.getElementById("btn-logout");
  const session = loadSession();

  if (!session?.usuario) {
    window.location.replace(LOGIN_URL);
    return;
  }

  logoutBtn?.addEventListener("click", () => {
    clearSession();
    window.location.replace(LOGIN_URL);
  });

  await refreshStatusBar();
  document.dispatchEvent(new CustomEvent("user-state-ready", { detail: window.currentUserState }));
});
