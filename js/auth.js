import { loginUser, registerUser } from "./api-user.js";
import { loadSession, saveSession } from "./user-session.js";

const APP_URL = "index.html";

document.addEventListener("DOMContentLoaded", () => {
  if (loadSession()?.usuario) {
    window.location.replace(APP_URL);
    return;
  }

  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  const loginError = document.getElementById("login-error");
  const registerError = document.getElementById("register-error");
  const registerOk = document.getElementById("register-ok");

  const clearMessages = () => {
    loginError.textContent = "";
    registerError.textContent = "";
    registerOk.textContent = "";
  };

  const setTab = (tab) => {
    clearMessages();
    const showLogin = tab === "login";

    loginForm.classList.toggle("auth-form--hidden", !showLogin);
    registerForm.classList.toggle("auth-form--hidden", showLogin);

    tabLogin.classList.toggle("auth-toggle__btn--active", showLogin);
    tabRegister.classList.toggle("auth-toggle__btn--active", !showLogin);
    tabLogin.setAttribute("aria-selected", String(showLogin));
    tabRegister.setAttribute("aria-selected", String(!showLogin));
  };

  tabLogin.addEventListener("click", () => setTab("login"));
  tabRegister.addEventListener("click", () => setTab("register"));

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const usuario = document.getElementById("login-usuario").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!usuario || !password) {
      loginError.textContent = "Debes ingresar usuario y contraseña.";
      return;
    }

    try {
      const state = await loginUser(usuario, password);
      saveSession({ usuario: state.usuario });
      window.location.replace(APP_URL);
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const usuario = document.getElementById("register-usuario").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const passwordConfirm = document.getElementById("register-password-confirm").value.trim();

    if (!usuario || !password || !passwordConfirm) {
      registerError.textContent = "Completa todos los campos para registrarte.";
      return;
    }

    if (password !== passwordConfirm) {
      registerError.textContent = "Las contraseñas no coinciden.";
      return;
    }

    try {
      await registerUser(usuario, password);
      registerOk.textContent = "Cuenta creada. Ahora puedes iniciar sesión.";
      registerForm.reset();
      setTab("login");
      document.getElementById("login-usuario").value = usuario;
    } catch (err) {
      registerError.textContent = err.message;
    }
  });
});
