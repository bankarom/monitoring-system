import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface TrackerSample {
  appName: string;
  processName: string;
  windowTitle: string;
  domain: string | null;
  clicks: number;
  keys: number;
  isIdle: boolean;
}

const BROWSER_PROCESSES = ['chrome.exe', 'msedge.exe', 'firefox.exe', 'brave.exe', 'opera.exe'];

export function extractDomainFromTitle(title: string): string | null {
  if (!title) return null;

  const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/;
  const match = title.match(domainPattern);
  if (match) {
    return match[1].toLowerCase();
  }

  const lower = title.toLowerCase();
  if (lower.includes('github')) return 'github.com';
  if (lower.includes('youtube')) return 'youtube.com';
  if (lower.includes('gmail') || lower.includes('google mail')) return 'mail.google.com';
  if (lower.includes('google drive')) return 'drive.google.com';
  if (lower.includes('google docs')) return 'docs.google.com';
  if (lower.includes('google sheets')) return 'sheets.google.com';
  if (lower.includes('google search') || lower.includes('google')) return 'google.com';
  if (lower.includes('whatsapp')) return 'web.whatsapp.com';
  if (lower.includes('slack')) return 'slack.com';
  if (lower.includes('jira')) return 'jira.atlassian.net';
  if (lower.includes('notion')) return 'notion.so';
  if (lower.includes('figma')) return 'figma.com';
  if (lower.includes('stack overflow')) return 'stackoverflow.com';
  if (lower.includes('linkedin')) return 'linkedin.com';
  if (lower.includes('chatgpt') || lower.includes('openai')) return 'chatgpt.com';

  return null;
}

export class NativeTrackerSupervisor {
  private child: ChildProcess | null = null;
  private pendingResolves: Array<(sample: TrackerSample) => void> = [];
  private idleThresholdSeconds = 300;

  constructor(idleThresholdMinutes = 5) {
    this.idleThresholdSeconds = idleThresholdMinutes * 60;
    this.spawnTrackerProcess();
  }

  private findTrackerBinary(): string {
    const candidates = [
      path.join(__dirname, '../bin/tracker_engine.exe'),
      path.join(__dirname, '../../bin/tracker_engine.exe'),
      path.join(app ? app.getAppPath() : '.', 'dist/bin/tracker_engine.exe'),
      path.join(app ? app.getAppPath() : '.', 'bin/tracker_engine.exe'),
      path.join(process.resourcesPath || '.', 'bin/tracker_engine.exe')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0];
  }

  private spawnTrackerProcess() {
    const binPath = this.findTrackerBinary();
    if (!fs.existsSync(binPath)) {
      console.warn('tracker_engine.exe not found at:', binPath);
      return;
    }

    try {
      this.child = spawn(binPath, [], {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let lineBuffer = '';
      this.child.stdout?.on('data', (chunk) => {
        lineBuffer += chunk.toString();
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
              const data = JSON.parse(trimmed);
              const processName = data.processName || 'explorer.exe';
              const windowTitle = data.windowTitle || 'Desktop';
              let domain: string | null = null;

              if (BROWSER_PROCESSES.includes(processName.toLowerCase())) {
                domain = extractDomainFromTitle(windowTitle);
              }

              const sample: TrackerSample = {
                appName: processName,
                processName,
                windowTitle,
                domain,
                clicks: data.clicks || 0,
                keys: data.keys || 0,
                isIdle: (data.idleSeconds || 0) >= this.idleThresholdSeconds
              };

              const resolver = this.pendingResolves.shift();
              if (resolver) resolver(sample);
            } catch (e) {}
          }
        }
      });

      this.child.on('exit', () => {
        this.child = null;
        setTimeout(() => this.spawnTrackerProcess(), 2000);
      });
    } catch (e) {
      console.warn('Failed to spawn tracker process:', e);
    }
  }

  public setIdleThreshold(minutes: number) {
    this.idleThresholdSeconds = minutes * 60;
  }

  public async getSample(): Promise<TrackerSample> {
    if (!this.child || !this.child.stdin) {
      return {
        appName: 'Desktop',
        processName: 'explorer.exe',
        windowTitle: 'Desktop',
        domain: null,
        clicks: 0,
        keys: 0,
        isIdle: false
      };
    }

    return new Promise((resolve) => {
      this.pendingResolves.push(resolve);
      this.child?.stdin?.write('sample\n');

      setTimeout(() => {
        const idx = this.pendingResolves.indexOf(resolve);
        if (idx !== -1) {
          this.pendingResolves.splice(idx, 1);
          resolve({
            appName: 'Desktop',
            processName: 'explorer.exe',
            windowTitle: 'Desktop',
            domain: null,
            clicks: 0,
            keys: 0,
            isIdle: false
          });
        }
      }, 1000);
    });
  }

  public destroy() {
    if (this.child) {
      try {
        this.child.stdin?.write('exit\n');
        this.child.kill();
      } catch (e) {}
    }
  }
}