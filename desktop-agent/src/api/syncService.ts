import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { OfflineQueue } from '../storage/offlineQueue';

export class SyncService {
  private serverUrl: string;
  private token: string | null = null;
  private offlineQueue: OfflineQueue;

  constructor(serverUrl: string, offlineQueue: OfflineQueue) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.offlineQueue = offlineQueue;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public setServerUrl(url: string) {
    this.serverUrl = url.replace(/\/$/, '');
  }

  public async login(email: string, password: string) {
    const response = await axios.post(`${this.serverUrl}/api/auth/login`, { email, password });
    this.token = response.data.token;
    return response.data;
  }

  public async logout() {
    if (!this.token) return;
    try {
      await axios.post(
        `${this.serverUrl}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${this.token}` } }
      );
    } catch (e) {
      // Ignore network errors during exit
    }
  }

  public async sendActivityBatch(
    activities: any[],
    clicksPerMinute: number,
    keysPerMinute: number,
    currentStatus: 'ONLINE' | 'IDLE'
  ): Promise<boolean> {
    if (!this.token || activities.length === 0) return false;

    try {
      await axios.post(
        `${this.serverUrl}/api/activity/upload`,
        {
          activities,
          clicksPerMinute,
          keysPerMinute,
          currentStatus
        },
        {
          headers: { Authorization: `Bearer ${this.token}` },
          timeout: 10000
        }
      );

      // Successfully synced, try flushing any offline queued items
      this.flushOfflineQueue().catch(() => {});
      return true;
    } catch (error) {
      console.warn('Network offline or server error, enqueuing activities locally:', (error as any).message);
      for (const item of activities) {
        await this.offlineQueue.enqueueActivity(item).catch(() => {});
      }
      return false;
    }
  }

  public async uploadScreenshot(filePath: string, metadata: any): Promise<boolean> {
    if (!this.token || !fs.existsSync(filePath)) return false;

    try {
      const form = new FormData();
      form.append('image', fs.createReadStream(filePath));
      form.append('displayIndex', String(metadata.displayIndex || 0));
      form.append('appName', metadata.appName || '');
      form.append('windowTitle', metadata.windowTitle || '');
      form.append('isIdle', String(metadata.isIdle || false));
      form.append('takenAt', metadata.takenAt || new Date().toISOString());

      await axios.post(`${this.serverUrl}/api/activity/screenshots/upload`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.token}`
        },
        timeout: 20000
      });

      return true;
    } catch (error) {
      console.warn('Screenshot upload failed, enqueuing to local storage:', (error as any).message);
      await this.offlineQueue.enqueueScreenshot(filePath, metadata).catch(() => {});
      return false;
    }
  }

  public async flushOfflineQueue() {
    if (!this.token) return;

    // Flush pending activities
    const pendingActivities = await this.offlineQueue.getPendingActivities(50);
    if (pendingActivities.length > 0) {
      try {
        const batch = pendingActivities.map((p) => p.data);
        await axios.post(
          `${this.serverUrl}/api/activity/upload`,
          { activities: batch },
          { headers: { Authorization: `Bearer ${this.token}` }, timeout: 15000 }
        );

        const ids = pendingActivities.map((p) => p.id);
        await this.offlineQueue.removeActivities(ids);
      } catch (err) {
        // Stop flushing if still offline
        return;
      }
    }

    // Flush pending screenshots
    const pendingScreens = await this.offlineQueue.getPendingScreenshots(5);
    for (const screen of pendingScreens) {
      if (fs.existsSync(screen.imagePath)) {
        try {
          const form = new FormData();
          form.append('image', fs.createReadStream(screen.imagePath));
          form.append('displayIndex', String(screen.metadata.displayIndex || 0));
          form.append('appName', screen.metadata.appName || '');
          form.append('windowTitle', screen.metadata.windowTitle || '');
          form.append('isIdle', String(screen.metadata.isIdle || false));
          form.append('takenAt', screen.metadata.takenAt);

          await axios.post(`${this.serverUrl}/api/activity/screenshots/upload`, form, {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${this.token}`
            },
            timeout: 20000
          });

          await this.offlineQueue.removeScreenshots([screen.id]);
          try {
            fs.unlinkSync(screen.imagePath);
          } catch (e) {}
        } catch (err) {
          break;
        }
      } else {
        await this.offlineQueue.removeScreenshots([screen.id]);
      }
    }
  }
}