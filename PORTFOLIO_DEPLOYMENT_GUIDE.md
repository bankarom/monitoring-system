# 🚀 Portfolio Showcase & Free Cloud Deployment Guide

Welcome to the **Workforce Telemetry & Productivity Platform** showcase setup.

This project features:
1. **Cross-Platform Desktop Agent** (`Electron.js` + `Koffi` + `Node.js`): Tracks native window titles, keystroke/mouse input frequency, and captures automated multi-monitor HD screenshots.
2. **Real-Time Backend API** (`Node.js` + `Express` + `Prisma` + `PostgreSQL` + `WebSockets`): Telemetry batch processing, heartbeat monitoring, and automated 15-day portfolio data seeding.
3. **Web Admin & Employee Portal** (`React` + `Vite` + `Tailwind CSS` + `Lucide`): Real-time live employee grid, 24-hour activity heatmaps, screenshot galleries, and timesheet analytics.

---

## 🌟 What Recruiters & Interviewers Will Experience

Your project is built to give employers **two options**:

### Option A: Instant Live Web Demo (Zero Installation)
* The recruiter opens your live link: `https://your-monitoring-app.vercel.app`
* On the login page, they see a **"⚡ Live Portfolio Sandbox"** banner with **1-Click Access buttons**:
  * **[Super Admin]**: Logs in immediately as `admin@demo.com` with full visibility over the company.
  * **[Employee Portal]**: Logs in immediately as `alex.rivers@demo.com` to view an employee's personal timesheet and screenshots.
* **Pre-Populated Data**:
  * **5 realistic employee profiles** (Frontend Dev, UI/UX Designer, Backend Engineer, QA Lead, DevOps Architect).
  * **15 days of continuous historical work history** (realistic 9-hour shifts, lunch breaks, high activity during coding, and actual work screenshots).

### Option B: The Live Interactive Loop (Testing the `.exe`)
If a technical interviewer wants to test real-time tracking:
1. In the Web Admin portal, they click **"Add Employee"** (e.g. `Tester John`, `john@test.com`, `pass123`).
2. They download your `Agent-Setup.exe` from your GitHub Releases.
3. They open the app, enter `john@test.com`, and click **"Start Work"**.
4. **The Desktop Agent tracks their actual typing, clicks, and captures their real laptop screen.**
5. The Admin Web Dashboard flips `Tester John` to **ONLINE (Green Dot)** and displays their live screenshot and activity stats in real time!

---

## ☁️ 100% Free Cloud Deployment (No Paid VPS Needed!)

You can host this entire system 24/7 on free cloud services:

```
┌──────────────────────────────────────┐
│     React Admin Dashboard (Vercel)   │  👉 Employer opens: https://your-app.vercel.app
└──────────────────┬───────────────────┘
                   │ HTTPS API Requests
                   ▼
┌──────────────────────────────────────┐
│     Express Backend (Render.com)     │  👉 Free server: https://your-api.onrender.com
└──────────────────┬───────────────────┘
                   │ Database Queries
                   ▼
┌──────────────────────────────────────┐
│  PostgreSQL Cloud (Neon or Supabase) │  👉 Free 500MB cloud database
└──────────────────────────────────────┘
```

---

### Step 1: Create Free Cloud Database (Neon.tech or Supabase)
1. Go to [Neon.tech](https://neon.tech) (or [Supabase.com](https://supabase.com)) and sign up for free.
2. Click **Create Project** (Name: `monitoring-portfolio`).
3. Copy your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@ep-sample-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

---

### Step 2: Deploy Backend to Render.com (Free)
1. Push this project to your personal GitHub repository:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/monitoring-system.git
   git branch -M main
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   * **Root Directory**: `backend`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   * `DATABASE_URL`: *(paste the connection string from Step 1)*
   * `PORT`: `4000`
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: `super-secret-jwt-key-portfolio-2026`
6. Click **Deploy Web Service**!
   Render will deploy your backend and give you a free URL (e.g. `https://workforce-api.onrender.com`).
   > *Note: On startup, the backend automatically runs `seedPortfolioData()` and creates all 5 employees and 15 days of data!*

---

### Step 3: Deploy Frontend to Vercel (Free)
1. Log in to [Vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Select your GitHub repository.
3. In the configuration:
   * **Root Directory**: Click "Edit" and choose `frontend`.
   * **Framework Preset**: `Vite`.
4. Under **Environment Variables**, add:
   * `VITE_API_URL`: `https://workforce-api.onrender.com` *(your Render backend URL from Step 2)*
5. Click **Deploy**!
   In 30 seconds, Vercel gives you your permanent live URL (e.g. `https://workforce-monitor.vercel.app`).

---

## 💻 How to Demonstrate Locally (In Live Interviews)

If you are sharing your screen in a technical interview:

### 1. Start the Backend:
```bash
cd backend
npm run dev
```
*(Runs on `http://localhost:4000`)*

### 2. Start the Frontend:
```bash
cd frontend
npm run dev
```
*(Runs on `http://localhost:5173`)*

### 3. Start the Desktop Agent:
```bash
cd desktop-agent
npm run dev
```
1. Click **"Start Work"** in the Desktop Agent.
2. Open the Admin Dashboard in your browser (`http://localhost:5173`).
3. Show the interviewer how your real screen and typing update the dashboard live!

---

## 📦 How to Compile the `.exe` Installer for GitHub Releases

To provide a downloadable Windows installer:

```bash
cd desktop-agent
npm run dist
```
* This compiles a standalone installer: `desktop-agent/release/Improx-Agent-Setup-1.0.0.exe`.
* Upload this `.exe` to your GitHub repo under **Releases** (`v1.0.0`).
* Add the download link to your GitHub `README.md`.

---

## 📄 Resume & LinkedIn Bullet Points

You can copy-paste these bullet points directly onto your resume:

```markdown
Workforce Telemetry & Productivity Platform
Tech Stack: React.js, TypeScript, Node.js, Express, PostgreSQL, Prisma ORM, Electron.js, WebSockets, Tailwind CSS
• Architected a full-stack telemetry platform featuring a cross-platform Electron desktop agent, 
  Express REST API backend, and real-time React web admin console.
• Built a low-level desktop tracking engine (Electron/Koffi) sampling keystroke and mouse frequencies 
  with automated multi-monitor HD screenshot captures and offline SQLite queueing.
• Developed a real-time web dashboard with live employee presence, 24-hour activity heatmaps, 
  screenshot galleries, and automated productivity calculations.
• Built automated database seeding engines populating multi-employee historical shifts, activity logs, 
  and screenshot streams for evaluation sandboxes.
```
