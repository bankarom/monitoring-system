import screenshot from 'screenshot-desktop';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

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
    try {
      const displays = await screenshot.all({ format: 'jpg' });
      const now = new Date().toISOString();

      displays.forEach((buffer: Buffer, index: number) => {
        if (buffer && buffer.length > 100) {
          const filename = `screen_${Date.now()}_${index}.jpg`;
          const filePath = path.join(this.tempDir, filename);
          fs.writeFileSync(filePath, buffer);

          results.push({
            filePath,
            displayIndex: index,
            takenAt: now
          });
        }
      });
    } catch (error) {
      try {
        const singleBuf = await screenshot({ format: 'jpg' });
        const filePath = path.join(this.tempDir, `screen_${Date.now()}_0.jpg`);
        fs.writeFileSync(filePath, singleBuf);
        results.push({
          filePath,
          displayIndex: 0,
          takenAt: new Date().toISOString()
        });
      } catch (e) {}
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