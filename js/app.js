import { loginUser } from "./api-user.js";
import { loadSession, saveSession, clearSession } from "./user-session.js";
import { refreshStatusBar } from "./statusbar.js";

document.addEventListener("DOMContentLoaded", () => {
  const sidebarRoot = document.getElementById("sidebar-nav");
  if (sidebarRoot) new window.SidebarNav(sidebarRoot);

  const loginOverlay = document.getElementById("login-overlay");
  const appShell = document.querySelector(".app-shell");
  const form = document.getElementById("login-form");
  const usuarioInput = document.getElementById("login-usuario");
  const passInput = document.getElementById("login-password");
  const errorEl = document.getElementById("login-error");
  const logoutBtn = document.getElementById("btn-logout");

  const session = loadSession();
  if (session?.usuario) {
    unlockApp();
  } else {
    lockApp();
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usuario = usuarioInput.value.trim();
    const password = passInput.value.trim();

    if (!usuario || !password) {
      errorEl.textContent = "Debes ingresar usuario y contraseña.";
      return;
    }

    try {
      const state = await loginUser(usuario, password);
      saveSession({ usuario: state.usuario });
      errorEl.textContent = "";
      form.reset();
      unlockApp();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  logoutBtn?.addEventListener("click", () => {
    clearSession();
    lockApp();
  });

  async function unlockApp() {
    loginOverlay.classList.add("login-overlay--hidden");
    appShell.classList.remove("app-shell--locked");
    await refreshStatusBar();
    document.dispatchEvent(new CustomEvent("user-state-ready", { detail: window.currentUserState }));
  }

  function lockApp() {
    loginOverlay.classList.remove("login-overlay--hidden");
    appShell.classList.add("app-shell--locked");
    window.currentUserState = null;
  }
});
