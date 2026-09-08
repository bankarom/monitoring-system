# 📋 Improx Monitoring System - Handover & Maintenance Guide

This document contains complete technical, operational, and deployment instructions for taking over and maintaining the **Improx Monitoring System**.

---

## 🏗️ Architecture & Server Information

The system consists of 3 primary components:
1. **Super Admin Web Dashboard** (React 18 + Vite + Tailwind CSS)
   - Served via Nginx reverse proxy on port 80: `http://200.141.2.53`
2. **Backend API & WebSockets** (Node.js + Express + Prisma ORM + PostgreSQL)
   - Running via PM2 process manager on port 4000: `http://200.141.2.53:4000`
3. **Desktop Agent Client** (Electron 30+ Win32/macOS Native Agent)
   - Installed on employee computers. Connects directly to `http://200.141.2.53:4000`.

> [!IMPORTANT]
> The server runs **independently 24/7 on Hostinger VPS**. It is **NOT** dependent on any local developer laptop.

---

## 🔑 Access & Credentials Checklist

### 1. Hostinger VPS (Production Server)
- **VPS IP:** `200.141.2.53`
- **SSH Connection:** `ssh root@200.141.2.53`
- **Application Path on Server:** `/root/improx-monitor`

### 2. Super Admin Web Dashboard
- **URL:** `http://200.141.2.53`
- **Default Super Admin Email:** `admin@improx.com`
- **Default Super Admin Password:** `Admin@123456`

### 3. Source Code (GitHub Repository)
- **Repository URL:** `https://github.com/bankarom/monitoring-system.git`
- Ensure developer permissions or repository ownership is transferred to the company GitHub account.

---

## 📦 Agent Installers for Employees

### Windows (`.exe`)
- Path in repository: `desktop-agent/release/Improx Monitoring System Setup 1.0.0.exe`
- Hosted downloadable URL on server: `http://200.141.2.53:4000/updates/Improx Monitoring System Setup 1.0.0.exe`

### macOS (`.dmg`)
- Automatically built via GitHub Actions workflow (`.github/workflows/build-agent.yml`).
- Available under GitHub Repository **Actions** / **Releases** tab.

---

## 🛠️ How to Maintain & Update the Code

### Local Development Setup
1. Clone repository:
   ```bash
   git clone https://github.com/bankarom/monitoring-system.git
   cd monitoring-system
   ```
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ../desktop-agent && npm install
   ```

### Deploying Updates to Hostinger VPS
Whenever backend or frontend code changes are pushed to GitHub `main` branch:
1. Log into VPS via SSH:
   ```bash
   ssh root@200.141.2.53
   ```
2. Pull latest code and run deployment script:
   ```bash
   cd /root/improx-monitor
   git pull origin main
   bash deploy/setup-vps.sh
   ```

### Building a New Desktop Agent Binary (`.exe`)
If desktop agent code is modified:
```bash
cd desktop-agent
npm run build:win
```
The new installer will be created in `desktop-agent/release/`. Copy this file to `backend/updates/` so employees get automatic auto-updates.

---

## 📞 Troubleshooting & Useful Commands on VPS

- **Check Backend Logs:** `pm2 logs improx-backend`
- **Restart Server Services:** `pm2 restart all`
- **Check Nginx Proxy:** `systemctl status nginx`
- **Check Database:** `sudo -u postgres psql -d improx_monitor`
