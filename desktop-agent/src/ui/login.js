const { ipcRenderer } = require('electron');

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

btnMinimize.addEventListener('click', () => {
  ipcRenderer.send('window-minimize');
});

btnClose.addEventListener('click', () => {
  ipcRenderer.send('window-close');
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
  
  btnSubmit.disabled = true;
  btnText.textContent = 'Connecting...';
  btnSpinner.classList.remove('hidden');

  const serverUrl = serverUrlInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    const result = await ipcRenderer.invoke('agent-login', { serverUrl, email, password });
    if (result.success) {
      successBox.textContent = 'Login successful! Minimizing to tray...';
      successBox.classList.remove('hidden');
    } else {
      errorBox.textContent = result.message || 'Authentication failed';
      errorBox.classList.remove('hidden');
      btnSubmit.disabled = false;
      btnText.textContent = 'Connect & Start Tracking';
      btnSpinner.classList.add('hidden');
    }
  } catch (err) {
    errorBox.textContent = err.message || 'Failed to communicate with agent service';
    errorBox.classList.remove('hidden');
    btnSubmit.disabled = false;
    btnText.textContent = 'Connect & Start Tracking';
    btnSpinner.classList.add('hidden');
  }
});