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
  private serverUrl = 'http://200.141.2.53:4000';
  private configFilePath: string;

  private activityBuffer: any[] = [];
  private activeWindowTimer: NodeJS.Timeout | null = null;
  private telemetryTimer: NodeJS.Timeout | null = null;
  private screenshotTimer: NodeJS.Timeout | null = null;

  private screenshotIntervalMinutes = 10;
  private idleThresholdMinutes = 5;
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
      }
    } catch (e) {}
  }

  private saveConfig() {
    try {
      const data = {
        serverUrl: this.serverUrl,
        user: this.currentUser,
        token: (this.syncService as any).token,
        screenshotInterval: this.screenshotIntervalMinutes
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

      if (this.currentUser && (this.syncService as any).token) {
        this.startTracking();
      } else {
        this.createLoginWindow();
      }
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
      width: 400,
      height: 520,
      frame: false,
      resizable: false,
      maximizable: false,
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
    const icon = nativeImage.createFromBuffer(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA7SURBVDhPY/wPBAxUAIwMDAwM/4GYgUr8n4GB4T+yHA4DqBrQ5fAYQNWALofHAKoGdDk8BlA1oMvhMQAAj4sN6K7bL5gAAAAASUVORK5CYII=',
        'base64'
      )
    );

    this.tray = new Tray(icon);
    this.tray.setToolTip('Improx Monitoring Agent');
    this.updateTrayMenu();

    this.tray.on('double-click', () => {
      if (!this.currentUser) {
        this.createLoginWindow();
      }
    });
  }

  private updateTrayMenu() {
    if (!this.tray) return;

    const employeeName = this.currentUser ? this.currentUser.name : 'Not Logged In';
    const statusText = !this.currentUser
      ? 'Offline'
      : this.isTracking
      ? this.lastSample?.isIdle
        ? '🟡 Away (Idle)'
        : '🟢 Tracking (Active)'
      : '🔴 Paused';

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Improx Monitoring v1.0', enabled: false },
      { label: 'Employee: ' + employeeName, enabled: false },
      { label: 'Status: ' + statusText, enabled: false },
      { type: 'separator' },
      {
        label: this.isTracking ? 'Pause Tracking' : 'Resume Tracking',
        enabled: !!this.currentUser,
        click: () => {
          if (this.isTracking) this.stopTracking();
          else this.startTracking();
        }
      },
      {
        label: 'Open Login / Settings',
        click: () => this.createLoginWindow()
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
        label: 'Exit Agent',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private setupAutoStart() {
    try {
      app.setLoginItemSettings({
        openAtLogin: true,
        path: process.execPath,
        args: ['--hidden']
      });
    } catch (e) {}
  }

  private setupIpcHandlers() {
    ipcMain.on('window-minimize', () => {
      if (this.mainWindow) this.mainWindow.hide();
    });

    ipcMain.on('window-close', () => {
      if (this.mainWindow) this.mainWindow.hide();
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

        setTimeout(() => {
          if (this.mainWindow) this.mainWindow.hide();
        }, 1200);

        return { success: true, user: data.user };
      } catch (err: any) {
        return { success: false, message: err.response?.data?.message || err.message || 'Login failed' };
      }
    });
  }

  public startTracking() {
    if (this.isTracking) return;
    this.isTracking = true;
    this.updateTrayMenu();

    // 1. Poll Native Tracker every 5 seconds
    this.activeWindowTimer = setInterval(async () => {
      const sample = await this.tracker.getSample();
      this.lastSample = sample;

      this.activityBuffer.push({
        appName: sample.appName,
        processName: sample.processName,
        windowTitle: sample.windowTitle,
        domain: sample.domain,
        url: null,
        durationSeconds: 5,
        mouseClicks: sample.clicks,
        keystrokes: sample.keys,
        isIdle: sample.isIdle,
        recordedAt: new Date().toISOString()
      });

      this.updateTrayMenu();
    }, 5000);

    // 2. Flush telemetry batch every 15-30 seconds
    this.telemetryTimer = setInterval(async () => {
      if (this.activityBuffer.length === 0) return;

      const batch = [...this.activityBuffer];
      this.activityBuffer = [];

      const totalClicks = batch.reduce((sum, item) => sum + item.mouseClicks, 0);
      const totalKeys = batch.reduce((sum, item) => sum + item.keystrokes, 0);
      const totalSecs = batch.reduce((sum, item) => sum + item.durationSeconds, 0) || 1;

      const clicksPerMinute = Math.round((totalClicks / totalSecs) * 60);
      const keysPerMinute = Math.round((totalKeys / totalSecs) * 60);
      const currentStatus = this.lastSample?.isIdle ? 'IDLE' : 'ONLINE';

      await this.syncService.sendActivityBatch(
        batch,
        clicksPerMinute,
        keysPerMinute,
        currentStatus
      );
    }, 15000);

    // 3. Screenshot Capture Interval
    const msInterval = this.screenshotIntervalMinutes * 60 * 1000;
    this.screenshotTimer = setInterval(async () => {
      await this.performScreenshotCapture();
    }, msInterval);

    // Capture first screenshot 3 seconds after connect
    setTimeout(() => {
      this.performScreenshotCapture();
    }, 3000);
  }

  private async performScreenshotCapture() {
    try {
      const screens = await this.screenshotEngine.captureAllScreens();
      const sample = this.lastSample || await this.tracker.getSample();

      for (const screen of screens) {
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
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);
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