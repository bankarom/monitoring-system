const { ipcRenderer } = require('electron');

const loginView = document.getElementById('loginView');
const agentDashboardView = document.getElementById('agentDashboardView');
const loginForm = document.getElementById('loginForm');

const serverUrlInput = document.getElementById('serverUrl');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');

const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');

const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userShift = document.getElementById('userShift');

const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');
const statActive = document.getElementById('statActive');
const statBreaks = document.getElementById('statBreaks');

const btnPauseToggle = document.getElementById('btnPauseToggle');
const btnResume = document.getElementById('btnResume');
const btnClockOut = document.getElementById('btnClockOut');

const reasonModal = document.getElementById('reasonModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnConfirmPause = document.getElementById('btnConfirmPause');
const pauseCommentInput = document.getElementById('pauseComment');

const btnRefreshScreenshots = document.getElementById('btnRefreshScreenshots');
const btnRefreshApps = document.getElementById('btnRefreshApps');
const screenshotsGrid = document.getElementById('screenshotsGrid');
const appsTableBody = document.getElementById('appsTableBody');

btnMinimize.addEventListener('click', () => ipcRenderer.send('window-minimize'));
btnClose.addEventListener('click', () => ipcRenderer.send('window-close'));

// TAB NAVIGATION LOGIC INSIDE DESKTOP AGENT
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

navItems.forEach((btn) => {
  btn.addEventListener('click', () => {
    navItems.forEach((n) => n.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.add('hidden'));

    btn.classList.add('active');
    const targetTab = btn.getAttribute('data-tab');
    const pane = document.getElementById(targetTab);
    if (pane) pane.classList.remove('hidden');

    if (targetTab === 'tabScreenshots') loadScreenshots();
    if (targetTab === 'tabApps') loadApps();
  });
});

async function loadScreenshots() {
  if (!screenshotsGrid) return;
  screenshotsGrid.innerHTML = '<p class="empty-text">Fetching screenshots...</p>';
  try {
    const list = await ipcRenderer.invoke('get-my-screenshots');
    if (!list || list.length === 0) {
      screenshotsGrid.innerHTML = '<p class="empty-text">No screenshots captured today yet.</p>';
      return;
    }

    screenshotsGrid.innerHTML = list
      .map(
        (s) => `
      <div class="shot-card">
        <img src="${s.filePath}" alt="${s.appName || 'Screen'}">
        <div class="shot-meta">
          <p>${s.appName || 'Desktop'}</p>
          <span>${new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `
      )
      .join('');
  } catch (e) {
    screenshotsGrid.innerHTML = '<p class="empty-text">Failed to load screenshots.</p>';
  }
}

async function loadApps() {
  if (!appsTableBody) return;
  appsTableBody.innerHTML = '<tr><td colspan="5" class="empty-text">Fetching app analytics...</td></tr>';
  try {
    const list = await ipcRenderer.invoke('get-my-analytics');
    if (!list || list.length === 0) {
      appsTableBody.innerHTML = '<tr><td colspan="5" class="empty-text">No software activity recorded yet.</td></tr>';
      return;
    }

    appsTableBody.innerHTML = list
      .map(
        (a) => `
      <tr>
        <td><strong>${a.appName}</strong></td>
        <td><span class="shift-badge">${a.category}</span></td>
        <td><strong>${a.minutes} mins</strong></td>
        <td>${a.clicks}</td>
        <td>${a.keystrokes}</td>
      </tr>
    `
      )
      .join('');
  } catch (e) {
    appsTableBody.innerHTML = '<tr><td colspan="5" class="empty-text">Failed to load activity.</td></tr>';
  }
}

if (btnRefreshScreenshots) btnRefreshScreenshots.addEventListener('click', loadScreenshots);
if (btnRefreshApps) btnRefreshApps.addEventListener('click', loadApps);

async function loadAgentState() {
  const state = await ipcRenderer.invoke('get-agent-state');
  if (state.serverUrl) serverUrlInput.value = state.serverUrl;

  if (state.user) {
    showDashboardView(state);
  } else {
    showLoginView();
  }
}

function showLoginView() {
  loginView.classList.remove('hidden');
  agentDashboardView.classList.add('hidden');
}

function showDashboardView(state) {
  loginView.classList.add('hidden');
  agentDashboardView.classList.remove('hidden');

  const name = state.user?.name || 'Employee';
  userName.textContent = name;
  userEmail.textContent = state.user?.email || '';
  if (userShift) userShift.textContent = `Shift: ${state.user?.shift || '10:00 AM to 7:00 PM'}`;
  userAvatar.textContent = name.charAt(0).toUpperCase();

  updateUIStatus(state);
}

function updateUIStatus(state) {
  if (statActive && state.activeHoursFormatted) statActive.textContent = state.activeHoursFormatted;
  if (statBreaks && state.idleHoursFormatted) statBreaks.textContent = state.idleHoursFormatted;

  if (state.isPaused) {
    statusBanner.className = 'status-banner paused';
    statusText.textContent = `🟡 Paused: ${state.pauseReason || 'Break'}`;
    btnPauseToggle.classList.add('hidden');
    btnResume.classList.remove('hidden');
  } else {
    statusBanner.className = 'status-banner active';
    statusText.textContent = '🟢 Tracking Active';
    btnPauseToggle.classList.remove('hidden');
    btnResume.classList.add('hidden');
  }
}

ipcRenderer.on('agent-state-changed', (event, state) => {
  if (state.user) {
    showDashboardView(state);
  } else {
    showLoginView();
  }
});

btnPauseToggle.addEventListener('click', () => {
  reasonModal.classList.remove('hidden');
});

btnCancelModal.addEventListener('click', () => {
  reasonModal.classList.add('hidden');
});

btnConfirmPause.addEventListener('click', async () => {
  const selectedRadio = document.querySelector('input[name="pauseReason"]:checked');
  const reason = selectedRadio ? selectedRadio.value : 'Break';
  const comment = pauseCommentInput ? pauseCommentInput.value : '';

  reasonModal.classList.add('hidden');
  await ipcRenderer.invoke('pause-agent', { reason, comment });
});

btnResume.addEventListener('click', async () => {
  await ipcRenderer.invoke('resume-agent');
});

btnClockOut.addEventListener('click', async () => {
  if (confirm('Are you sure you want to end today\'s work and clock out? Tracking will stop completely.')) {
    await ipcRenderer.invoke('clock-out-agent');
  }
});

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
      successBox.textContent = '✅ Login successful! Agent tracking started.';
      successBox.classList.remove('hidden');
      setTimeout(() => {
        showDashboardView({ user: res.user, isTracking: true, isPaused: false });
      }, 800);
    } else {
      errorBox.textContent = res.message || 'Login failed. Please check your credentials.';
      errorBox.classList.remove('hidden');
    }
  } catch (err) {
    errorBox.textContent = 'Network or server connection failed.';
    errorBox.classList.remove('hidden');
  } finally {
    btnSubmit.disabled = false;
    btnText.textContent = 'Connect & Start Tracking';
    btnSpinner.classList.add('hidden');
  }
});

loadAgentState();