import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class OfflineQueue {
  private db: sqlite3.Database;

  constructor() {
    const userDataPath = app ? app.getPath('userData') : path.join(process.env.APPDATA || '.', 'ImproxAgent');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'improx_offline.db');
    this.db = new sqlite3.Database(dbPath);
    this.initTables();
  }

  private initTables() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      this.db.run(`
        CREATE TABLE IF NOT EXISTS screenshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          imagePath TEXT NOT NULL,
          metadata TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  public enqueueActivity(activity: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO activities (data) VALUES (?)');
      stmt.run(JSON.stringify(activity), (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }

  public getPendingActivities(limit = 100): Promise<{ id: number; data: any }[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, data FROM activities ORDER BY id ASC LIMIT ?', [limit], (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const parsed = rows.map((r) => ({ id: r.id, data: JSON.parse(r.data) }));
          resolve(parsed);
        }
      });
    });
  }

  public removeActivities(ids: number[]): Promise<void> {
    if (ids.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(`DELETE FROM activities WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public enqueueScreenshot(imagePath: string, metadata: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('INSERT INTO screenshots (imagePath, metadata) VALUES (?, ?)');
      stmt.run(imagePath, JSON.stringify(metadata), (err) => {
        if (err) reject(err);
        else resolve();
      });
      stmt.finalize();
    });
  }

  public getPendingScreenshots(limit = 10): Promise<{ id: number; imagePath: string; metadata: any }[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id, imagePath, metadata FROM screenshots ORDER BY id ASC LIMIT ?', [limit], (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const parsed = rows.map((r) => ({
            id: r.id,
            imagePath: r.imagePath,
            metadata: JSON.parse(r.metadata)
          }));
          resolve(parsed);
        }
      });
    });
  }

  public removeScreenshots(ids: number[]): Promise<void> {
    if (ids.length === 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      this.db.run(`DELETE FROM screenshots WHERE id IN (${placeholders})`, ids, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}