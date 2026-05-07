/**
 * SmartStudyAI — Frontend Configuration
 * ─────────────────────────────────────
 * This is the ONLY file you need to edit to point the frontend
 * at your backend. Change API_URL to your deployed backend URL.
 *
 * Examples:
 *   Local dev  →  http://localhost:3001/api
 *   Production →  https://your-backend.railway.app/api
 *                 https://api.yourdomain.com/api
 */

window.SMARTSTUDY_CONFIG = {
  // ── Change this to your backend URL ──────────────────────
 API_URL:'https://smartstudyai-production-9ccb.up.railway.app',
  // ── App settings (no need to change these) ────────────────
  APP_NAME: 'SmartStudyAI',
  VERSION: '1.0.0',

  // ── Route helpers (works with both / and file:// serving) ─
  routes: {
    home:      _resolvePath('index.html'),
    login:     _resolvePath('login.html'),
    dashboard: _resolvePath('dashboard.html'),
  }
};

// Resolve paths relative to the current HTML file's location,
// so navigation works whether served from / or from file://
function _resolvePath(filename) {
  const base = window.location.pathname.replace(/\/[^/]*$/, '/');
  return base + filename;
}

// Make API_URL available as the legacy global (api.js reads this)
window.SMARTSTUDY_API_URL = window.SMARTSTUDY_CONFIG.API_URL;

// Helper: navigate to a named route
window.goto = function(name) {
  const path = window.SMARTSTUDY_CONFIG.routes[name];
  if (path) window.location.href = path;
  else console.error('[SmartStudyAI] Unknown route:', name);
};