import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor } from 'electron';
import path from 'path';
import fs from 'fs';
import { OfflineQueue } from '../storage/offlineQueue';
import { SyncService } from '../api/syncService';
import { ScreenshotEngine } from '../tracking/screenshotEngine';
import { NativeTrackerSupervisor, TrackerSample } from '../tracking/activeWindow';

class AgentApplication {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private offlineQueue: OfflineQueue;
  private syncService: SyncService;
  private screenshotEngine: ScreenshotEngine;
  private tracker: NativeTrackerSupervisor;

  private isTracking = false;
  private currentUser: any = null;
  private serverUrl = 'http://200.141.2.53';
  private configFilePath: string;

  private activityBuffer: any[] = [];
  private activeWindowTimer: NodeJS.Timeout | null = null;
  private screenshotTimer: NodeJS.Timeout | null = null;

  private screenshotIntervalMinutes = 10;
  private idleThresholdMinutes = 3; // 3 minutes idle/break threshold
  private sampleDurationSeconds = 20; // 20 seconds sample duration (3 logs per min)
  private lastSample: TrackerSample | null = null;

  constructor() {
    this.offlineQueue = new OfflineQueue();
    this.syncService = new SyncService(this.serverUrl, this.offlineQueue);
    this.screenshotEngine = new ScreenshotEngine();
    this.tracker = new NativeTrackerSupervisor(this.idleThresholdMinutes);

    const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || '.', 'ImproxAgent');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.configFilePath = path.join(userDataPath, 'agent_config.json');

    this.loadSavedConfig();
  }

  private loadSavedConfig() {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const raw = fs.readFileSync(this.configFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.serverUrl) this.serverUrl = data.serverUrl;
        if (data.token) {
          this.syncService.setToken(data.token);
          this.currentUser = data.user;
        }
        if (data.screenshotInterval) this.screenshotIntervalMinutes = data.screenshotInterval;
        if (data.idleThreshold) this.idleThresholdMinutes = data.idleThreshold;
      }
    } catch (e) {}
  }

  private saveConfig() {
    try {
      const data = {
        serverUrl: this.serverUrl,
        user: this.currentUser,
        token: (this.syncService as any).token,
        screenshotInterval: this.screenshotIntervalMinutes,
        idleThreshold: this.idleThresholdMinutes
      };
      fs.writeFileSync(this.configFilePath, JSON.stringify(data, null, 2));
    } catch (e) {}
  }

  public init() {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      if (this.mainWindow) {
        if (this.mainWindow.isMinimized()) this.mainWindow.restore();
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    app.whenReady().then(() => {
      this.createTray();
      this.setupIpcHandlers();
      this.setupAutoStart();

      // Require explicit employee manual action to start work
      this.createLoginWindow();
    });

    app.on('before-quit', async () => {
      if (this.isTracking) {
        await this.syncService.logout().catch(() => {});
      }
      this.tracker.destroy();
    });

    powerMonitor.on('shutdown', async () => {
      if (this.isTracking) {
        await this.syncService.logout().catch(() => {});
      }
    });

    powerMonitor.on('suspend', async () => {
      if (this.isTracking) {
        await this.syncService.logout().catch(() => {});
      }
    });
  }

  private createLoginWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      return;
    }

    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 620,
      frame: false,
      show: true,
      skipTaskbar: false,
      resizable: true,
      minWidth: 800,
      minHeight: 550,
      backgroundColor: '#020617',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const possiblePaths = [
      path.join(__dirname, '../ui/login.html'),
      path.join(__dirname, '../../src/ui/login.html'),
      path.join(app.getAppPath(), 'dist/ui/login.html'),
      path.join(app.getAppPath(), 'src/ui/login.html')
    ];

    let loaded = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.mainWindow.loadFile(p);
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      this.mainWindow.loadFile(path.join(__dirname, '../ui/login.html'));
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray() {
    const iconCandidates = [
      path.join(__dirname, '../assets/icon.ico'),
      path.join(__dirname, '../../assets/icon.ico'),
      path.join(process.resourcesPath || '.', 'assets/icon.ico'),
      path.join(app ? app.getAppPath() : '.', 'assets/icon.ico')
    ];

    let iconPath = '';
    for (const p of iconCandidates) {
      if (fs.existsSync(p)) {
        iconPath = p;
        break;
      }
    }

    const icon = iconPath
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createFromBuffer(
          Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAxUAIwMDAwM/4GYgUr8n4GB4T+yHA4DqBrQ5fAYQNWALofHAKoGdDk8BlA1oMvhMQAAj4sN6K7bL5gAAAAASUVORK5CYII=',
            'base64'
          )
        );

    this.tray = new Tray(icon);
    this.tray.setToolTip('Improx Monitoring Agent - Running');
    this.updateTrayMenu();

    this.tray.on('double-click', () => {
      this.createLoginWindow();
    });
  }

  private updateTrayMenu() {
    if (!this.tray) return;

    const employeeName = this.currentUser ? this.currentUser.name : 'Not Logged In';
    const statusText = !this.currentUser
      ? 'Offline'
      : this.isTracking
      ? this.lastSample?.isIdle
        ? '🟡 Away (Break / Idle)'
        : '🟢 Tracking (Active)'
      : '🔴 Paused';

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Improx Monitoring v1.0', enabled: false },
      { label: 'Employee: ' + employeeName, enabled: false },
      { label: 'Status: ' + statusText, enabled: false },
      { type: 'separator' },
      {
        label: 'Open Agent Dashboard',
        click: () => this.createLoginWindow()
      },
      {
        label: this.isTracking ? 'Pause Tracking' : 'Resume Tracking',
        enabled: !!this.currentUser,
        click: () => {
          if (this.isTracking) this.pauseTracking('Break');
          else this.resumeTracking();
        }
      },
      { type: 'separator' },
      {
        label: 'Logout',
        enabled: !!this.currentUser,
        click: async () => {
          await this.logout();
        }
      },
      {
        label: 'Clock Out & Exit',
        click: async () => {
          this.isTracking = false;
          if (this.activeWindowTimer) clearInterval(this.activeWindowTimer);
          if (this.screenshotTimer) clearInterval(this.screenshotTimer);
          await this.syncService.clockOut().catch(() => {});
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupAutoStart() {
    try {
      app.setLoginItemSettings({
        openAtLogin: false
      });
    } catch (e) {}
  }

  private isPaused = false;
  private pauseReason = '';
  private pauseComment = '';
  private totalActiveSeconds = 0;
  private totalIdleSeconds = 0;

  public pauseTracking(reason: string, comment?: string) {
    this.isPaused = true;
    this.pauseReason = reason || 'Break';
    this.pauseComment = comment || '';
    this.updateTrayMenu();
    this.notifyUIState();
    console.log(`🟡 Tracking paused: ${this.pauseReason} (${this.pauseComment})`);
  }

  public resumeTracking() {
    this.isPaused = false;
    this.pauseReason = '';
    this.pauseComment = '';
    this.updateTrayMenu();
    this.notifyUIState();
    console.log('🟢 Tracking resumed');
  }

  private formatSeconds(sec: number): string {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    return `${hrs}h ${mins}m`;
  }

  private notifyUIState() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('agent-state-changed', {
        isTracking: this.isTracking,
        isPaused: this.isPaused,
        pauseReason: this.pauseReason,
        pauseComment: this.pauseComment,
        user: this.currentUser,
        activeHoursFormatted: this.formatSeconds(this.totalActiveSeconds),
        idleHoursFormatted: this.formatSeconds(this.totalIdleSeconds)
      });
    }
  }

  private setupIpcHandlers() {
    ipcMain.on('window-minimize', () => {
      if (this.mainWindow) this.mainWindow.hide();
    });

    ipcMain.on('window-close', () => {
      if (this.mainWindow) this.mainWindow.hide();
    });

    ipcMain.handle('clock-out-agent', async () => {
      this.isTracking = false;
      this.isPaused = false;
      if (this.activeWindowTimer) clearInterval(this.activeWindowTimer);
      if (this.screenshotTimer) clearInterval(this.screenshotTimer);
      await this.syncService.clockOut().catch(() => {});
      this.currentUser = null;
      this.syncService.setToken('');
      this.saveConfig();
      this.updateTrayMenu();
      app.quit();
      return { success: true };
    });

    ipcMain.handle('get-my-screenshots', async (evt, date) => {
      return await this.syncService.getMyScreenshots(date);
    });

    ipcMain.handle('get-my-analytics', async (evt, date) => {
      return await this.syncService.getMyAnalytics(date);
    });

    ipcMain.handle('get-agent-state', () => {
      return {
        isTracking: this.isTracking,
        isPaused: this.isPaused,
        pauseReason: this.pauseReason,
        pauseComment: this.pauseComment,
        user: this.currentUser,
        serverUrl: this.serverUrl,
        activeHoursFormatted: this.formatSeconds(this.totalActiveSeconds),
        idleHoursFormatted: this.formatSeconds(this.totalIdleSeconds)
      };
    });

    ipcMain.handle('pause-agent', (event, { reason, comment }) => {
      this.pauseTracking(reason, comment);
      return { success: true, isPaused: true };
    });

    ipcMain.handle('resume-agent', () => {
      this.resumeTracking();
      return { success: true, isPaused: false };
    });

    ipcMain.handle('agent-login', async (event, { serverUrl, email, password }) => {
      try {
        this.serverUrl = serverUrl;
        this.syncService.setServerUrl(serverUrl);
        const data = await this.syncService.login(email, password);

        this.currentUser = data.user;
        if (data.settings?.screenshotInterval) {
          this.screenshotIntervalMinutes = data.settings.screenshotInterval;
        }
        if (data.settings?.idleThreshold) {
          this.idleThresholdMinutes = data.settings.idleThreshold;
          this.tracker.setIdleThreshold(this.idleThresholdMinutes);
        }

        this.saveConfig();
        this.startTracking();

        this.notifyUIState();
        return { success: true, user: data.user };
      } catch (err: any) {
        return { success: false, message: err.response?.data?.message || err.message || 'Login failed' };
      }
    });
  }

  public startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.isPaused = false;
    this.updateTrayMenu();
    this.notifyUIState();
    console.log('🟢 Tracking started for:', this.currentUser?.name);

    // 1. Poll Native Tracker every 20 seconds (3 clean log entries per minute)
    this.activeWindowTimer = setInterval(async () => {
      const sample = await this.tracker.getSample();
      this.lastSample = sample;

      const logItem = {
        appName: sample.appName,
        processName: sample.processName,
        windowTitle: sample.windowTitle,
        domain: sample.domain,
        url: null,
        durationSeconds: this.sampleDurationSeconds,
        mouseClicks: sample.clicks,
        keystrokes: sample.keys,
        isIdle: this.isPaused ? true : sample.isIdle,
        recordedAt: new Date().toISOString()
      };

      const clicksPerMin = this.isPaused ? 0 : Math.round((sample.clicks / this.sampleDurationSeconds) * 60);
      const keysPerMin = this.isPaused ? 0 : Math.round((sample.keys / this.sampleDurationSeconds) * 60);
      const currentStatus = this.isPaused ? 'PAUSED' : (sample.isIdle ? 'IDLE' : 'ONLINE');

      console.log(`📡 [20s Telemetry] App: ${sample.appName} | Status: ${currentStatus} ${this.isPaused ? `(${this.pauseReason})` : ''}`);

      const res = await this.syncService.sendActivityBatch(
        [logItem],
        clicksPerMin,
        keysPerMin,
        currentStatus,
        this.isPaused,
        this.pauseReason,
        this.pauseComment
      );

      if (res.success) {
        if (typeof res.totalActiveSeconds === 'number') this.totalActiveSeconds = res.totalActiveSeconds;
        if (typeof res.totalIdleSeconds === 'number') this.totalIdleSeconds = res.totalIdleSeconds;
      }

      this.updateTrayMenu();
      this.notifyUIState();
    }, this.sampleDurationSeconds * 1000);

    // 2. Screenshot Capture Interval (every 10 minutes)
    const msInterval = this.screenshotIntervalMinutes * 60 * 1000;
    this.screenshotTimer = setInterval(async () => {
      await this.performScreenshotCapture();
    }, msInterval);

    // Initial capture 3 seconds after connect
    setTimeout(() => {
      this.performScreenshotCapture();
    }, 3000);
  }

  private async performScreenshotCapture() {
    if (this.isPaused) {
      console.log('⏸️ Tracking is paused. Skipping screenshot capture.');
      return;
    }
    try {
      console.log('📸 Taking screen capture...');
      const screens = await this.screenshotEngine.captureAllScreens();
      const sample = this.lastSample || await this.tracker.getSample();

      for (const screen of screens) {
        console.log('📤 Uploading screenshot:', screen.filePath);
        await this.syncService.uploadScreenshot(screen.filePath, {
          displayIndex: screen.displayIndex,
          appName: sample.appName,
          windowTitle: sample.windowTitle,
          isIdle: sample.isIdle,
          takenAt: screen.takenAt
        });
        this.screenshotEngine.cleanupTempFile(screen.filePath);
      }
    } catch (e) {
      console.warn('Screenshot capture routine error:', e);
    }
  }

  public stopTracking() {
    this.isTracking = false;
    if (this.activeWindowTimer) clearInterval(this.activeWindowTimer);
    if (this.screenshotTimer) clearInterval(this.screenshotTimer);
    this.updateTrayMenu();
  }

  public async logout() {
    this.stopTracking();
    await this.syncService.logout();
    this.currentUser = null;
    this.syncService.setToken('');
    this.saveConfig();
    this.updateTrayMenu();
    this.createLoginWindow();
  }
}

const agent = new AgentApplication();
agent.init();