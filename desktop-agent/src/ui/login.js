const { ipcRenderer } = require('electron');

const loginView = document.getElementById('loginView');
const agentDashboardView = document.getElementById('agentDashboardView');
const loginForm = document.getElementById('loginForm');
const serverUrlInput = document.getElementById('serverUrl');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const errorBox = document.getElementById('errorBox');
const successBox = document.getElementById('successBox');

const btnMinimize = document.getElementById('btnMinimize');
const btnClose = document.getElementById('btnClose');

const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const userShift = document.getElementById('userShift');

const statusBanner = document.getElementById('statusBanner');
const statusText = document.getElementById('statusText');

const btnPauseToggle = document.getElementById('btnPauseToggle');
const btnResume = document.getElementById('btnResume');
const btnClockOut = document.getElementById('btnClockOut');

const reasonModal = document.getElementById('reasonModal');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnConfirmPause = document.getElementById('btnConfirmPause');
const pauseCommentInput = document.getElementById('pauseComment');

btnMinimize.addEventListener('click', () => ipcRenderer.send('window-minimize'));
btnClose.addEventListener('click', () => ipcRenderer.send('window-close'));

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
  const reason = selectedRadio ? selectedRadio.value : 'In a Meeting';
  const comment = pauseCommentInput.value.trim();

  await ipcRenderer.invoke('pause-agent', { reason, comment });
  reasonModal.classList.add('hidden');

  const state = await ipcRenderer.invoke('get-agent-state');
  updateUIStatus(state);
});

btnResume.addEventListener('click', async () => {
  await ipcRenderer.invoke('resume-agent');
  const state = await ipcRenderer.invoke('get-agent-state');
  updateUIStatus(state);
});

btnClockOut.addEventListener('click', async () => {
  if (confirm("End today's work session and clock out? Tracking will stop completely.")) {
    await ipcRenderer.invoke('clock-out-agent');
    showLoginView();
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');

  const serverUrl = serverUrlInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  btnSubmit.disabled = true;
  btnText.textContent = 'Connecting...';
  btnSpinner.classList.remove('hidden');

  const res = await ipcRenderer.invoke('agent-login', { serverUrl, email, password });

  btnSubmit.disabled = false;
  btnText.textContent = 'Connect & Start Tracking';
  btnSpinner.classList.add('hidden');

  if (res.success) {
    successBox.textContent = `Connected as ${res.user.name}. Starting...`;
    successBox.classList.remove('hidden');
    const state = await ipcRenderer.invoke('get-agent-state');
    showDashboardView(state);
  } else {
    errorBox.textContent = res.message || 'Login failed.';
    errorBox.classList.remove('hidden');
  }
});

loadAgentState();