export interface ProcessMetadata {
  friendlyName: string;
  category: 'WORK' | 'BROWSING' | 'COMMUNICATION' | 'ENTERTAINMENT' | 'IDLE' | 'OTHER';
}

export const APP_MAPPING: Record<string, ProcessMetadata> = {
  // Browsers
  'chrome.exe': { friendlyName: 'Google Chrome', category: 'BROWSING' },
  'msedge.exe': { friendlyName: 'Microsoft Edge', category: 'BROWSING' },
  'firefox.exe': { friendlyName: 'Mozilla Firefox', category: 'BROWSING' },
  'brave.exe': { friendlyName: 'Brave Browser', category: 'BROWSING' },
  'opera.exe': { friendlyName: 'Opera Browser', category: 'BROWSING' },
  'safari.exe': { friendlyName: 'Apple Safari', category: 'BROWSING' },

  // Development & Work Tools
  'code.exe': { friendlyName: 'Visual Studio Code', category: 'WORK' },
  'devenv.exe': { friendlyName: 'Visual Studio', category: 'WORK' },
  'idea64.exe': { friendlyName: 'IntelliJ IDEA', category: 'WORK' },
  'pycharm64.exe': { friendlyName: 'PyCharm', category: 'WORK' },
  'webstorm64.exe': { friendlyName: 'WebStorm', category: 'WORK' },
  'postman.exe': { friendlyName: 'Postman', category: 'WORK' },
  'dbeaver.exe': { friendlyName: 'DBeaver', category: 'WORK' },
  'pgadmin4.exe': { friendlyName: 'pgAdmin', category: 'WORK' },
  'windowsterminal.exe': { friendlyName: 'Windows Terminal', category: 'WORK' },
  'powershell.exe': { friendlyName: 'PowerShell', category: 'WORK' },
  'cmd.exe': { friendlyName: 'Command Prompt', category: 'WORK' },
  'git-bash.exe': { friendlyName: 'Git Bash', category: 'WORK' },
  'docker desktop.exe': { friendlyName: 'Docker Desktop', category: 'WORK' },
  'figma.exe': { friendlyName: 'Figma', category: 'WORK' },
  'photoshop.exe': { friendlyName: 'Adobe Photoshop', category: 'WORK' },
  'illustrator.exe': { friendlyName: 'Adobe Illustrator', category: 'WORK' },

  // Productivity & Office
  'excel.exe': { friendlyName: 'Microsoft Excel', category: 'WORK' },
  'winword.exe': { friendlyName: 'Microsoft Word', category: 'WORK' },
  'powerpnt.exe': { friendlyName: 'Microsoft PowerPoint', category: 'WORK' },
  'outlook.exe': { friendlyName: 'Microsoft Outlook', category: 'COMMUNICATION' },
  'notion.exe': { friendlyName: 'Notion', category: 'WORK' },
  'obsidian.exe': { friendlyName: 'Obsidian', category: 'WORK' },
  'notepad.exe': { friendlyName: 'Notepad', category: 'WORK' },
  'notepad++.exe': { friendlyName: 'Notepad++', category: 'WORK' },
  'acrobat.exe': { friendlyName: 'Adobe Acrobat Reader', category: 'WORK' },
  'explorer.exe': { friendlyName: 'File Explorer', category: 'WORK' },

  // Communication & Meetings
  'slack.exe': { friendlyName: 'Slack', category: 'COMMUNICATION' },
  'teams.exe': { friendlyName: 'Microsoft Teams', category: 'COMMUNICATION' },
  'zoom.exe': { friendlyName: 'Zoom Meetings', category: 'COMMUNICATION' },
  'discord.exe': { friendlyName: 'Discord', category: 'COMMUNICATION' },
  'telegram.exe': { friendlyName: 'Telegram', category: 'COMMUNICATION' },
  'whatsapp.exe': { friendlyName: 'WhatsApp Desktop', category: 'COMMUNICATION' },
  'skype.exe': { friendlyName: 'Skype', category: 'COMMUNICATION' },

  // Entertainment / Media
  'spotify.exe': { friendlyName: 'Spotify', category: 'ENTERTAINMENT' },
  'vlc.exe': { friendlyName: 'VLC Media Player', category: 'ENTERTAINMENT' },
  'steam.exe': { friendlyName: 'Steam', category: 'ENTERTAINMENT' },
  'netflix.exe': { friendlyName: 'Netflix', category: 'ENTERTAINMENT' }
};

export const DOMAIN_CATEGORIES: Record<string, 'WORK' | 'COMMUNICATION' | 'ENTERTAINMENT' | 'BROWSING'> = {
  'github.com': 'WORK',
  'gitlab.com': 'WORK',
  'bitbucket.org': 'WORK',
  'stackoverflow.com': 'WORK',
  'jira.atlassian.net': 'WORK',
  'confluence.atlassian.net': 'WORK',
  'trello.com': 'WORK',
  'notion.so': 'WORK',
  'linear.app': 'WORK',
  'figma.com': 'WORK',
  'docs.google.com': 'WORK',
  'sheets.google.com': 'WORK',
  'drive.google.com': 'WORK',
  'mail.google.com': 'COMMUNICATION',
  'outlook.office.com': 'COMMUNICATION',
  'slack.com': 'COMMUNICATION',
  'teams.microsoft.com': 'COMMUNICATION',
  'web.whatsapp.com': 'COMMUNICATION',
  'linkedin.com': 'COMMUNICATION',
  'youtube.com': 'ENTERTAINMENT',
  'netflix.com': 'ENTERTAINMENT',
  'facebook.com': 'ENTERTAINMENT',
  'instagram.com': 'ENTERTAINMENT',
  'twitter.com': 'ENTERTAINMENT',
  'x.com': 'ENTERTAINMENT',
  'reddit.com': 'ENTERTAINMENT'
};

export function extractYouTubeVideoTitle(windowTitle: string | null | undefined): string | null {
  if (!windowTitle) return null;
  const clean = windowTitle.trim();
  if (clean.toLowerCase().includes('youtube')) {
    // Remove browser suffixes like "- YouTube - Google Chrome", "- YouTube - Brave", etc.
    const title = clean
      .replace(/\s*-\s*YouTube.*$/i, '')
      .replace(/^\(\d+\)\s*/, '') // Remove unread count like (1)
      .trim();
    return title || 'YouTube Video';
  }
  return null;
}

export function resolveAppInfo(
  rawProcessName: string | null | undefined,
  title: string | null | undefined,
  domain: string | null | undefined,
  isIdle: boolean,
  customCategory?: string
) {
  if (isIdle) {
    return { friendlyName: 'Away / Idle Break', category: 'IDLE' as const };
  }

  if (customCategory && ['WORK', 'BROWSING', 'COMMUNICATION', 'ENTERTAINMENT', 'IDLE', 'OTHER'].includes(customCategory.toUpperCase())) {
    const cleanProcess = (rawProcessName || '').toLowerCase().trim();
    const matched = APP_MAPPING[cleanProcess];
    const friendlyName = matched ? matched.friendlyName : (rawProcessName || 'Active Task');
    return { friendlyName, category: customCategory.toUpperCase() as any };
  }

  const cleanProcess = (rawProcessName || '').toLowerCase().trim();
  const matched = APP_MAPPING[cleanProcess];

  let friendlyName = matched ? matched.friendlyName : (rawProcessName || 'Unknown Application');
  let category = matched ? matched.category : ('OTHER' as const);

  if (domain) {
    const cleanDomain = domain.toLowerCase().trim();
    if (DOMAIN_CATEGORIES[cleanDomain]) {
      category = DOMAIN_CATEGORIES[cleanDomain];
    }
  }

  return { friendlyName, category };
}
