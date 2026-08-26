import screenshot from 'screenshot-desktop';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface CapturedScreenshot {
  filePath: string;
  displayIndex: number;
  takenAt: string;
}

export class ScreenshotEngine {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(
      app ? app.getPath('userData') : path.join(process.env.APPDATA || '.', 'ImproxAgent'),
      'temp_screens'
    );

    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  public async captureAllScreens(): Promise<CapturedScreenshot[]> {
    try {
      const displays = await screenshot.listDisplays();
      const results: CapturedScreenshot[] = [];
      const timestamp = new Date().toISOString();

      for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        const fileName = `screen-${Date.now()}-${i}.jpg`;
        const outputPath = path.join(this.tempDir, fileName);

        const imgBuffer = await screenshot({ screen: display.id, format: 'jpg' });
        fs.writeFileSync(outputPath, imgBuffer);

        results.push({
          filePath: outputPath,
          displayIndex: i,
          takenAt: timestamp
        });
      }

      return results;
    } catch (error) {
      console.error('Screenshot capture failed, falling back to primary display:', error);
      try {
        const fileName = `screen-${Date.now()}-0.jpg`;
        const outputPath = path.join(this.tempDir, fileName);
        const imgBuffer = await screenshot({ format: 'jpg' });
        fs.writeFileSync(outputPath, imgBuffer);

        return [{
          filePath: outputPath,
          displayIndex: 0,
          takenAt: new Date().toISOString()
        }];
      } catch (err2) {
        console.error('Fallback screenshot also failed:', err2);
        return [];
      }
    }
  }

  public cleanupTempFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}