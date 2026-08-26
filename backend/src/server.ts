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
import { seedInitialAdmin } from './utils/seed';

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

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Serve uploaded screenshots statically
app.use('/uploads', express.static(config.uploadDir));

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
});

export { app, server };