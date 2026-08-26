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
    this.tempDir = app ? path.join(app.getPath('userData'), 'screenshots_cache') : path.join(process.env.APPDATA || '.', 'ImproxAgent', 'screenshots_cache');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async captureAllScreens(): Promise<ScreenCaptureResult[]> {
    const results: ScreenCaptureResult[] = [];
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      const now = new Date().toISOString();
      let index = 0;

      for (const source of sources) {
        const jpegBuffer = source.thumbnail.toJPEG(80);
        if (jpegBuffer && jpegBuffer.length > 100) {
          const filename = `screen_${Date.now()}_${index}.jpg`;
          const filePath = path.join(this.tempDir, filename);
          fs.writeFileSync(filePath, jpegBuffer);

          results.push({
            filePath,
            displayIndex: index,
            takenAt: now
          });
        }
        index++;
      }
    } catch (error) {
      console.error('ScreenshotEngine capture error:', error);
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