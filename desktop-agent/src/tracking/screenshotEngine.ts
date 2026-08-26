import screenshot from 'screenshot-desktop';
import { desktopCapturer, app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface ScreenCaptureResult {
  filePath: string;
  displayIndex: number;
  takenAt: string;
}

export class ScreenshotEngine {
  private tempDir: string;

  constructor() {
    const base = app ? app.getPath('userData') : path.join(process.env.APPDATA || '.', 'ImproxAgent');
    this.tempDir = path.join(base, 'screenshots_cache');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async captureAllScreens(): Promise<ScreenCaptureResult[]> {
    const results: ScreenCaptureResult[] = [];
    const now = new Date().toISOString();

    // 1. Try screenshot-desktop
    try {
      const displays = await screenshot.all({ format: 'jpg' });
      if (displays && displays.length > 0) {
        displays.forEach((buffer: Buffer, index: number) => {
          if (buffer && buffer.length > 100) {
            const filename = `screen_${Date.now()}_${index}.jpg`;
            const filePath = path.join(this.tempDir, filename);
            fs.writeFileSync(filePath, buffer);
            results.push({ filePath, displayIndex: index, takenAt: now });
          }
        });
      }
    } catch (e) {
      console.warn('screenshot-desktop all failed, trying single display/desktopCapturer:', e);
    }

    if (results.length > 0) return results;

    // 2. Fallback to desktopCapturer
    try {
      if (desktopCapturer) {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: { width: 1920, height: 1080 }
        });
        sources.forEach((source, index) => {
          const buffer = source.thumbnail.toJPEG(80);
          if (buffer && buffer.length > 100) {
            const filename = `screen_${Date.now()}_${index}.jpg`;
            const filePath = path.join(this.tempDir, filename);
            fs.writeFileSync(filePath, buffer);
            results.push({ filePath, displayIndex: index, takenAt: now });
          }
        });
      }
    } catch (e) {
      console.warn('desktopCapturer failed:', e);
    }

    return results;
  }

  public cleanupTempFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  }
}