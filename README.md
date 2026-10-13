# 📊 Improx — Enterprise Workforce Telemetry & Monitoring System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-blue?style=for-the-badge&logo=vercel)](https://monitoring-system-lilac.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/bankarom/monitoring-system)
[![Download Desktop Agent](https://img.shields.io/badge/Desktop%20Agent-Windows%20.EXE%20(v1.0.0)-success?style=for-the-badge&logo=windows)](https://github.com/bankarom/monitoring-system/releases/download/v1.0.0/Improx.Monitoring.System.Setup.1.0.0.exe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

An enterprise-grade, distributed employee telemetry, activity tracking, and productivity intelligence system. Built with **React 18**, **TypeScript**, **Node.js/Express**, **Prisma ORM**, **PostgreSQL (Neon)**, and a native **Electron 31 Desktop Agent** utilizing low-level Windows Win32 API hooks.

---

## 🌐 Quick Access Links

| Link | Description |
| :--- | :--- |
| **🚀 Live Cloud Web App** | [https://monitoring-system-lilac.vercel.app](https://monitoring-system-lilac.vercel.app) |
| **💻 GitHub Repository** | [https://github.com/bankarom/monitoring-system](https://github.com/bankarom/monitoring-system) |
| **📥 Download Desktop Agent (.exe)** | [Improx-Setup-1.0.0.exe (Direct Download)](https://github.com/bankarom/monitoring-system/releases/download/v1.0.0/Improx.Monitoring.System.Setup.1.0.0.exe) |
| **📦 GitHub Releases** | [v1.0.0 Windows Release Page](https://github.com/bankarom/monitoring-system/releases/tag/v1.0.0) |

---

## ⚡ 1-Click Interactive Demo Sandbox

The web portal includes an instant, 1-click credential-free sandbox populated with **15 days of realistic workforce data** (75 attendances, 585 screenshots, 660 activity logs) across 5 diverse roles.

* **Super Admin Portal**: Click **"Super Admin"** on the login page (or use `admin@demo.com` / `demo123`).
* **Employee Workspace**: Click **"Employee Portal"** on the login page (or use `alex.rivers@demo.com` / `demo123`).
* **Windows Desktop Agent (.exe)**: Log in with any demo employee account inside the desktop app to stream your actual screen & keystrokes live into the dashboard!

---

## 🎯 System Architecture & Ecosystem

```
┌────────────────────────────────────────────────────────┐
│             Desktop Agent (.exe) (Electron 31)         │
│  • Low-level Win32 API Hooks (Koffi C++ FFI)           │
│  • Keystroke & Mouse input frequency sampling          │
│  • HD Multi-screen capture & watermarking              │
│  • Offline SQLite queue with automatic retry buffer    │
└───────────────────────────┬────────────────────────────┘
                            │ REST Telemetry & Screenshots
                            ▼
┌────────────────────────────────────────────────────────┐
│           Cloud Backend API (Node.js & Express)        │
│  • Ingests telemetry bursts & process tracking         │
│  • Attendance session state machine (clock-in/pause)   │
│  • Real-time WebSocket broadcasting (Socket.io)        │
│  • PostgreSQL database managed via Prisma ORM          │
└───────────────────────────┬────────────────────────────┘
                            │ Real-Time Sync & WebSocket Events
                            ▼
┌────────────────────────────────────────────────────────┐
│           Web Management Suite (React & Tailwind)      │
│  • Super Admin: Live grid, 24h timeline, screenshots   │
│  • Employee Workspace: 5-employee switcher & tracker   │
│  • Live tracking simulator (Start / Break / Stop)      │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🛡️ Super Admin Management Console
* **Real-Time Presence & Live Monitor**: See which employees are currently active, idle (>3 mins), on break, or offline with instant WebSocket indicators.
* **15-Day Productivity Curves**: Aggregate workforce trends, active focus percentages, and daily work vs. idle break hours.
* **HD Screenshot Inspection**: Time-indexed screenshots captured at regular intervals, complete with active window title, application name, and exact 10-minute keystroke/click activity percentage.
* **24-Hour Timeline & Activity Heatmaps**: Granular breakdown of continuous working blocks, lunch breaks, and idle detection.
* **Application & Domain Analytics**: Automatic categorization of software (Development, Communication, Productivity, Entertainment) with time-spent breakdowns.
* **Detailed Timesheets**: Exportable attendance audit logs with total active time, manual pauses, and computed productivity scores.

### 2. 👤 Employee Personal Workspace
* **5-Employee Profile Switcher**: Recruiter-friendly switcher to instantly inspect 15 days of work data across **Alex Rivers** (Frontend), **Maya Patel** (Backend), **Rohan Sharma** (DevOps), **Emily Watson** (Product Design), and **Carlos Mendez** (QA).
* **Interactive Tracking Simulator**: Test the tracking engine directly inside the browser using **"Start Work"**, **"Take Break"**, and **"Stop Work"** interactive timer controls.
* **Personal Timesheet & Screenshot History**: Self-inspection view showing attendance records and screen logs.
* **YouTube & Web History Audit**: Logged browser sessions with categorized domains.

### 3. 🖥️ Native Windows Desktop Agent (`.exe`)
* **Packaged Installer**: Pre-built Windows NSIS installer (`Improx.Monitoring.System.Setup.1.0.0.exe`, ~76 MB) ready to run on any Windows 10/11 machine.
* **Zero Cloud Configuration**: Pre-configured to securely stream telemetry straight to the live cloud backend.
* **Privacy-Conscious Input Sampling**: Measures frequency of input events (keys/min, clicks/min) without logging sensitive keystroke content or passwords.
* **Offline-First Resilience**: Automatically buffers captured telemetry in a local SQLite database during internet dropouts and synchronizes once reconnected.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, React Router 6, Axios |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Socket.IO, JWT, Multer, Bcrypt |
| **Database** | PostgreSQL (Neon Serverless Cloud Database) |
| **Desktop Agent** | Electron 31, TypeScript, Koffi (C++ Win32 API FFI), Screenshot-Desktop, Electron Builder |
| **Deployment** | Vercel (Frontend SPA), Render (API Server), GitHub Releases (Installer Hosting) |

---

## 💻 Local Development Setup

To run the entire suite locally on your machine:

### 1. Prerequisites
* **Node.js** v18+ & **npm**
* **PostgreSQL** database (local or cloud)

### 2. Clone the Repository
```bash
git clone https://github.com/bankarom/monitoring-system.git
cd monitoring-system
```

### 3. Setup Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### 4. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs locally at `http://localhost:5173`.*

### 5. Setup & Package Desktop Agent
```bash
cd ../desktop-agent
npm install
# To run in dev mode:
npm run dev

# To build the Windows .exe installer:
npm run dist
```
*Builds `Improx Monitoring System Setup 1.0.0.exe` in `desktop-agent/release/`.*

---

## 🔒 Security & Privacy Architecture

* **Stateless Authentication**: JWT tokens with role-based access control (`ADMIN` vs `EMPLOYEE`).
* **Safe Input Telemetry**: Input monitoring only calculates frequency counts per minute—never records keystroke characters or credentials.
* **Secure Cloud Communication**: End-to-end HTTPS/WSS encryption between the desktop agent, cloud backend, and web dashboard.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
