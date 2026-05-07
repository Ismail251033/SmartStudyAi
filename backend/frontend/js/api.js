/**
 * SmartStudyAI - API Client
 * All backend communication through this module
 */

const API_BASE = window.SMARTSTUDY_API_URL || 'http://localhost:3001/api';

class APIClient {
  constructor() {
    this._refreshPromise = null;
  }

  // ─── Token Management ──────────────────────────────────────
  getAccessToken() {
    return sessionStorage.getItem('ss_access_token');
  }

  getRefreshToken() {
    // Refresh token stored in sessionStorage only (cleared on tab close)
    return sessionStorage.getItem('ss_refresh_token');
  }

  setSession(session) {
    if (!session) return;
    sessionStorage.setItem('ss_access_token', session.access_token);
    sessionStorage.setItem('ss_refresh_token', session.refresh_token);
    // Store non-sensitive user info in localStorage for UI
    if (session.user) {
      localStorage.setItem('ss_user_id', session.user.id);
    }
  }

  clearSession() {
    sessionStorage.removeItem('ss_access_token');
    sessionStorage.removeItem('ss_refresh_token');
    localStorage.removeItem('ss_user_id');
    localStorage.removeItem('ss_user_cache');
  }

  isAuthenticated() {
    return !!this.getAccessToken();
  }

  // ─── Core Request ──────────────────────────────────────────
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getAccessToken();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    let response = await fetch(url, config);

    // Handle token expiry - attempt refresh
    if (response.status === 401 && this.getRefreshToken() && !options._retried) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        config.headers.Authorization = `Bearer ${this.getAccessToken()}`;
        config._retried = true;
        response = await fetch(url, config);
      } else {
        this.clearSession();
        window.location.href = '/login.html';
        return;
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  // ─── Token Refresh ─────────────────────────────────────────
  async refreshToken() {
    // Prevent concurrent refresh requests
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      try {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;

        const response = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) return false;

        const data = await response.json();
        this.setSession(data.session);
        return true;
      } catch {
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  // ─── Auth APIs ─────────────────────────────────────────────
  async signUp(email, password, username) {
    const data = await this.request('/auth/signup', {
      method: 'POST',
      body: { email, password, username }
    });
    this.setSession(data.session);
    return data;
  }

  async signIn(email, password) {
    const data = await this.request('/auth/signin', {
      method: 'POST',
      body: { email, password }
    });
    this.setSession(data.session);
    // Cache user data
    if (data.user) {
      localStorage.setItem('ss_user_cache', JSON.stringify(data.user));
    }
    return data;
  }

  async signOut() {
    try {
      await this.request('/auth/signout', { method: 'POST' });
    } finally {
      this.clearSession();
    }
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // ─── User APIs ─────────────────────────────────────────────
  async getProfile() {
    return this.request('/user/profile');
  }

  async getActivities(limit = 10) {
    return this.request(`/user/activities?limit=${limit}`);
  }

  async getProgress() {
    return this.request('/user/progress');
  }

  async getFlashcardSets() {
    return this.request('/user/flashcards');
  }

  async getFlashcardSet(id) {
    return this.request(`/user/flashcards/${id}`);
  }

  async getQuizzes() {
    return this.request('/user/quizzes');
  }

  async updateProfile(data) {
    return this.request('/user/profile', { method: 'PUT', body: data });
  }

  // ─── AI APIs ───────────────────────────────────────────────
  async generateSummary(text) {
    return this.request('/ai/summary', {
      method: 'POST',
      body: { text }
    });
  }

  async generateQuiz(text, numQuestions = 5) {
    return this.request('/ai/quiz', {
      method: 'POST',
      body: { text, numQuestions }
    });
  }

  async generateFlashcards(text, numCards = 8) {
    return this.request('/ai/flashcards', {
      method: 'POST',
      body: { text, numCards }
    });
  }

  async askQuestion(question, context = '') {
    return this.request('/ai/qa', {
      method: 'POST',
      body: { question, context }
    });
  }
}

// Singleton export
window.api = new APIClient();