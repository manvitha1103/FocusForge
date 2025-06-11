let timer;
let isRunning = false;
let timeLeft = 0;
let currentPhase = 'focus';
let sessionCount = 0;
let settings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
  sessionsBeforeLongBreak: 4
};

function initialize() {
  loadSettings();
  updateDisplay();
  log('Timer initialized.');
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  if (timeLeft <= 0) setPhase(currentPhase);
  timer = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) {
      clearInterval(timer);
      isRunning = false;
      nextPhase();
    }
    updateDisplay();
  }, 1000);
  log('Timer started.');
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  log('Timer paused.');
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  setPhase(currentPhase);
  log('Timer reset.');
}

function skipTimer() {
  clearInterval(timer);
  isRunning = false;
  nextPhase();
  log('Timer skipped.');
}

function setPhase(phase) {
  currentPhase = phase;
  let minutes = settings[phase];
  timeLeft = minutes * 60;
  document.getElementById('phase').textContent = capitalize(phase);
  updateDisplay();
}

function nextPhase() {
  if (currentPhase === 'focus') {
    sessionCount++;
    document.getElementById('sessionCount').textContent = sessionCount;
    currentPhase = (sessionCount % settings.sessionsBeforeLongBreak === 0) ? 'longBreak' : 'shortBreak';
  } else {
    currentPhase = 'focus';
  }
  setPhase(currentPhase);
}

function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('time').textContent = `${pad(minutes)}:${pad(seconds)}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function saveSettings() {
  settings.focus = parseInt(document.getElementById('focusInput').value);
  settings.shortBreak = parseInt(document.getElementById('shortBreakInput').value);
  settings.longBreak = parseInt(document.getElementById('longBreakInput').value);
  settings.sessionsBeforeLongBreak = parseInt(document.getElementById('sessionsBeforeLongBreak').value);
  localStorage.setItem('focusForgeSettings', JSON.stringify(settings));
  log('Settings saved.');
  resetTimer();
}

function loadSettings() {
  const saved = localStorage.getItem('focusForgeSettings');
  if (saved) settings = JSON.parse(saved);
  document.getElementById('focusInput').value = settings.focus;
  document.getElementById('shortBreakInput').value = settings.shortBreak;
  document.getElementById('longBreakInput').value = settings.longBreak;
  document.getElementById('sessionsBeforeLongBreak').value = settings.sessionsBeforeLongBreak;
}

function log(message) {
  const logList = document.getElementById('logList');
  const entry = document.createElement('li');
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logList.prepend(entry);
}

document.addEventListener('DOMContentLoaded', initialize);
