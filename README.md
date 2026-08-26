# 🚀 Improx Monitoring System

Commercial-grade, proprietary Employee Monitoring & Productivity Platform built from scratch for **Improx Group**.

## 🏗️ Architecture
- **Backend API (Port 4000):** Node.js + Express (TypeScript) + Socket.io + Prisma ORM + PostgreSQL.
- **Admin Dashboard (Port 5000):** React 18 + Vite + Tailwind CSS + Lucide Icons + Recharts.
- **Desktop Agent:** Electron 30+ Client running silently in %APPDATA%\ImproxAgent\ with 10-minute multi-monitor screenshot capture, active-win tracking, friendly app mapper, domain extractor, click/key activity counters, 5-minute intelligent idle detection, offline SQLite queue, and auto clock-in/out.

## 📁 Repository Structure
- ackend/ - API, Prisma ORM, WebSockets, Multipart Screenshot Storage, Analytics, Export Engine.
- desktop-agent/ - Electron 30+ client with System Tray, Win32 trackers, Screenshot engine, and SQLite queue.
- rontend/ - Modern Admin Web Dashboard with live real-time grid, 24-hr timeline, and screenshot gallery.
- deploy/ - PM2 and Nginx configs for VPS deployment.
