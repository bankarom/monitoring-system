// Electron IPC Renderer Safe Initialization
let ipcRenderer;
if (typeof require !== 'undefined') {
  try {
    ipcRenderer = require('electron').ipcRenderer;
  } catch (e) {}
}
if (!ipcRenderer && typeof window !== 'undefined' && window.require) {
  try {
    ipcRenderer = window.require('electron').ipcRenderer;
  } catch (e) {}
}

// -------------------------------------------------------------
// DOM ELEMENTS DECLARATION
// -------------------------------------------------------------

// Views
const loginView = document.getElementById('loginView');
const agentDashboardView = document.getElementById('agentDashboardView');

// Login Elements
const serverUrlInput = document.getElementById('serverUrl');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const loginForm = document.getElementById('loginForm');

// Header & User Profile Elements
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const userDepartment = document.getElementById('userDepartment');
const headerStatusDot = document.getElementById('headerStatusDot');
const currentViewTitle = document.getElementById('currentViewTitle');
const currentHeaderDate = document.getElementById('currentHeaderDate');

// Metrics Strip
const todayActiveTime = document.getElementById('todayActiveTime');
const todayBreakTime = document.getElementById('todayBreakTime');
const liveStatusPill = document.getElementById('liveStatusPill');
const liveStatusDot = document.getElementById('liveStatusDot');
const liveStatusText = document.getElementById('liveStatusText');

// Task & Tracking Controls
const taskInput = document.getElementById('taskInput');
const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');
const catPills = document.querySelectorAll('.cat-pill');
const todayTimer = document.getElementById('todayTimer');
const displayTaskTitle = document.getElementById('displayTaskTitle');
const displayTaskDuration = document.getElementById('displayTaskDuration');
const liveActiveAppText = document.getElementById('liveActiveAppText');

// Left Navigation Tabs & Panels
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Date Pickers
const timelineDatePicker = document.getElementById('timelineDatePicker');
const shotsDatePicker = document.getElementById('shotsDatePicker');
const appsDatePicker = document.getElementById('appsDatePicker');
const logsDatePicker = document.getElementById('logsDatePicker');

// Modals
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnClockOut = document.getElementById('btnClockOut');
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const chkAutoLaunch = document.getElementById('chkAutoLaunch');
const chkAutoStart = document.getElementById('chkAutoStart');
const chkMinimizeTray = document.getElementById('chkMinimizeTray');

const pauseModal = document.getElementById('pauseModal');
const btnClosePause = document.getElementById('btnClosePause');
const btnCancelPause = document.getElementById('btnCancelPause');
const btnConfirmPause = document.getElementById('btnConfirmPause');
const pauseCommentInput = document.getElementById('pauseCommentInput');

// Screenshot Lightbox Elements
const screenshotLightboxModal = document.getElementById('screenshotLightboxModal');
const btnCloseLightbox = document.getElementById('btnCloseLightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxTaskName = document.getElementById('lightboxTaskName');
const lightboxTimestamp = document.getElementById('lightboxTimestamp');
const btnManualScreenshot = document.getElementById('btnManualScreenshot');

// -------------------------------------------------------------
// STATE VARIABLES
// -------------------------------------------------------------
let currentCategory = 'WORK';
let currentTaskName = 'General Work';
let isRunning = false;
let isPaused = false;
let sessionSeconds = 0;
let timerInterval = null;

// Initialize Date Pickers to Today
const todayISO = new Date().toISOString().split('T')[0];
if (timelineDatePicker) timelineDatePicker.value = todayISO;
if (shotsDatePicker) shotsDatePicker.value = todayISO;
if (appsDatePicker) appsDatePicker.value = todayISO;
if (logsDatePicker) logsDatePicker.value = todayISO;

if (currentHeaderDate) {
  currentHeaderDate.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// -------------------------------------------------------------
// 1. LEFT SIDEBAR NAVIGATION LOGIC
// -------------------------------------------------------------
const tabTitles = {
  tabTracker: 'Live Tracker',
  tabTimeline: '24-Hour Activity Timeline',
  tabScreenshots: 'My Screenshots Gallery',
  tabApps: 'Software & Web History',
  tabLogs: 'Daily Timesheet & Activity Logs'
};

navTabs.forEach((tab) => {
  tab.addEventListener('click', async () => {
    navTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');

    const targetTabId = tab.getAttribute('data-tab');
    tabPanels.forEach((p) => p.classList.add('hidden'));

    const targetPanel = document.getElementById(targetTabId);
    if (targetPanel) targetPanel.classList.remove('hidden');

    if (currentViewTitle && tabTitles[targetTabId]) {
      currentViewTitle.textContent = tabTitles[targetTabId];
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (targetTabId === 'tabTimeline') {
      const pickerVal = timelineDatePicker ? timelineDatePicker.value || todayStr : todayStr;
      await loadDesktopTimeline(pickerVal);
    } else if (targetTabId === 'tabScreenshots') {
      const pickerVal = shotsDatePicker ? shotsDatePicker.value || todayStr : todayStr;
      await loadDesktopScreenshots(pickerVal);
    } else if (targetTabId === 'tabApps') {
      const pickerVal = appsDatePicker ? appsDatePicker.value || todayStr : todayStr;
      await loadDesktopApps(pickerVal);
    } else if (targetTabId === 'tabLogs') {
      const pickerVal = logsDatePicker ? logsDatePicker.value || todayStr : todayStr;
      await loadDesktopLogs(pickerVal);
    }
  });
});

if (timelineDatePicker) {
  timelineDatePicker.addEventListener('change', (e) => loadDesktopTimeline(e.target.value));
}
if (shotsDatePicker) {
  shotsDatePicker.addEventListener('change', (e) => loadDesktopScreenshots(e.target.value));
}
if (appsDatePicker) {
  appsDatePicker.addEventListener('change', (e) => loadDesktopApps(e.target.value));
}
if (logsDatePicker) {
  logsDatePicker.addEventListener('change', (e) => loadDesktopLogs(e.target.value));
}

// -------------------------------------------------------------
// 2. TIMELINE, SCREENSHOTS, APPS & LOGS LOADERS
// -------------------------------------------------------------

// Load Timeline
async function loadDesktopTimeline(dateStr) {
  const container = document.getElementById('desktopTimelineContainer');
  if (!container || !ipcRenderer) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 12px; font-weight: 600;">Loading timeline for ' + dateStr + '...</p>';

  try {
    const data = await ipcRenderer.invoke('get-my-timeline', dateStr);
    if (!data || !data.intervals || data.intervals.length === 0) {
      container.innerHTML = '<div style="padding: 30px; color: #64748b; font-size: 13px; font-weight: 600;"><p>No activity timeline recorded for ' + dateStr + '.</p></div>';
      return;
    }

    const activeMins = Math.round((data.attendance?.totalActiveSeconds || 0) / 60);
    const idleMins = Math.round((data.attendance?.totalIdleSeconds || 0) / 60);
    const activeHrs = (activeMins / 60).toFixed(1);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">
        <span style="font-size: 14px; font-weight: 800; color: #0f172a;">Total Active Work: ${activeHrs} hrs (${activeMins}m)</span>
        <span style="font-size: 13px; font-weight: 700; color: #92400e;">Breaks / Away: ${idleMins}m</span>
      </div>
      <div style="display: flex; gap: 3px; align-items: flex-end; height: 75px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; overflow-x: auto;">
        ${Array.from({ length: 24 }).map((_, h) => {
          const hrMatches = data.intervals.filter((i) => {
            const startH = new Date(i.startTime).getHours();
            return startH === h;
          });
          const hasActive = hrMatches.some((i) => i.category !== 'IDLE');
          const hasBreak = hrMatches.some((i) => i.category === 'IDLE');
          const bg = hasActive ? '#22c55e' : (hasBreak ? '#f59e0b' : '#e2e8f0');
          const label = h === 0 ? '12a' : (h < 12 ? h + 'a' : (h === 12 ? '12p' : (h - 12) + 'p'));
          return `
            <div style="flex: 1; min-width: 14px; text-align: center; font-size: 9px; color: #64748b; font-weight: 700;">
              <div>${label}</div>
              <div style="height: 36px; background: ${bg}; border-radius: 4px; margin-top: 4px;"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 12px;">Failed to load timeline.</p>';
  }
}

// Load Screenshots Gallery
async function loadDesktopScreenshots(dateStr) {
  const container = document.getElementById('desktopShotsGrid');
  if (!container || !ipcRenderer) return;
  container.innerHTML = '<p class="muted-text">Loading captures for ' + dateStr + '...</p>';

  try {
    const list = await ipcRenderer.invoke('get-my-screenshots', dateStr);
    if (!list || list.length === 0) {
      container.innerHTML = '<div style="padding: 40px; color: #64748b; font-size: 13px; font-weight: 600; grid-column: 1 / -1; text-align: center;"><p>No screenshots recorded for ' + dateStr + '.</p><p style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Screenshots capture automatically every 10 minutes while working, or you can click "Capture Screenshot Now" above.</p></div>';
      return;
    }

    const baseUrl = (serverUrlInput && serverUrlInput.value ? serverUrlInput.value : 'http://200.141.2.53').trim().replace(/\/$/, '');

    container.innerHTML = list.map((s) => {
      const imgUrl = s.filePath.startsWith('http') ? s.filePath : `${baseUrl}${s.filePath}`;
      const timeFormatted = new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const taskLabel = s.taskName || s.appName || 'Active Work';
      return `
        <div class="shot-card-item" onclick="openScreenshotLightbox('${imgUrl}', '${taskLabel.replace(/'/g, "\\\\'")}', '${timeFormatted}')">
          <img src="${imgUrl}" alt="${taskLabel}" onerror="this.src='https://via.placeholder.com/300x160?text=Screen+Preview'">
          <div class="shot-card-meta">
            <span class="shot-card-title" title="${taskLabel}">${taskLabel}</span>
            <span class="shot-card-time">${timeFormatted}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 12px;">Failed to load screenshots.</p>';
  }
}

// Open Lightbox
window.openScreenshotLightbox = function(url, task, time) {
  if (lightboxImg) lightboxImg.src = url;
  if (lightboxTaskName) lightboxTaskName.textContent = task || 'Screenshot';
  if (lightboxTimestamp) lightboxTimestamp.textContent = time || '';
  if (screenshotLightboxModal) screenshotLightboxModal.classList.remove('hidden');
};

// Close Lightbox
if (btnCloseLightbox) {
  btnCloseLightbox.addEventListener('click', () => {
    if (screenshotLightboxModal) screenshotLightboxModal.classList.add('hidden');
  });
}

// Escape key to close lightbox
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (screenshotLightboxModal) screenshotLightboxModal.classList.add('hidden');
    if (settingsModal) settingsModal.classList.add('hidden');
    if (pauseModal) pauseModal.classList.add('hidden');
  }
});

// Manual Screenshot Button
if (btnManualScreenshot) {
  btnManualScreenshot.addEventListener('click', async () => {
    btnManualScreenshot.disabled = true;
    btnManualScreenshot.textContent = '📸 Capturing...';
    try {
      const res = await ipcRenderer.invoke('capture-screenshot-now');
      const todayStr = shotsDatePicker ? shotsDatePicker.value : new Date().toISOString().split('T')[0];
      await loadDesktopScreenshots(todayStr);
    } catch (e) {}
    btnManualScreenshot.disabled = false;
    btnManualScreenshot.innerHTML = '<span>📸</span> Capture Screenshot Now';
  });
}

// Load Apps & Web History
async function loadDesktopApps(dateStr) {
  const container = document.getElementById('desktopAppsContainer');
  if (!container || !ipcRenderer) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 12px; font-weight: 600;">Loading applications and web history for ' + dateStr + '...</p>';

  try {
    const data = await ipcRenderer.invoke('get-my-analytics', dateStr);
    const appsList = Array.isArray(data) ? data : (data.apps || []);
    const domainsList = data.domains || [];

    if (appsList.length === 0 && domainsList.length === 0) {
      container.innerHTML = '<div style="padding: 30px; color: #64748b; font-size: 13px; font-weight: 600; text-align: center;"><p>No software or web activity logged for ' + dateStr + '.</p></div>';
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Applications -->
        <div>
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>💻</span> Software & Apps Used
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569;">
                <th style="padding: 8px;">Application</th>
                <th style="padding: 8px;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${appsList.map((a) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; font-weight: 700; color: #0f172a;">${a.appName || 'Software'}</td>
                  <td style="padding: 8px; font-weight: 800; color: #0284c7;">${a.minutes}m</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Web Domains -->
        <div>
          <h4 style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🌐</span> Visited Websites & Web History
          </h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left; color: #475569;">
                <th style="padding: 8px;">Website Domain</th>
                <th style="padding: 8px;">Time Spent</th>
              </tr>
            </thead>
            <tbody>
              ${domainsList.length > 0 ? domainsList.map((d) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px; font-weight: 700; color: #0f172a;">${d.domain}</td>
                  <td style="padding: 8px; font-weight: 800; color: #16a34a;">${d.minutes}m</td>
                </tr>
              `).join('') : '<tr><td colspan="2" style="padding: 12px; color: #94a3b8; font-size: 11px;">No web browsing recorded.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 12px;">Failed to load analytics.</p>';
  }
}

// Load Detailed Logs
async function loadDesktopLogs(dateStr) {
  const container = document.getElementById('desktopLogsContainer');
  if (!container || !ipcRenderer) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 12px; font-weight: 600;">Loading timesheet logs for ' + dateStr + '...</p>';

  try {
    const list = await ipcRenderer.invoke('get-my-reports', dateStr);
    if (!list || list.length === 0) {
      container.innerHTML = '<div style="padding: 30px; color: #64748b; font-size: 13px; font-weight: 600; text-align: center;"><p>No timesheet intervals recorded for ' + dateStr + '.</p></div>';
      return;
    }

    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px;">Time Range</th>
            <th style="padding: 10px;">Task / Activity</th>
            <th style="padding: 10px;">Category</th>
            <th style="padding: 10px;">Duration</th>
            <th style="padding: 10px;">Activity %</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((r) => {
            const timeDisplay = (r.from && r.to)
              ? `${r.from} - ${r.to}`
              : (r.startTime ? `${new Date(r.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(r.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}` : (r.timeRangeFormatted || 'Active'));
            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-family: monospace; color: #475569;">${timeDisplay}</td>
              <td style="padding: 10px; font-weight: 700; color: #0f172a;">${r.taskName || r.note || r.appName || 'Work'}</td>
              <td style="padding: 10px;"><span style="background: ${(r.category === 'IDLE' || r.note === 'Away / Idle Break') ? '#fef3c7' : '#dcfce7'}; color: ${(r.category === 'IDLE' || r.note === 'Away / Idle Break') ? '#92400e' : '#166534'}; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px;">${r.category || (r.note === 'Away / Idle Break' ? 'BREAK' : 'WORK')}</span></td>
              <td style="padding: 10px; font-weight: 800; color: #0284c7;">${r.durationMinutes}m</td>
              <td style="padding: 10px;"><span style="background: ${(r.activityPercent || 0) > 70 ? '#dcfce7' : '#fef3c7'}; color: ${(r.activityPercent || 0) > 70 ? '#166534' : '#92400e'}; padding: 3px 8px; border-radius: 999px; font-weight: 800; font-size: 10px;">${r.activityPercent || 100}%</span></td>
            </tr>
          `;}).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 12px;">Failed to load session logs.</p>';
  }
}

// -------------------------------------------------------------
// 3. TRACKER CONTROLS & TIMERS
// -------------------------------------------------------------

// Format Seconds to H:MM:SS
function formatTimerDisplay(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return h + ':' + m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  }
  return m + ':' + s.toString().padStart(2, '0');
}

function formatHoursMins(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) {
    return h + 'h ' + m.toString().padStart(2, '0') + 'm';
  }
  return m + 'm';
}

function startDigitalTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isRunning && !isPaused) {
      sessionSeconds++;
      if (todayTimer) todayTimer.textContent = formatTimerDisplay(sessionSeconds);
      if (displayTaskDuration) displayTaskDuration.textContent = formatHoursMins(sessionSeconds);
    }
  }, 1000);
}

function stopDigitalTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setRunningState(running, paused = false, pauseReason = '') {
  isRunning = running;
  isPaused = paused;

  if (running && !paused) {
    if (btnPlay) btnPlay.classList.add('hidden');
    if (btnStop) btnStop.classList.remove('hidden');

    if (liveStatusPill) {
      liveStatusPill.className = 'status-indicator-pill working';
      if (liveStatusText) liveStatusText.textContent = 'WORKING';
    }
    if (headerStatusDot) headerStatusDot.style.background = '#22c55e';
    startDigitalTimer();
  } else if (paused) {
    if (btnPlay) btnPlay.classList.remove('hidden');
    if (btnStop) btnStop.classList.add('hidden');

    if (liveStatusPill) {
      liveStatusPill.className = 'status-indicator-pill paused';
      if (liveStatusText) liveStatusText.textContent = pauseReason ? ('PAUSED: ' + pauseReason) : 'PAUSED';
    }
    if (headerStatusDot) headerStatusDot.style.background = '#f59e0b';
    stopDigitalTimer();
  } else {
    if (btnPlay) btnPlay.classList.remove('hidden');
    if (btnStop) btnStop.classList.add('hidden');

    if (liveStatusPill) {
      liveStatusPill.className = 'status-indicator-pill';
      if (liveStatusText) liveStatusText.textContent = 'STOPPED';
    }
    if (headerStatusDot) headerStatusDot.style.background = '#94a3b8';
    stopDigitalTimer();
  }
}

// Category selection
catPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    catPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentCategory = pill.getAttribute('data-cat') || 'WORK';

    // If "Break / Lunch" is selected, trigger pause modal
    if (currentCategory === 'IDLE' && isRunning && !isPaused) {
      if (pauseModal) pauseModal.classList.remove('hidden');
    }
  });
});

// Play / Start Button
if (btnPlay) {
  btnPlay.addEventListener('click', async () => {
    const task = (taskInput && taskInput.value ? taskInput.value : 'General Work').trim();
    currentTaskName = task;
    if (displayTaskTitle) displayTaskTitle.textContent = task;

    if (ipcRenderer) {
      await ipcRenderer.invoke('start-task', { taskName: task, category: currentCategory });
    }
    setRunningState(true, false);
  });
}

// Enter in Task input starts tracking
if (taskInput) {
  taskInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const task = (taskInput.value || 'General Work').trim();
      currentTaskName = task;
      if (displayTaskTitle) displayTaskTitle.textContent = task;

      if (ipcRenderer) {
        await ipcRenderer.invoke('start-task', { taskName: task, category: currentCategory });
      }
      setRunningState(true, false);
    }
  });
}

// Stop / Pause Button
if (btnStop) {
  btnStop.addEventListener('click', () => {
    if (pauseModal) pauseModal.classList.remove('hidden');
  });
}

// Confirm Pause Modal
if (btnConfirmPause) {
  btnConfirmPause.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="breakReason"]:checked');
    const reason = selected ? selected.value : 'Break';
    const comment = pauseCommentInput ? pauseCommentInput.value.trim() : '';

    if (ipcRenderer) {
      await ipcRenderer.invoke('stop-task', { reason, comment });
    }
    setRunningState(false, true, reason);
    if (pauseModal) pauseModal.classList.add('hidden');
  });
}

if (btnClosePause) btnClosePause.addEventListener('click', () => pauseModal && pauseModal.classList.add('hidden'));
if (btnCancelPause) btnCancelPause.addEventListener('click', () => pauseModal && pauseModal.classList.add('hidden'));

// Settings Modal
if (btnOpenSettings) {
  btnOpenSettings.addEventListener('click', async () => {
    if (ipcRenderer) {
      const state = await ipcRenderer.invoke('get-agent-state');
      if (state.userSettings) {
        if (chkAutoLaunch) chkAutoLaunch.checked = !!state.userSettings.launchAtStartup;
        if (chkAutoStart) chkAutoStart.checked = !!state.userSettings.autoStartTracking;
        if (chkMinimizeTray) chkMinimizeTray.checked = state.userSettings.minimizeToTray !== false;
      }
    }
    if (settingsModal) settingsModal.classList.remove('hidden');
  });
}

if (btnCloseSettings) btnCloseSettings.addEventListener('click', () => settingsModal && settingsModal.classList.add('hidden'));
if (btnCancelSettings) btnCancelSettings.addEventListener('click', () => settingsModal && settingsModal.classList.add('hidden'));

if (btnSaveSettings) {
  btnSaveSettings.addEventListener('click', async () => {
    if (ipcRenderer) {
      await ipcRenderer.invoke('save-settings', {
        launchAtStartup: chkAutoLaunch ? chkAutoLaunch.checked : false,
        autoStartTracking: chkAutoStart ? chkAutoStart.checked : false,
        minimizeToTray: chkMinimizeTray ? chkMinimizeTray.checked : true
      });
    }
    if (settingsModal) settingsModal.classList.add('hidden');
  });
}

// Clock Out
if (btnClockOut) {
  btnClockOut.addEventListener('click', async () => {
    if (confirm("Are you sure you want to end today's shift and clock out? Tracking will stop.")) {
      if (ipcRenderer) {
        await ipcRenderer.invoke('clock-out-agent');
      }
    }
  });
}

// -------------------------------------------------------------
// 4. AUTHENTICATION & LOGIN SUBMIT
// -------------------------------------------------------------
async function handleLoginSubmit(e) {
  if (e) {
    e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }

  if (errorBox) errorBox.classList.add('hidden');
  if (successBox) successBox.classList.add('hidden');

  let serverUrl = (serverUrlInput.value || 'http://200.141.2.53').trim().replace(/\/$/, '');
  if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
    serverUrl = 'http://' + serverUrl;
  }

  const email = (emailInput.value || '').trim();
  const password = (passwordInput.value || '').trim();

  if (!email || !password) {
    if (errorBox) {
      errorBox.textContent = '❌ Please enter both your work email and password.';
      errorBox.classList.remove('hidden');
    }
    return;
  }

  if (btnSubmit) btnSubmit.disabled = true;
  if (btnText) btnText.textContent = 'Connecting...';
  if (btnSpinner) btnSpinner.classList.remove('hidden');

  try {
    console.log('>>> Invoking agent-login via IPC with:', serverUrl, email);
    const res = await ipcRenderer.invoke('agent-login', { serverUrl, email, password });
    console.log('>>> agent-login IPC response:', res);

    if (res && res.success) {
      if (successBox) {
        successBox.textContent = '✅ Connected! Loading Workspace...';
        successBox.classList.remove('hidden');
      }
      showDashboardView({ user: res.user, isTracking: false, isPaused: false });
    } else {
      if (errorBox) {
        errorBox.textContent = res && res.message ? ('❌ ' + res.message) : '❌ Login failed. Please check your credentials.';
        errorBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('>>> agent-login IPC caught error:', err);
    if (errorBox) {
      errorBox.textContent = '❌ ' + (err.message || 'Connection failed. Please check server URL.');
      errorBox.classList.remove('hidden');
    }
  } finally {
    if (btnSubmit) btnSubmit.disabled = false;
    if (btnText) btnText.textContent = 'Sign In & Connect';
    if (btnSpinner) btnSpinner.classList.add('hidden');
  }
}

if (btnSubmit) {
  btnSubmit.addEventListener('click', handleLoginSubmit);
}
if (loginForm) {
  loginForm.addEventListener('submit', handleLoginSubmit);
}
if (passwordInput) {
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLoginSubmit(e);
  });
}

function showLoginView() {
  if (loginView) loginView.classList.remove('hidden');
  if (agentDashboardView) agentDashboardView.classList.add('hidden');
}

function showDashboardView(state) {
  if (loginView) loginView.classList.add('hidden');
  if (agentDashboardView) agentDashboardView.classList.remove('hidden');

  const name = state.user?.name || 'Employee';
  if (userName) userName.textContent = name;
  if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
  if (userDepartment) userDepartment.textContent = state.user?.department || 'Design';

  if (state.currentTask) {
    currentTaskName = state.currentTask;
    if (taskInput) taskInput.value = state.currentTask;
    if (displayTaskTitle) displayTaskTitle.textContent = state.currentTask;
  }

  setRunningState(state.isTracking, state.isPaused, state.pauseReason);
}

// Listen for state changes from Main Process
if (ipcRenderer) {
  ipcRenderer.on('agent-state-changed', (event, state) => {
    if (state.user) {
      showDashboardView(state);

      if (todayActiveTime && state.activeHoursFormatted) {
        todayActiveTime.textContent = state.activeHoursFormatted;
      }
      if (todayBreakTime && state.idleHoursFormatted) {
        todayBreakTime.textContent = state.idleHoursFormatted;
      }
      if (liveActiveAppText && state.currentApp) {
        liveActiveAppText.textContent = state.currentApp;
      }
    }
  });
}
