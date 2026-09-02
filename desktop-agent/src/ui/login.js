// Desktop Workspace Nav Tabs
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

navTabs.forEach((tab) => {
  tab.addEventListener('click', async () => {
    navTabs.forEach((t) => {
      t.classList.remove('active');
      t.style.background = 'transparent';
      t.style.color = '#475569';
    });
    tab.classList.add('active');
    tab.style.background = '#0f172a';
    tab.style.color = 'white';

    const targetTabId = tab.getAttribute('data-tab');
    tabPanels.forEach((p) => p.classList.add('hidden'));

    const targetPanel = document.getElementById(targetTabId);
    if (targetPanel) targetPanel.classList.remove('hidden');

    const todayStr = new Date().toISOString().split('T')[0];

    if (targetTabId === 'tabTimeline') {
      const picker = document.getElementById('timelineDatePicker');
      if (picker && !picker.value) picker.value = todayStr;
      await loadDesktopTimeline(picker ? picker.value : todayStr);
    } else if (targetTabId === 'tabScreenshots') {
      const picker = document.getElementById('shotsDatePicker');
      if (picker && !picker.value) picker.value = todayStr;
      await loadDesktopScreenshots(picker ? picker.value : todayStr);
    } else if (targetTabId === 'tabApps') {
      const picker = document.getElementById('appsDatePicker');
      if (picker && !picker.value) picker.value = todayStr;
      await loadDesktopApps(picker ? picker.value : todayStr);
    } else if (targetTabId === 'tabLogs') {
      const picker = document.getElementById('logsDatePicker');
      if (picker && !picker.value) picker.value = todayStr;
      await loadDesktopLogs(picker ? picker.value : todayStr);
    }
  });
});

// Date picker listeners for native desktop views
const timelineDatePicker = document.getElementById('timelineDatePicker');
if (timelineDatePicker) {
  timelineDatePicker.value = new Date().toISOString().split('T')[0];
  timelineDatePicker.addEventListener('change', (e) => loadDesktopTimeline(e.target.value));
}

const shotsDatePicker = document.getElementById('shotsDatePicker');
if (shotsDatePicker) {
  shotsDatePicker.value = new Date().toISOString().split('T')[0];
  shotsDatePicker.addEventListener('change', (e) => loadDesktopScreenshots(e.target.value));
}

const appsDatePicker = document.getElementById('appsDatePicker');
if (appsDatePicker) {
  appsDatePicker.value = new Date().toISOString().split('T')[0];
  appsDatePicker.addEventListener('change', (e) => loadDesktopApps(e.target.value));
}

const logsDatePicker = document.getElementById('logsDatePicker');
if (logsDatePicker) {
  logsDatePicker.value = new Date().toISOString().split('T')[0];
  logsDatePicker.addEventListener('change', (e) => loadDesktopLogs(e.target.value));
}

// 1. Load Desktop Timeline Bar & Summary
async function loadDesktopTimeline(dateStr) {
  const container = document.getElementById('desktopTimelineContainer');
  if (!container) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 11px;">Loading timeline for ' + dateStr + '...</p>';

  try {
    const data = await ipcRenderer.invoke('get-my-timeline', dateStr);
    if (!data || !data.intervals || data.intervals.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #64748b; font-size: 12px;"><p>No telemetry recorded for ' + dateStr + '.</p></div>';
      return;
    }

    const activeMins = Math.round((data.attendance?.totalActiveSeconds || 0) / 60);
    const idleMins = Math.round((data.attendance?.totalIdleSeconds || 0) / 60);
    const activeHrs = (activeMins / 60).toFixed(1);

    container.innerHTML = `
      <div style="text-align: left; font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
        <span>Active Work: ${activeHrs}h (${activeMins} mins)</span> • <span style="color: #d97706;">Break/Idle: ${idleMins} mins</span>
      </div>
      <div style="display: flex; gap: 2px; background: #f8fafc; padding: 6px; border-radius: 8px; overflow-x: auto;">
        ${Array.from({ length: 24 }, (_, h) => {
          const count = data.intervals.filter((inv) => new Date(inv.startTime).getHours() === h).length;
          const bg = count > 0 ? '#10b981' : '#e2e8f0';
          const label = h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`;
          return `
            <div style="flex: 1; min-width: 14px; text-align: center; font-size: 8px; font-weight: 700; color: #64748b;">
              <div>${label}</div>
              <div style="height: 24px; background: ${bg}; border-radius: 4px; margin-top: 2px;"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 11px;">Failed to load timeline.</p>';
  }
}

// 2. Load Desktop Screenshots Grid
async function loadDesktopScreenshots(dateStr) {
  const container = document.getElementById('desktopShotsGrid');
  if (!container) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 11px;">Loading screenshots for ' + dateStr + '...</p>';

  try {
    const list = await ipcRenderer.invoke('get-my-screenshots', dateStr);
    if (!list || list.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #64748b; font-size: 12px; grid-column: 1 / -1;"><p>No screenshots recorded for ' + dateStr + '.</p></div>';
      return;
    }

    container.innerHTML = list.map((s) => `
      <div style="position: relative; border-radius: 10px; overflow: hidden; border: 1px solid #cbd5e1; background: #0f172a;">
        <img src="${s.filePath}" alt="${s.appName || 'Screen'}" style="width: 100%; height: 110px; object-fit: cover;">
        <div style="padding: 6px; background: rgba(15,23,42,0.9); color: white;">
          <p style="font-size: 10px; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.taskName || s.appName || 'Screen'}</p>
          <span style="font-size: 9px; color: #38bdf8; font-family: monospace;">${new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 11px;">Failed to load screenshots.</p>';
  }
}

// 3. Load Desktop App Analytics
async function loadDesktopApps(dateStr) {
  const container = document.getElementById('desktopAppsContainer');
  if (!container) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 11px;">Loading app analytics for ' + dateStr + '...</p>';

  try {
    const data = await ipcRenderer.invoke('get-my-analytics', dateStr);
    const apps = data?.apps || [];
    if (apps.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #64748b; font-size: 12px;"><p>No application telemetry logged for ' + dateStr + '.</p></div>';
      return;
    }

    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; color: #334155;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #475569;">
            <th style="padding: 8px;">Software / App</th>
            <th style="padding: 8px;">Category</th>
            <th style="padding: 8px;">Active Time</th>
            <th style="padding: 8px;">Share %</th>
          </tr>
        </thead>
        <tbody>
          ${apps.map((a) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px; font-weight: 700; color: #0f172a;">${a.appName}</td>
              <td style="padding: 8px;"><span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px;">${a.category}</span></td>
              <td style="padding: 8px; font-weight: 800; color: #0f172a;">${Math.round(a.totalHours * 60)} mins</td>
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">${a.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 11px;">Failed to load app analytics.</p>';
  }
}

// 4. Load Desktop Session Logs
async function loadDesktopLogs(dateStr) {
  const container = document.getElementById('desktopLogsContainer');
  if (!container) return;
  container.innerHTML = '<p style="color: #64748b; font-size: 11px;">Loading detailed session logs for ' + dateStr + '...</p>';

  try {
    const data = await ipcRenderer.invoke('get-my-reports', dateStr);
    const rows = data?.detailedRows || [];
    if (rows.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #64748b; font-size: 12px;"><p>No detailed session logs for ' + dateStr + '.</p></div>';
      return;
    }

    container.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; color: #334155;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 800; color: #475569;">
            <th style="padding: 8px;">Date</th>
            <th style="padding: 8px;">Task / Note</th>
            <th style="padding: 8px;">From</th>
            <th style="padding: 8px;">To</th>
            <th style="padding: 8px;">Duration</th>
            <th style="padding: 8px;">Activity %</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px; font-family: monospace; font-weight: 700;">${r.date}</td>
              <td style="padding: 8px; font-weight: 700; color: #0284c7;">${r.note}</td>
              <td style="padding: 8px; font-family: monospace;">${r.from}</td>
              <td style="padding: 8px; font-family: monospace;">${r.to}</td>
              <td style="padding: 8px; font-weight: 800;">${r.durationMinutes}m</td>
              <td style="padding: 8px;"><span style="background: ${r.activityPercent > 70 ? '#dcfce7' : '#fef3c7'}; color: ${r.activityPercent > 70 ? '#166534' : '#92400e'}; padding: 2px 6px; border-radius: 999px; font-weight: 800; font-size: 10px;">${r.activityPercent}%</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (e) {
    container.innerHTML = '<p style="color: #ef4444; font-size: 11px;">Failed to load session logs.</p>';
  }
}

// Login Elements
const serverUrlInput = document.getElementById('serverUrl');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

// Window Controls
const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');
const windowTitleText = document.getElementById('windowTitleText');

// User & Header
const userName = document.getElementById('userName');
const headerStatusDot = document.getElementById('headerStatusDot');
const btnOpenScreenshots = document.getElementById('btnOpenScreenshots');
const btnOpenSettings = document.getElementById('btnOpenSettings');
const btnClockOut = document.getElementById('btnClockOut');

// Task & Controls
const taskInput = document.getElementById('taskInput');
const btnPlay = document.getElementById('btnPlay');
const btnStop = document.getElementById('btnStop');
const catPills = document.querySelectorAll('.cat-pill');

// Timer & Task list
const todayTimer = document.getElementById('todayTimer');
const btnViewOnline = document.getElementById('btnViewOnline');
const displayTaskTitle = document.getElementById('displayTaskTitle');
const displayTaskDuration = document.getElementById('displayTaskDuration');
const taskList = document.getElementById('taskList');

const btnLogOutForToday = document.getElementById('btnLogOutForToday');

if (btnLogOutForToday) {
  btnLogOutForToday.addEventListener('click', async () => {
    if (confirm('Are you sure you want to log out for today? This will stop tracking and record your clock-out.')) {
      await ipcRenderer.invoke('clock-out');
      agentDashboardView.classList.add('hidden');
      loginView.classList.remove('hidden');
    }
  });
}

// Status Footer
const footerStatusDot = document.getElementById('footerStatusDot');
const footerStatusText = document.getElementById('footerStatusText');
const activeAppNotice = document.getElementById('activeAppNotice');

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const btnCloseSettings = document.getElementById('btnCloseSettings');
const btnSaveSettings = document.getElementById('btnSaveSettings');
const btnCancelSettings = document.getElementById('btnCancelSettings');
const chkAutoLaunch = document.getElementById('chkAutoLaunch');
const chkAutoStart = document.getElementById('chkAutoStart');
const chkTrayNotify = document.getElementById('chkTrayNotify');
const chkMinimizeTray = document.getElementById('chkMinimizeTray');

// Pause Modal
const pauseModal = document.getElementById('pauseModal');
const btnClosePause = document.getElementById('btnClosePause');
const btnConfirmPause = document.getElementById('btnConfirmPause');
const btnCancelPause = document.getElementById('btnCancelPause');
const pauseCommentInput = document.getElementById('pauseCommentInput');

// Screenshots Modal
const screenshotsModal = document.getElementById('screenshotsModal');
const btnCloseShots = document.getElementById('btnCloseShots');
const agentScreenshotsGrid = document.getElementById('agentScreenshotsGrid');

// State
let currentCategory = 'WORK';
let isRunning = false;
let isPaused = false;
let currentTaskName = 'vs code';
let totalActiveSec = 0;
let timerTicker = null;

// Window controls
btnMinimize.addEventListener('click', () => ipcRenderer.send('window-minimize'));
btnClose.addEventListener('click', () => ipcRenderer.send('window-close'));

// Category pills selection
catPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    catPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    currentCategory = pill.getAttribute('data-cat') || 'WORK';
  });
});

// Format seconds to H:MM or HH:MM:SS
function formatTimerDisplay(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatHoursMins(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

if (btnViewOnline) {
  btnViewOnline.addEventListener('click', async () => {
    await ipcRenderer.invoke('open-web-portal');
  });
}

// Play / Start button
btnPlay.addEventListener('click', async () => {
  const task = (taskInput.value || 'vs code').trim();
  currentTaskName = task;
  displayTaskTitle.textContent = task;

  await ipcRenderer.invoke('start-task', { taskName: task, category: currentCategory });
  setRunningState(true);
});

// Enter key in task input starts tracking
taskInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const task = (taskInput.value || 'vs code').trim();
    currentTaskName = task;
    displayTaskTitle.textContent = task;
    await ipcRenderer.invoke('start-task', { taskName: task, category: currentCategory });
    setRunningState(true);
  }
});

// Stop / Pause button
btnStop.addEventListener('click', () => {
  pauseModal.classList.remove('hidden');
});

// Confirm Pause / Break
btnConfirmPause.addEventListener('click', async () => {
  const selectedRadio = document.querySelector('input[name="breakReason"]:checked');
  const reason = selectedRadio ? selectedRadio.value : 'Break';
  const comment = pauseCommentInput ? pauseCommentInput.value : '';

  pauseModal.classList.add('hidden');
  await ipcRenderer.invoke('stop-task', { reason, comment });
  setRunningState(false, true, reason);
});

btnClosePause.addEventListener('click', () => pauseModal.classList.add('hidden'));
btnCancelPause.addEventListener('click', () => pauseModal.classList.add('hidden'));

function setRunningState(running, paused = false, pauseReason = '') {
  isRunning = running;
  isPaused = paused;

  if (running && !paused) {
    btnPlay.classList.add('hidden');
    btnStop.classList.remove('hidden');
    headerStatusDot.className = 'user-status-dot online';
    footerStatusDot.className = 'status-dot-active';
    footerStatusText.textContent = `Tracking: ${currentTaskName}`;
    footerStatusText.className = 'text-emerald-700 font-bold';
    windowTitleText.textContent = `Improx - ${currentTaskName}`;

    if (!timerTicker) {
      timerTicker = setInterval(() => {
        totalActiveSec++;
        todayTimer.textContent = formatTimerDisplay(totalActiveSec);
        displayTaskDuration.textContent = formatHoursMins(totalActiveSec);
      }, 1000);
    }
  } else if (paused) {
    btnPlay.classList.remove('hidden');
    btnStop.classList.add('hidden');
    headerStatusDot.className = 'user-status-dot paused';
    footerStatusDot.className = 'status-dot-paused';
    footerStatusText.textContent = `Paused (${pauseReason || 'Break'})`;
    footerStatusText.className = 'text-amber-700 font-bold';
    windowTitleText.textContent = `Improx - Paused (${pauseReason || 'Break'})`;
    if (timerTicker) {
      clearInterval(timerTicker);
      timerTicker = null;
    }
  } else {
    btnPlay.classList.remove('hidden');
    btnStop.classList.add('hidden');
    headerStatusDot.className = 'user-status-dot';
    footerStatusDot.className = 'status-dot-idle';
    footerStatusText.textContent = 'Stopped';
    footerStatusText.className = 'text-slate-600';
    windowTitleText.textContent = 'Improx - Stopped';
    if (timerTicker) {
      clearInterval(timerTicker);
      timerTicker = null;
    }
  }
}

// View online button opens browser portal
btnViewOnline.addEventListener('click', async () => {
  await ipcRenderer.invoke('open-web-portal');
});

// Settings Dialog
btnOpenSettings.addEventListener('click', async () => {
  const state = await ipcRenderer.invoke('get-agent-state');
  if (state.userSettings) {
    chkAutoLaunch.checked = !!state.userSettings.launchAtStartup;
    chkAutoStart.checked = state.userSettings.autoStartTracking !== false;
    chkTrayNotify.checked = state.userSettings.trayNotifications !== false;
    chkMinimizeTray.checked = state.userSettings.minimizeToTray !== false;
  }
  settingsModal.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
btnCancelSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));

btnSaveSettings.addEventListener('click', async () => {
  await ipcRenderer.invoke('save-settings', {
    launchAtStartup: chkAutoLaunch.checked,
    autoStartTracking: chkAutoStart.checked,
    trayNotifications: chkTrayNotify.checked,
    minimizeToTray: chkMinimizeTray.checked
  });
  settingsModal.classList.add('hidden');
});

// Screenshots Quick Viewer & Past Date Picker
const agentDateInput = document.getElementById('agentDateInput');
if (agentDateInput) {
  agentDateInput.value = new Date().toISOString().split('T')[0];
}

async function loadAgentScreenshotsForDate(dateStr) {
  agentScreenshotsGrid.innerHTML = '<p class="loading-text">Loading screenshots for ' + dateStr + '...</p>';
  try {
    const list = await ipcRenderer.invoke('get-my-screenshots', dateStr);
    if (!list || list.length === 0) {
      agentScreenshotsGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px; font-weight: 600;"><p>No screenshots recorded for ' + dateStr + '.</p><p style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Use the date selector above to inspect yesterday or other previous dates.</p></div>';
      return;
    }
    agentScreenshotsGrid.innerHTML = list
      .map(
        (s) => `
      <div class="shot-thumb-card" style="position: relative; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #0f172a;">
        <img src="${s.filePath}" alt="${s.taskName || s.appName || 'Screen'}" style="width: 100%; height: 120px; object-fit: cover;">
        <div class="meta" style="padding: 8px; background: rgba(15, 23, 42, 0.9); color: white;">
          <p style="font-size: 11px; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.taskName || s.appName || 'Active Work'}</p>
          <span style="font-size: 10px; color: #38bdf8; font-family: monospace;">${new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `
      )
      .join('');
  } catch (e) {
    agentScreenshotsGrid.innerHTML = '<p class="empty-text">Failed to load screenshots.</p>';
  }
}

btnOpenScreenshots.addEventListener('click', async () => {
  screenshotsModal.classList.remove('hidden');
  const targetDate = agentDateInput ? agentDateInput.value : new Date().toISOString().split('T')[0];
  await loadAgentScreenshotsForDate(targetDate);
});

if (agentDateInput) {
  agentDateInput.addEventListener('change', async (e) => {
    await loadAgentScreenshotsForDate(e.target.value);
  });
}

btnCloseShots.addEventListener('click', () => screenshotsModal.classList.add('hidden'));

// Clock Out
btnClockOut.addEventListener('click', async () => {
  if (confirm("Are you sure you want to end today's work and clock out? Tracking will stop.")) {
    await ipcRenderer.invoke('clock-out-agent');
  }
});

// Login Form Submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');

  btnSubmit.disabled = true;
  btnText.textContent = 'Connecting...';
  btnSpinner.classList.remove('hidden');

  const serverUrl = serverUrlInput.value.trim().replace(/\/$/, '');
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const res = await ipcRenderer.invoke('agent-login', { serverUrl, email, password });

    if (res.success) {
      successBox.textContent = '✅ Login successful!';
      successBox.classList.remove('hidden');
      setTimeout(() => {
        showDashboardView({ user: res.user, isTracking: true, isPaused: false });
      }, 500);
    } else {
      errorBox.textContent = res.message || 'Login failed. Please check your credentials.';
      errorBox.classList.remove('hidden');
    }
  } catch (err) {
    errorBox.textContent = 'Server connection failed.';
    errorBox.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnText.textContent = 'Sign In & Connect';
    btnSpinner.classList.add('hidden');
  }
});

function showLoginView() {
  loginView.classList.remove('hidden');
  agentDashboardView.classList.add('hidden');
}

function showDashboardView(state) {
  loginView.classList.add('hidden');
  agentDashboardView.classList.remove('hidden');

  const name = state.user?.name || 'om';
  userName.textContent = name;

  if (state.currentTask) {
    currentTaskName = state.currentTask;
    taskInput.value = state.currentTask;
    displayTaskTitle.textContent = state.currentTask;
  }

  setRunningState(state.isTracking, state.isPaused, state.pauseReason);
}

ipcRenderer.on('agent-state-changed', (event, state) => {
  if (state.user) {
    showDashboardView(state);
  } else {
    showLoginView();
  }
});

async function loadAgentState() {
  const state = await ipcRenderer.invoke('get-agent-state');
  if (state.serverUrl) serverUrlInput.value = state.serverUrl;

  if (state.user) {
    showDashboardView(state);
  } else {
    showLoginView();
  }
}

loadAgentState();