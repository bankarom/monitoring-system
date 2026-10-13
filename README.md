# 📊 Workforce Telemetry & Real-Time Monitoring Platform

An enterprise-grade, distributed employee telemetry and productivity tracking platform built with **React**, **Node.js/Express**, **PostgreSQL (Prisma)**, and **Electron.js**.

---

## 🌟 Key Features

* **Desktop Telemetry Agent (`Electron.js` + `Koffi`)**:
  * Low-level native window tracking (active application, process name, window title).
  * Input frequency sampling (keystrokes and mouse clicks) mapped to real-time productivity scores.
  * Automated periodic multi-monitor HD screen captures with watermarking.
  * Offline-first queueing with local SQLite fallback during network interruptions.

* **Real-Time Web Admin Portal (`React` + `Vite` + `Tailwind CSS`)**:
  * **Live Activity Grid**: Real-time presence indicators, active tasks, and input levels.
  * **24-Hour Timeline & Heatmaps**: Detailed breakdown of work vs. break intervals.
  * **Screenshot Gallery**: Filterable multi-employee screenshot inspection with zoom modal.
  * **Timesheets & Detailed Reporting**: Daily/weekly attendance analytics with CSV & ZIP exports.

* **Backend & Telemetry Pipeline (`Node.js` + `Express` + `PostgreSQL` + `WebSockets`)**:
  * Batch telemetry ingestion with high-throughput compression.
  * WebSocket broadcasting for live dashboard synchronization.
  * Automated 15-day historical data seeder with multi-employee shift simulation.

---

## 🛠️ Architecture

```
┌─────────────────────────────────┐
│     Electron Desktop Agent      │  (Native Windows/macOS background service)
│ (Keystroke & Mouse frequency,   │
│  HD Screen capture, Offline DB) │
└────────────────┬────────────────┘
                 │ HTTP Telemetry & REST Uploads
                 ▼
┌─────────────────────────────────┐
│    Express.js Backend & WS      │  (Node.js + Prisma ORM + PostgreSQL)
│ (Processes telemetry batches,   │
│  manages sessions & screenshots)│
└────────────────┬────────────────┘
                 │ Real-Time Queries & WebSockets
                 ▼
┌─────────────────────────────────┐
│   React Super Admin Dashboard   │  (Web Portal for Admins & Employees)
│ (Live presence grid, heatmaps,  │
│  screenshot gallery & reports)  │
└─────────────────────────────────┘
```

---

## 💻 Tech Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Context API.
* **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO, Multer, Bcrypt, JWT.
* **Desktop Agent**: Electron 31, Koffi (Native Windows C++ Win32 API hooks), Screenshot-Desktop, Axios.
* **Database**: PostgreSQL (Prisma Client).

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
# 1. Backend
cd backend
npm install
npx prisma generate
npx prisma db push

# 2. Frontend
cd ../frontend
npm install

# 3. Desktop Agent
cd ../desktop-agent
npm install
```

### 2. Run the Applications
```bash
# In Terminal 1 - Backend:
cd backend
npm run dev

# In Terminal 2 - Frontend:
cd frontend
npm run dev

# In Terminal 3 - Desktop Agent:
cd desktop-agent
npm run dev
```

---

## 🔑 Demo Access

The platform includes a built-in sandbox with 15 days of pre-populated historical work data:
* **Super Admin**: `admin@demo.com` / `demo123`
* **Employee**: `alex.rivers@demo.com` / `demo123`

---

## 📄 License
MIT License.
