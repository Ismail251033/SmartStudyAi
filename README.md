# 🧠 SmartStudyAI

A production-ready AI-powered study platform with summaries, quizzes, flashcards, Q&A, and a gamification system.

---

## 📁 Project Structure

```
smartstudy/
├── backend/
│   ├── lib/
│   │   ├── supabase.js       # Supabase admin + public clients
│   │   └── gemini.js         # Gemini AI integration
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── auth.js           # /api/auth — signup, signin, refresh, me
│   │   ├── ai.js             # /api/ai — summary, quiz, flashcards, qa
│   │   └── user.js           # /api/user — profile, activities, progress
│   ├── server.js             # Express app entry point
│   ├── package.json
│   └── .env.example          # Copy to .env and fill in your keys
│
├── frontend/
│   ├── css/
│   │   └── styles.css        # Full glassmorphism dark theme
│   ├── js/
│   │   ├── api.js            # API client with token refresh
│   │   └── app.js            # Toast, XP, auth guard, utilities
│   ├── index.html            # Redirects to login
│   ├── login.html            # Sign in / Sign up
│   └── dashboard.html        # Full app (all panels)
│
└── supabase_schema.sql       # Run this in Supabase SQL Editor
```

---

## 🚀 Setup Guide

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase_schema.sql`
3. Copy your project URL and keys from **Settings → API**

### 2. Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create an API key

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your keys
npm install
npm start
# Server runs on http://localhost:3001
```

Your `.env` file:
```env
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Found in Supabase Settings → API
GEMINI_API_KEY=AIzaSy...
JWT_SECRET=your-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Frontend Setup

The frontend is plain HTML/CSS/JS — no build step needed.

**Option A — Simple HTTP server:**
```bash
cd frontend
npx serve . -p 3000
# or
python3 -m http.server 3000
```

**Option B — VS Code Live Server:**
Open `frontend/` in VS Code → right-click `index.html` → Open with Live Server

**Option C — Production (Nginx/Apache):**
Deploy the `frontend/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.)

> **Important:** The frontend uses `window.SMARTSTUDY_API_URL` to find the backend.  
> For production, add this before loading scripts in your HTML:
> ```html
> <script>window.SMARTSTUDY_API_URL = 'https://your-backend.com/api';</script>
> ```
> Or just edit the default in `js/api.js`.

---

## ✨ Features

| Feature | XP | Description |
|---------|-----|-------------|
| 📄 AI Summary | +10 XP | Structured summaries with key points & concepts |
| ❓ Quiz Generator | +20 XP | MCQ with explanations and score tracking |
| 🧠 Flashcards | +15 XP | Flip cards with difficulty levels & keyboard nav |
| 💬 Q&A Assistant | +5 XP | AI tutor with examples and further reading |

**Gamification:**
- XP-based leveling (100 XP = 1 level)
- Daily login streaks
- Level-up celebration overlay
- XP popup animation

---

## 🔐 Security

- Tokens stored in `sessionStorage` only (cleared on tab close)
- Refresh token rotation via Supabase
- Rate limiting on all API routes (20 req/min for AI)
- Input validation on frontend + backend
- Supabase Row Level Security on all tables
- Service role key never exposed to frontend
- Helmet.js security headers

---

## 🛠 Tech Stack

**Backend:** Node.js, Express, Supabase JS SDK, Google Generative AI  
**Frontend:** Vanilla HTML/CSS/JavaScript  
**Database:** Supabase (PostgreSQL)  
**Auth:** Supabase Auth (JWT + Refresh tokens)  
**AI:** Google Gemini 1.5 Flash
