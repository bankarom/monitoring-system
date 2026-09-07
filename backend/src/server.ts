import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/environment';
import { socketService } from './services/socketService';
import authRoutes from './routes/authRoutes';
import activityRoutes from './routes/activityRoutes';
import adminRoutes from './routes/adminRoutes';
import employeeRoutes from './routes/employeeRoutes';
import { seedInitialAdmin } from './utils/seed';
import { startHeartbeatSupervisor } from './services/heartbeatService';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload and updates directory exist
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}
const updatesDir = path.join(__dirname, '../updates');
if (!fs.existsSync(updatesDir)) {
  fs.mkdirSync(updatesDir, { recursive: true });
}

// Serve uploaded screenshots, downloads & auto-update manifests statically
app.use('/uploads', express.static(config.uploadDir));
app.use('/downloads', express.static(path.join(__dirname, '../downloads')));
app.use('/updates', express.static(updatesDir));

// Direct Desktop Agent Download Route (Windows .exe)
app.get(['/download/agent', '/api/download/agent', '/download/agent/win'], (req, res) => {
  const possiblePaths = [
    path.join(updatesDir, 'Improx Monitoring System Setup 1.0.0.exe'),
    path.join(__dirname, '../../desktop-agent/release/Improx Monitoring System Setup 1.0.0.exe'),
    path.join(updatesDir, 'Improx-Agent-Setup.exe')
  ];

  let foundPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (foundPath) {
    res.download(foundPath, 'Improx-Agent-Setup.exe');
  } else {
    res.status(404).json({ error: 'Windows Agent installer binary not found on server.' });
  }
});

// Direct Desktop Agent Download Route (macOS .dmg)
app.get(['/download/agent/mac', '/api/download/agent/mac'], (req, res) => {
  const possiblePaths = [
    path.join(updatesDir, 'Improx Monitoring System-1.0.0.dmg'),
    path.join(updatesDir, 'Improx-Agent-Setup.dmg'),
    path.join(__dirname, '../../desktop-agent/release/Improx Monitoring System-1.0.0.dmg')
  ];

  let foundPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (foundPath) {
    res.download(foundPath, 'Improx-Agent-Setup.dmg');
  } else {
    res.status(404).json({ error: 'macOS Agent installer binary (.dmg) not found on server.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Improx Monitoring System API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

// Initialize WebSockets
socketService.initialize(server, config.corsOrigin);

// Start server
server.listen(config.port, async () => {
  console.log('====================================================');
  console.log('🚀 IMPROX MONITORING SYSTEM BACKEND ACTIVE');
  console.log('📡 Server listening on Port: ' + config.port);
  console.log('🌐 Environment: ' + config.nodeEnv);
  console.log('💾 Uploads Directory: ' + config.uploadDir);
  console.log('====================================================');

  await seedInitialAdmin();
  startHeartbeatSupervisor();
});

export { app, server };