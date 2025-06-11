const timeDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');
const sessionCountElem = document.getElementById('sessionCounter');
const logList = document.getElementById('logList');
const focusInput = document.getElementById('focusInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const sessionGoalInput = document.getElementById('sessionGoalInput');
const saveSettingsBtn = document.getElementById('saveSettings');

let timerId = null;
let remainingSeconds = 0;
let isRunning = false;
let currentPhase = 'focus';
let sessionCount = 0;
let sessionsBeforeLongBreak = 4;

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('focusforge-settings'));
  if (settings) {
    focusInput.value = settings.focusDuration;
    shortBreakInput.value = settings.shortBreakDuration;
    longBreakInput.value = settings.longBreakDuration;
    sessionGoalInput.value = settings.sessionsBeforeLongBreak;
    sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak;
  } else {
    sessionsBeforeLongBreak = parseInt(sessionGoalInput.value);
  }
}

function saveSettings() {
  sessionsBeforeLongBreak = parseInt(sessionGoalInput.value);
  const settings = {
    focusDuration: parseInt(focusInput.value),
    shortBreakDuration: parseInt(shortBreakInput.value),
    longBreakDuration: parseInt(longBreakInput.value),
    sessionsBeforeLongBreak: sessionsBeforeLongBreak
  };
  localStorage.setItem('focusforge-settings', JSON.stringify(settings));
  log('Settings saved');
}

function loadSessionCount() {
  const savedDate = localStorage.getItem('focusforge-session-date');
  const today = new Date().toDateString();
  if (savedDate === today) {
    sessionCount = parseInt(localStorage.getItem('focusforge-session-count')) || 0;
  } else {
    sessionCount = 0;
    localStorage.setItem('focusforge-session-date', today);
    localStorage.setItem('focusforge-session-count', '0');
  }
  updateSessionCountUI();
}

function saveSessionCount() {
  localStorage.setItem('focusforge-session-count', sessionCount.toString());
  localStorage.setItem('focusforge-session-date', new Date().toDateString());
}

function updateSessionCountUI() {
  sessionCountElem.textContent = `Sessions Completed: ${sessionCount}`;
}

function log(msg) {
  const li = document.createElement('li');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  li.textContent = `[${timeStr}] ${msg}`;
  logList.prepend(li);
  if (logList.children.length > 25) logList.removeChild(logList.lastChild);
}

function secondsToMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timeDisplay.textContent = secondsToMMSS(remainingSeconds);
}

function startTimer() {
  if (isRunning) return;
  if (remainingSeconds === 0) {
    setPhaseTime();
  }
  isRunning = true;
  timerId = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerId);
      isRunning = false;
      handlePhaseComplete();
    }
  }, 1000);
  log(`Started ${currentPhase} phase`);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerId);
  isRunning = false;
  log('Timer paused');
}

function resetTimer() {
  clearInterval(timerId);
  isRunning = false;
  currentPhase = 'focus';
  remainingSeconds = parseInt(focusInput.value) * 60;
  updateTimerDisplay();
  log('Timer reset');
}

function skipTimer() {
  clearInterval(timerId);
  isRunning = false;
  log('Skipped current phase');
  nextPhase();
  startTimer();
}

function setPhaseTime() {
  switch(currentPhase) {
    case 'focus':
      remainingSeconds = parseInt(focusInput.value) * 60;
      break;
    case 'shortBreak':
      remainingSeconds = parseInt(shortBreakInput.value) * 60;
      break;
    case 'longBreak':
      remainingSeconds = parseInt(longBreakInput.value) * 60;
      break;
  }
  updateTimerDisplay();
}

function nextPhase() {
  if (currentPhase === 'focus') {
    sessionCount++;
    saveSessionCount();
    updateSessionCountUI();
    currentPhase = (sessionCount % sessionsBeforeLongBreak === 0) ? 'longBreak' : 'shortBreak';
  } else {
    currentPhase = 'focus';
  }
  setPhaseTime();
  log(`Switched to ${currentPhase} phase`);
  playNotificationSound();
  showNotification();
}

function handlePhaseComplete() {
  nextPhase();
  startTimer();
}

function playNotificationSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.25);
}

function showNotification() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("FocusForge", { body: `Phase "${currentPhase}" started!` });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("FocusForge", { body: `Phase "${currentPhase}" started!` });
      }
    });
  }
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', skipTimer);
saveSettingsBtn.addEventListener('click', () => {
  saveSettings();
  resetTimer();
});

window.addEventListener('load', () => {
  loadSettings();
  loadSessionCount();
  resetTimer();
  log('App initialized');
});
