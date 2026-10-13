# 🎓 `improX Pro` — Master Knowledge Transfer (KT) & Developer Onboarding Guide

Welcome to **`improX Pro` (Enterprise Work Tracker & Employee Productivity Monitoring System)**.

This comprehensive Knowledge Transfer (KT) document is designed for the incoming software developer, team lead, or administrator taking over the project. It provides everything required to set up a new laptop, link repositories, manage server infrastructure, compile agent executables, and push updates to live employee machines.

---

## 📌 Module 1: Product Overview & Core Architecture

`improX Pro` consists of 3 synchronized applications:

```
┌───────────────────────────────┐
│     Electron Desktop Agent    │  (Runs on employee laptops: Windows / macOS)
│ (Samples inputs, captures HD  │
│ screenshots, syncs offline)   │
└───────────────┬───────────────┘
                │ HTTP REST Telemetry / Uploads
                ▼
┌───────────────────────────────┐
│      Express.js Backend       │  (Node.js + Prisma ORM + PostgreSQL on VPS)
│ (Processes telemetry, stores  │
│ activity logs & screenshots)  │
└───────────────┬───────────────┘
                │ API JSON Queries
                ▼
┌───────────────────────────────┐
│   React Super Admin Dashboard │  (Hosted on VPS: Web portal for HR & Admins)
│ (Live employee grid, activity │
│ heatmaps & screenshot gallery)│
└───────────────────────────────┘
```

### Key Functional Specifications
1. **Activity Formula**: Synchronized across Agent and Admin:
   $$\text{ActivityPercent} = \min\left(100, \text{Math.round}\left(\frac{\text{Keystrokes}}{70} \times 60 + \frac{\text{Mouse Clicks}}{25} \times 40\right)\right)$$
2. **Screenshot Engine**: Takes an instant screenshot 2 seconds after starting work, followed by periodic 10-minute HD captures.
3. **Offline Queue Sync**: Saves logs & screenshots to local SQLite/JSON if Wi-Fi drops, and uploads automatically upon reconnection.
4. **Silent Over-The-Air (OTA) Updates**: Agents periodically poll `http://200.141.2.53/updates/latest.yml` to update silently in the background.

---

## 💻 Module 2: Setting Up a New Developer Laptop

Follow these steps when setting up this codebase on a brand new developer machine:

### 1. Prerequisites
Install the following on your machine:
* **Node.js**: v18.x or v20.x LTS ([nodejs.org](https://nodejs.org))
* **Git**: Latest version ([git-scm.com](https://git-scm.com))
* **VS Code**: Recommended IDE

### 2. Connect Your New GitHub Repository
In the root directory of this project (`Monitoring-system`), run:

```bash
# Link the codebase to your new company/personal GitHub repository:
git remote add origin https://github.com/<YOUR-USERNAME-OR-ORG>/monitoring-system.git
git branch -M main
git push -u origin main
```

### 3. Install All Project Dependencies
Run the install command across all 3 subfolders:

```bash
# 1. Install Root & Backend dependencies
cd backend
npm install
npx prisma db push

# 2. Install Super Admin Dashboard dependencies
cd ../frontend
npm install

# 3. Install Desktop Agent dependencies
cd ../desktop-agent
npm install
```

---

## 🔐 Module 3: Master Credentials & Infrastructure Access

> **Security Note**: Keep these credentials secure. They provide full administrative control over the live server and database.

### A. Hostinger VPS Server SSH Access
* **Server IPv4:** `200.141.2.53`
* **Hostname:** `srv1847902.hstgr.cloud`
* **Operating System:** Ubuntu 24.04 LTS
* **SSH Command:** `ssh root@200.141.2.53`
* **SSH Default Port:** `22`
* **Password Reset / Console:** Access via [Hostinger hPanel](https://hpanel.hostinger.com) -> VPS `srv1847902.hstgr.cloud` -> **Reset password**.

### B. Super Admin Web Portal
* **Dashboard URL:** `http://200.141.2.53`
* **Super Admin Email:** `monitoradmin@improxgroup.com1234`
* **Super Admin Password:** `#admin0089000#`
* **Role:** `ADMIN`

### C. Backend Configuration (`backend/.env`)
* **API Port:** `4000`
* **Database Connection:** `postgresql://postgres:postgres@localhost:5432/improx_monitor?schema=public`
* **JWT Secret Key:** `improx_ultra_secure_jwt_secret_2026_production_key`
* **Uploads Directory:** `./uploads`

---

## 🛠️ Module 4: Server Management & PM2 Commands

To manage the backend and frontend services running on the live Ubuntu VPS (`200.141.2.53`):

1. **SSH into the server**:
   ```bash
   ssh root@200.141.2.53
   ```
2. **Check Running Processes**:
   ```bash
   pm2 status
   ```
3. **View Real-Time Backend Logs**:
   ```bash
   pm2 logs improx-backend
   ```
4. **Restart Backend Service**:
   ```bash
   pm2 restart improx-backend
   ```
5. **Database Migration / Schema Update**:
   ```bash
   cd /var/www/monitoring-system/backend
   npx prisma db push
   ```

---

## 📦 Module 5: Desktop Agent Building & OTA Deployment

### Packaging Windows Executable (`.exe`)
```bash
cd desktop-agent
npm run build
```
The compiled installer is output to: `desktop-agent/release/Improx Monitoring System Setup 1.0.0.exe`.

### Packaging macOS Installer (`.dmg`)
When code is pushed to your GitHub repository `main` branch, the GitHub Action workflow (`.github/workflows/build-agent.yml`) automatically builds the macOS `.dmg` installer and publishes it under GitHub Releases.

### Deploying Background OTA Updates to All 30 Employees
To release a new version (`v1.1.0`) to all employees without forcing them to re-download manually:
1. Increment the version number in `desktop-agent/package.json` to `1.1.0`.
2. Compile the Windows binary: `npm run build`.
3. Upload the generated `.exe` file (`Improx-Agent-Setup-1.1.0.exe`) and updated `latest.yml` manifest to the VPS server directory `/var/www/updates/`.
4. Employee agents running on their laptops will detect `v1.1.0`, download it in the background, and update automatically.

---

## 🚀 Module 6: Pending System Upgrade Plan

The upcoming system update includes these agreed enhancements ready for execution:

1. **Continuous Night Shifts**: Remove 12:00 AM hard resets so shifts from 6:30 PM to 3:30 AM track as a single unified session.
2. **Simplified 3-Mode Selector**: Direct selection between 💼 **Work**, ☕ **Break**, and 🤝 **Meeting** on the Desktop Agent.
3. **Top Live Header**: Real-time stats header showing Worked Hours, Break Hours, and Activity %.
4. **Laptop Lid Close Attribution**: Auto-calculating sleep duration and attributing it to Break time.
5. **Low-Spec Hardware Throttling**: Debounced input hooks reducing CPU usage to < 1% on 7th–9th Gen Intel laptops.

---

> **Handoff Complete**: This document is saved in your project repository as [PROJECT_HANDOFF_AND_KT.md](file:///c:/Users/om%20bankar/Desktop/Monitoring-system/PROJECT_HANDOFF_AND_KT.md).
