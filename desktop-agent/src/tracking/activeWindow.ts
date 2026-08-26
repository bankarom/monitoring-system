import koffi from 'koffi';
import path from 'path';

let user32: any;
let kernel32: any;
let GetForegroundWindow: any;
let GetWindowTextW: any;
let GetWindowThreadProcessId: any;
let OpenProcess: any;
let QueryFullProcessImageNameW: any;
let CloseHandle: any;

try {
  user32 = koffi.load('user32.dll');
  kernel32 = koffi.load('kernel32.dll');

  GetForegroundWindow = user32.func('intptr_t GetForegroundWindow()');
  GetWindowTextW = user32.func('int GetWindowTextW(intptr_t hWnd, _Out_ uint16_t *lpString, int nMaxCount)');
  GetWindowThreadProcessId = user32.func('uint32_t GetWindowThreadProcessId(intptr_t hWnd, _Out_ uint32_t *lpdwProcessId)');

  OpenProcess = kernel32.func('intptr_t OpenProcess(uint32_t dwDesiredAccess, int bInheritHandle, uint32_t dwProcessId)');
  QueryFullProcessImageNameW = kernel32.func('int QueryFullProcessImageNameW(intptr_t hProcess, uint32_t dwFlags, _Out_ uint16_t *lpExeName, _Inout_ uint32_t *lpdwSize)');
  CloseHandle = kernel32.func('int CloseHandle(intptr_t hObject)');
} catch (e) {
  console.warn('Native Win32 loader warning:', e);
}

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

export async function getActiveWindowInfo(): Promise<ActiveWindowData> {
  if (!GetForegroundWindow) {
    return {
      appName: 'Desktop',
      processName: 'explorer.exe',
      windowTitle: 'Desktop',
      domain: null,
      url: null
    };
  }

  try {
    const hwnd = GetForegroundWindow();
    if (!hwnd || hwnd === 0) {
      return {
        appName: 'Desktop',
        processName: 'explorer.exe',
        windowTitle: 'Desktop',
        domain: null,
        url: null
      };
    }

    // 1. Get Window Title
    const titleBuffer = new Uint16Array(512);
    const titleLen = GetWindowTextW(hwnd, titleBuffer, 512);
    let windowTitle = '';
    if (titleLen > 0) {
      windowTitle = Buffer.from(titleBuffer.buffer, 0, titleLen * 2).toString('utf16le');
    }

    // 2. Get Process ID & Executable Name
    const pidBox = [0];
    GetWindowThreadProcessId(hwnd, pidBox);
    const pid = pidBox[0];

    let processName = 'explorer.exe';
    if (pid > 0) {
      const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
      const hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
      if (hProcess && hProcess !== 0) {
        const pathBuffer = new Uint16Array(1024);
        const sizeBox = [1024];
        const success = QueryFullProcessImageNameW(hProcess, 0, pathBuffer, sizeBox);
        if (success && sizeBox[0] > 0) {
          const fullPath = Buffer.from(pathBuffer.buffer, 0, sizeBox[0] * 2).toString('utf16le');
          processName = path.basename(fullPath).toLowerCase();
        }
        CloseHandle(hProcess);
      }
    }

    // 3. Extract domain if browser
    let domain: string | null = null;
    if (BROWSER_PROCESSES.includes(processName)) {
      domain = extractDomainFromTitle(windowTitle);
    }

    return {
      appName: processName,
      processName,
      windowTitle: windowTitle || processName,
      domain,
      url: null
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