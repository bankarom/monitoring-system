const { ipcRenderer } = require('electron');

// Views
const loginView = document.getElementById('loginView');
const agentDashboardView = document.getElementById('agentDashboardView');
const loginForm = document.getElementById('loginForm');

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

// Screenshots Quick Viewer
btnOpenScreenshots.addEventListener('click', async () => {
  screenshotsModal.classList.remove('hidden');
  agentScreenshotsGrid.innerHTML = '<p class="loading-text">Loading screenshots...</p>';
  try {
    const list = await ipcRenderer.invoke('get-my-screenshots');
    if (!list || list.length === 0) {
      agentScreenshotsGrid.innerHTML = '<p class="empty-text">No screenshots taken today yet.</p>';
      return;
    }
    agentScreenshotsGrid.innerHTML = list
      .map(
        (s) => `
      <div class="shot-thumb-card">
        <img src="${s.filePath}" alt="${s.taskName || s.appName || 'Screen'}">
        <div class="meta">
          <p>${s.taskName || s.appName || 'Active Work'}</p>
          <span>${new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `
      )
      .join('');
  } catch (e) {
    agentScreenshotsGrid.innerHTML = '<p class="empty-text">Failed to load screenshots.</p>';
  }
});

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