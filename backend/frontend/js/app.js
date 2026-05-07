/**
 * SmartStudyAI - Main App Logic
 * Handles: toasts, auth guard, gamification UI, utilities
 */

// ─── Toast Notification System ─────────────────────────────
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(title, message = '', type = 'info', duration = 4000) {
    if (!this.container) this.init();

    const icons = {
      success: '✅',
      error: '❌',
      xp: '⚡',
      info: 'ℹ️',
      warning: '⚠️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
    `;

    this.container.appendChild(toast);

    const remove = () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    };

    setTimeout(remove, duration);
    toast.addEventListener('click', remove);

    return toast;
  },

  success(title, message) { return this.show(title, message, 'success'); },
  error(title, message) { return this.show(title, message, 'error', 6000); },
  info(title, message) { return this.show(title, message, 'info'); },
  xp(amount, leveledUp = false) {
    const msg = leveledUp ? 'Level up! Keep going! 🚀' : '';
    return this.show(`+${amount} XP earned!`, msg, 'xp', 3000);
  }
};

// ─── XP Popup ─────────────────────────────────────────────
function showXPPopup(amount) {
  let popup = document.getElementById('xp-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.className = 'xp-popup';
    popup.id = 'xp-popup';
    document.body.appendChild(popup);
  }
  popup.innerHTML = `⚡ +${amount} XP`;
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 2500);
}

// ─── Level Up Overlay ──────────────────────────────────────
function showLevelUp(newLevel) {
  const overlay = document.createElement('div');
  overlay.className = 'level-up-overlay';
  overlay.innerHTML = `
    <div class="level-up-card">
      <div class="level-up-icon">🎉</div>
      <div class="level-up-title">Level ${newLevel}!</div>
      <div class="level-up-subtitle">You've leveled up! Keep studying to unlock more achievements.</div>
      <button class="btn btn-primary" onclick="this.closest('.level-up-overlay').remove()">
        Awesome! 🚀
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

// ─── Handle XP Response ───────────────────────────────────
function handleXPResult(xpData) {
  if (!xpData) return;
  showXPPopup(xpData.earned);
  Toast.xp(xpData.earned, xpData.leveledUp);

  if (xpData.leveledUp) {
    setTimeout(() => showLevelUp(xpData.newLevel), 800);
  }

  // Update XP display in sidebar if present
  updateXPDisplay(xpData.newXP, xpData.newLevel);
}

// ─── XP Level Calculation ──────────────────────────────────
function getLevelInfo(xp) {
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const xpForNext = 100;
  const progress = (xpInLevel / xpForNext) * 100;
  return { level, xpInLevel, xpForNext, progress };
}

function updateXPDisplay(xp, level) {
  const xpEl = document.getElementById('user-xp');
  const levelEl = document.getElementById('user-level');
  const barEl = document.getElementById('xp-bar');
  const { xpInLevel, xpForNext, progress } = getLevelInfo(xp);

  if (xpEl) xpEl.textContent = xp.toLocaleString();
  if (levelEl) levelEl.textContent = `Level ${level}`;
  if (barEl) barEl.style.width = `${progress}%`;

  const xpDetailEl = document.getElementById('xp-detail');
  if (xpDetailEl) xpDetailEl.textContent = `${xpInLevel} / ${xpForNext} XP`;
}

// ─── Auth Guard ────────────────────────────────────────────
function requireAuth() {
  if (!window.api || !window.api.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function redirectIfAuth() {
  if (window.api && window.api.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return true;
  }
  return false;
}

// ─── Loading Button State ──────────────────────────────────
function setButtonLoading(btn, loading, originalText) {
  if (loading) {
    btn.disabled = true;
    btn._originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> Processing...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._originalHTML || originalText || btn.textContent;
  }
}

// ─── Char Counter ──────────────────────────────────────────
function attachCharCounter(textarea, counterEl, max = 10000) {
  const update = () => {
    const len = textarea.value.length;
    counterEl.textContent = `${len.toLocaleString()} / ${max.toLocaleString()}`;
    counterEl.className = 'char-count';
    if (len > max * 0.9) counterEl.classList.add('warning');
    if (len >= max) counterEl.classList.add('error');
  };
  textarea.addEventListener('input', update);
  update();
}

// ─── Time Formatting ───────────────────────────────────────
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ─── Activity Labels ───────────────────────────────────────
const ACTIVITY_ICONS = {
  summary: { icon: '📄', label: 'Summary Generated', color: 'purple' },
  quiz: { icon: '❓', label: 'Quiz Completed', color: 'cyan' },
  flashcards: { icon: '🧠', label: 'Flashcards Created', color: 'green' },
  qa: { icon: '💬', label: 'Question Answered', color: 'orange' }
};

function renderActivity(activity) {
  const info = ACTIVITY_ICONS[activity.type] || { icon: '⭐', label: activity.type, color: 'purple' };
  const title = activity.metadata?.title || info.label;

  return `
    <div class="activity-item">
      <div class="activity-icon stat-icon ${info.color}">${info.icon}</div>
      <div class="activity-info">
        <div class="activity-type">${title}</div>
        <div class="activity-time">${timeAgo(activity.created_at)}</div>
      </div>
      <div class="activity-xp">+${activity.xp_earned} XP</div>
    </div>
  `;
}

// ─── Sidebar Navigation ────────────────────────────────────
function initSidebar() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== toggle) {
        sidebar.classList.remove('open');
      }
    });
  }

  // Sign out
  const signoutBtn = document.getElementById('signout-btn');
  if (signoutBtn) {
    signoutBtn.addEventListener('click', async () => {
      try {
        await window.api.signOut();
      } finally {
        window.location.href = '/login.html';
      }
    });
  }
}

// ─── Load User Sidebar Info ────────────────────────────────
async function loadSidebarUser() {
  try {
    // Try cached first for instant display
    const cached = localStorage.getItem('ss_user_cache');
    if (cached) {
      const user = JSON.parse(cached);
      setSidebarUser(user);
    }

    const data = await window.api.getProfile();
    if (data.user) {
      setSidebarUser(data.user);
      localStorage.setItem('ss_user_cache', JSON.stringify(data.user));
    }
  } catch (err) {
    console.error('Failed to load user:', err);
  }
}

function setSidebarUser(user) {
  const avatarEl = document.getElementById('sidebar-avatar');
  const usernameEl = document.getElementById('sidebar-username');
  const levelEl = document.getElementById('user-level');

  if (avatarEl) avatarEl.textContent = (user.username || 'U')[0].toUpperCase();
  if (usernameEl) usernameEl.textContent = user.username || 'User';
  if (levelEl) levelEl.textContent = `Level ${user.level || 1}`;

  updateXPDisplay(user.xp || 0, user.level || 1);
}

// ─── Init on DOM Ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
});

// Export globals
window.Toast = Toast;
window.handleXPResult = handleXPResult;
window.getLevelInfo = getLevelInfo;
window.updateXPDisplay = updateXPDisplay;
window.requireAuth = requireAuth;
window.redirectIfAuth = redirectIfAuth;
window.setButtonLoading = setButtonLoading;
window.attachCharCounter = attachCharCounter;
window.timeAgo = timeAgo;
window.renderActivity = renderActivity;
window.initSidebar = initSidebar;
window.loadSidebarUser = loadSidebarUser;
window.showXPPopup = showXPPopup;
window.showLevelUp = showLevelUp;
