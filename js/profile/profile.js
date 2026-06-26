/*
 * Nombre: profile.js
 * Descripción: Renderiza y actualiza el perfil del usuario.
 * Módulo: Frontend / Perfil
 */
import { updateProfilePhotoGlobal } from '../game-state.js';

const XP_BASE_REQUIREMENT = 120;
const DEFAULT_PROFILE_AVATAR_SRC = 'img/avatar.png';

function xpNeededToAdvance(accountLevel) {
  const level = Math.max(1, Number(accountLevel) || 1);
  return Math.round(XP_BASE_REQUIREMENT + (level * 32) + (Math.pow(level, 1.4) * 14));
}

function getExperienceProgress(totalXp) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let accountLevel = 1;
  let required = xpNeededToAdvance(accountLevel);

  while (xp >= required) {
    xp -= required;
    accountLevel += 1;
    required = xpNeededToAdvance(accountLevel);
  }

  const percent = Math.max(0, Math.min(100, Math.round((xp / required) * 100)));
  return {
    accountLevel,
    currentXpInLevel: xp,
    neededXpForNext: required,
    percent,
  };
}

function renderProfileView() {
  return `
    <section class="profile-view">
      <div class="profile-layout">
        <article class="profile-banner card-hover-lift">
          <div class="profile-banner__bg profile-banner__bg--grid"></div>
          <div class="profile-banner__bg profile-banner__bg--orb-top"></div>
          <div class="profile-banner__bg profile-banner__bg--orb-bottom"></div>

          <div class="profile-banner__content">
              <div class="profile-avatar-wrap">
                <div class="profile-avatar-ring">
                  <img id="profile-avatar" class="profile-avatar" src="${DEFAULT_PROFILE_AVATAR_SRC}" alt="Foto de perfil">
                </div>
              <span class="profile-pro-badge">PRO</span>
            </div>

            <div class="profile-main-info">
              <div class="profile-header-row">
                <div>
                  <div class="profile-name-row">
                    <h1 id="profile-name" class="profile-name">Usuario</h1>
                    <span class="material-symbols-outlined profile-verified" style="font-variation-settings: 'FILL' 1;">verified</span>
                  </div>
                  <p id="profile-joined" class="profile-meta">
                    <span class="material-symbols-outlined">calendar_today</span>
                    Se unió recientemente
                  </p>
                </div>

                <button id="profile-edit-btn" class="profile-edit-btn btn-active-press" type="button">
                  <span class="material-symbols-outlined">edit</span>
                  Cambiar foto
                </button>
                <input id="profile-photo-input" type="file" accept="image/*" hidden>
              </div>

              <div class="profile-progress-wrap">
                <div class="profile-progress-head">
                  <span class="profile-progress-title">
                    <span class="material-symbols-outlined">auto_awesome</span>
                    Progreso del viaje
                  </span>
                  <span id="profile-progress-percent" class="profile-progress-percent">0%</span>
                </div>

                <div class="profile-progress-track">
                  <div id="profile-progress-fill" class="profile-progress-fill progress-fill" style="width: 0%;">
                    <span class="profile-progress-dot"></span>
                  </div>
                </div>

                <div id="profile-progress-meta" class="profile-progress-meta">
                  <span>Nivel 1 (0 XP)</span>
                  <span>Progreso de aprendizaje</span>
                </div>
              </div>
            </div>
          </div>
        </article>

        <section class="profile-stats-grid">
          <div class="profile-stats-list">
            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--orange">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">local_fire_department</span>
              </div>
              <h3 id="profile-streak">0 días</h3>
              <p>Racha diaria</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--yellow">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">diamond</span>
              </div>
              <h3 id="profile-gems">0</h3>
              <p>Gemas</p>
            </article>

            <article class="profile-stat-card card-hover-lift">
              <div class="profile-stat-icon profile-stat-icon--teal">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">task_alt</span>
              </div>
              <h3 id="profile-lessons">0</h3>
              <p>Lecciones terminadas</p>
            </article>
          </div>

          <article class="profile-quests-card card-hover-lift">
            <h4>Tiempo invertido</h4>
            <strong id="profile-time-hours">0d 0h</strong>
          </article>
        </section>
      </div>
    </section>
  `;
}

function formatJoinedDate(dateValue) {
  if (!dateValue) return 'Se unió recientemente';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Se unió recientemente';
  return `Se unió el ${new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)}`;
}

function formatTimeInvested(seconds) {
  const clamped = Math.max(0, Number(seconds) || 0);
  const totalHours = Math.floor(clamped / 3600);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}

function updateProfileView(state) {
  const avatar = document.getElementById('profile-avatar');
  const profileName = document.getElementById('profile-name');
  const joined = document.getElementById('profile-joined');
  const progressPercent = document.getElementById('profile-progress-percent');
  const progressFill = document.getElementById('profile-progress-fill');
  const progressMeta = document.getElementById('profile-progress-meta');
  const streak = document.getElementById('profile-streak');
  const gems = document.getElementById('profile-gems');
  const lessons = document.getElementById('profile-lessons');
  const timeHours = document.getElementById('profile-time-hours');

  const xp = Math.max(0, Number(state.experience) || 0);
  const routeLevel = Math.max(1, Number(state.level) || 1);
  const xpProgress = getExperienceProgress(xp);
  const time = formatTimeInvested(state.timeInvestedSeconds);
  const avatarSrc = state.profilePhotoBase64 || state.profilePhotoUrl || DEFAULT_PROFILE_AVATAR_SRC;

  if (avatar) avatar.src = avatarSrc;
  if (profileName) profileName.textContent = state.usuario || 'Usuario';
  if (joined) joined.innerHTML = `<span class="material-symbols-outlined">calendar_today</span>${formatJoinedDate(state.createdAt)}`;
  if (progressPercent) progressPercent.textContent = `${xpProgress.percent}%`;
  if (progressFill) progressFill.style.width = `${xpProgress.percent}%`;
  if (progressMeta) {
    progressMeta.innerHTML = `
      <span>Nivel de cuenta ${xpProgress.accountLevel} • Ruta ${routeLevel} • ${xp.toLocaleString('es-MX')} XP</span>
      <span>${xpProgress.currentXpInLevel.toLocaleString('es-MX')} / ${xpProgress.neededXpForNext.toLocaleString('es-MX')} XP para el siguiente nivel</span>
    `;
  }
  if (streak) streak.textContent = `${Number(state.streakDays) || 0} días`;
  if (gems) gems.textContent = `${Number(state.gems) || 0}`;
  if (lessons) lessons.textContent = `${Number(state.lessonsDone) || 0}`;
  if (timeHours) timeHours.textContent = time;
}

function bindProfileActions() {
  updateProfileView(window.currentUserState || {});
  const editBtn = document.getElementById('profile-edit-btn');
  const input = document.getElementById('profile-photo-input');
  if (!editBtn || !input) return;

  editBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.showLsmModal?.({ message: 'Solo se permiten imágenes para la foto de perfil.' });
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      window.showLsmModal?.({ message: 'La foto de perfil debe ser de máximo 10 MB.' });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const updated = await updateProfilePhotoGlobal(reader.result);
        window.currentUserState = updated;
        updateProfileView(updated);
      } catch (err) {
        window.showLsmModal?.({ title: '¡Ups!', message: err.message || 'No pudimos completar la acción. Inténtalo de nuevo.' });
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      window.showLsmModal?.({ title: '¡Ups!', message: 'No se pudo leer la imagen seleccionada.' });
      input.value = '';
    };
    reader.readAsDataURL(file);
  });

export { renderProfileView, bindProfileActions, updateProfileView };
