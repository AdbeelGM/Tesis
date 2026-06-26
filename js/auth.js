/**
 * @file auth.js
 * @description Gestiona la página de acceso: alterna entre inicio de sesión y registro, valida formularios, llama al backend de usuarios y crea la sesión local antes de entrar a LSM Gamificada.
 * @module Autenticación
 */
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
  const loginOk = document.getElementById("login-ok");
  const registerError = document.getElementById("register-error");
  const registerOk = document.getElementById("register-ok");

  const clearMessages = () => {
    loginError.textContent = "";
    loginOk.textContent = "";
    registerError.textContent = "";
    registerOk.textContent = "";
  };

  const normalizeUserValue = (value) => value.trim();

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

  document.querySelectorAll("[data-switch-tab]").forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.switchTab));
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    const input = document.getElementById(button.dataset.togglePassword);
    const icon = button.querySelector(".material-symbols-outlined");

    button.addEventListener("click", () => {
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
      if (icon) icon.textContent = showing ? "visibility" : "visibility_off";
    });
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMessages();

    const usuario = normalizeUserValue(document.getElementById("login-usuario").value);
    const password = document.getElementById("login-password").value.trim();

    if (!usuario || !password) {
      loginError.textContent = "Ingresa tu usuario y contraseña para continuar.";
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

    const usuario = normalizeUserValue(document.getElementById("register-usuario").value);
    const password = document.getElementById("register-password").value.trim();

    if (!usuario || !password) {
      registerError.textContent = "Completa todos los campos para crear tu cuenta.";
      return;
    }

    try {
      await registerUser(usuario, password);
      registerForm.reset();
      setTab("login");
      document.getElementById("login-usuario").value = usuario;
      loginOk.textContent = `Usuario ${usuario} creado. Ahora puedes iniciar sesión.`;
    } catch (err) {
      registerError.textContent = err.message;
    }
  });
});
