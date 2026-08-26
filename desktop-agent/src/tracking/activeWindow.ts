import activeWin from 'active-win';

export interface ActiveWindowData {
  appName: string;
  processName: string;
  windowTitle: string;
  domain: string | null;
  url: string | null;
}

const BROWSER_PROCESSES = ['chrome.exe', 'msedge.exe', 'firefox.exe', 'brave.exe', 'opera.exe'];

export function extractDomainFromTitle(title: string): string | null {
  if (!title) return null;

  // Regex patterns to capture domain names from browser window titles
  const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/;
  const match = title.match(domainPattern);
  if (match) {
    return match[1].toLowerCase();
  }

  // Popular web service titles in browsers
  const lower = title.toLowerCase();
  if (lower.includes('github')) return 'github.com';
  if (lower.includes('youtube')) return 'youtube.com';
  if (lower.includes('gmail') || lower.includes('google mail')) return 'mail.google.com';
  if (lower.includes('google drive')) return 'drive.google.com';
  if (lower.includes('google docs')) return 'docs.google.com';
  if (lower.includes('google sheets')) return 'sheets.google.com';
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

export async function getActiveWindowInfo(): Promise<ActiveWindowData> {
  try {
    const window = await activeWin();
    if (!window) {
      return {
        appName: 'Desktop',
        processName: 'explorer.exe',
        windowTitle: 'Desktop',
        domain: null,
        url: null
      };
    }

    const processName = (window.owner?.name || '').toLowerCase();
    const title = window.title || '';
    let domain: string | null = null;

    if (BROWSER_PROCESSES.includes(processName) || (window as any).url) {
      domain = (window as any).url ? extractDomainFromTitle((window as any).url) : extractDomainFromTitle(title);
    }

    return {
      appName: window.owner?.name || 'Unknown Process',
      processName,
      windowTitle: title,
      domain,
      url: (window as any).url || null
    };
  } catch (error) {
    return {
      appName: 'Desktop',
      processName: 'explorer.exe',
      windowTitle: 'Desktop',
      domain: null,
      url: null
    };
  }
}