import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, powerMonitor } from 'electron';
import path from 'path';
import fs from 'fs';
import { OfflineQueue } from '../storage/offlineQueue';
import { SyncService } from '../api/syncService';
import { ScreenshotEngine } from '../tracking/screenshotEngine';
import { InputTracker } from '../tracking/inputTracker';
import { getActiveWindowInfo } from '../tracking/activeWindow';

class AgentApplication {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private offlineQueue: OfflineQueue;
  private syncService: SyncService;
  private screenshotEngine: ScreenshotEngine;
  private inputTracker: InputTracker;

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

  constructor() {
    this.offlineQueue = new OfflineQueue();
    this.syncService = new SyncService(this.serverUrl, this.offlineQueue);
    this.screenshotEngine = new ScreenshotEngine();
    this.inputTracker = new InputTracker(this.idleThresholdMinutes);

    const userDataPath = app.getPath('userData');
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
    // Single instance lock to prevent duplicate tray agents
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

    // Graceful clock-out tripwires
    app.on('before-quit', async (e) => {
      if (this.isTracking) {
        await this.syncService.logout().catch(() => {});
      }
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
      width: 380,
      height: 480,
      frame: false,
      resizable: false,
      maximizable: false,
      backgroundColor: '#020617',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.mainWindow.loadFile(path.join(__dirname, '../ui/login.html'));

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private createTray() {
    // Create lightweight 16x16 tray icon
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
      ? this.inputTracker.checkIdleState()
        ? '🟡 Away (Idle)'
        : '🟢 Tracking (Active)'
      : '🔴 Paused';

    const contextMenu = Menu.buildFromTemplate([
      { label: `Improx Monitoring v1.0`, enabled: false },
      { label: `Employee: ${employeeName}`, enabled: false },
      { label: `Status: ${statusText}`, enabled: false },
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
          this.inputTracker.setIdleThreshold(this.idleThresholdMinutes);
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

    // 1. Poll Active Window every 5 seconds
    this.activeWindowTimer = setInterval(async () => {
      const windowInfo = await getActiveWindowInfo();
      const isIdle = this.inputTracker.checkIdleState();

      this.activityBuffer.push({
        appName: windowInfo.appName,
        processName: windowInfo.processName,
        windowTitle: windowInfo.windowTitle,
        domain: windowInfo.domain,
        url: windowInfo.url,
        durationSeconds: 5,
        mouseClicks: 0,
        keystrokes: 0,
        isIdle,
        recordedAt: new Date().toISOString()
      });

      this.updateTrayMenu();
    }, 5000);

    // 2. Batch Upload Telemetry every 30 seconds
    this.telemetryTimer = setInterval(async () => {
      if (this.activityBuffer.length === 0) return;

      const metrics = this.inputTracker.getAndResetMetrics(30);
      const batch = [...this.activityBuffer];
      this.activityBuffer = [];

      const currentStatus = metrics.isIdle ? 'IDLE' : 'ONLINE';
      await this.syncService.sendActivityBatch(
        batch,
        metrics.clicksPerMinute,
        metrics.keysPerMinute,
        currentStatus
      );
    }, 30000);

    // 3. Multi-Monitor Screenshot Capture every N minutes (default 10)
    const msInterval = this.screenshotIntervalMinutes * 60 * 1000;
    this.screenshotTimer = setInterval(async () => {
      await this.performScreenshotCapture();
    }, msInterval);

    // Trigger initial screenshot capture upon starting tracking
    setTimeout(() => {
      this.performScreenshotCapture();
    }, 5000);
  }

  private async performScreenshotCapture() {
    const screens = await this.screenshotEngine.captureAllScreens();
    const windowInfo = await getActiveWindowInfo();
    const isIdle = this.inputTracker.checkIdleState();

    for (const screen of screens) {
      await this.syncService.uploadScreenshot(screen.filePath, {
        displayIndex: screen.displayIndex,
        appName: windowInfo.appName,
        windowTitle: windowInfo.windowTitle,
        isIdle,
        takenAt: screen.takenAt
      });
      this.screenshotEngine.cleanupTempFile(screen.filePath);
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