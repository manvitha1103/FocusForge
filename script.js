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

function secondsToMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timeDisplay.textContent = secondsToMMSS(remainingSeconds);
}

function log(msg) {
  const li = document.createElement('li');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  li.textContent = `[${timeStr}] ${msg}`;
  logList.prepend(li);
  if (logList.children.length > 25) logList.removeChild(logList.lastChild);
}

function saveSettings() {
  sessionsBeforeLongBreak = parseInt(sessionGoalInput.value, 10);
  const settings = {
    focusDuration: parseInt(focusInput.value, 10),
    shortBreakDuration: parseInt(shortBreakInput.value, 10),
    longBreakDuration: parseInt(longBreakInput.value, 10),
    sessionsBeforeLongBreak: sessionsBeforeLongBreak,
  };
  localStorage.setItem('focusforge-settings', JSON.stringify(settings));
  log('Settings saved');
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('focusforge-settings'));
  if (settings) {
    focusInput.value = settings.focusDuration;
    shortBreakInput.value = settings.shortBreakDuration;
    longBreakInput.value = settings.longBreakDuration;
    sessionGoalInput.value = settings.sessionsBeforeLongBreak;
    sessionsBeforeLongBreak = settings.sessionsBeforeLongBreak;
  } else {
    sessionsBeforeLongBreak = parseInt(sessionGoalInput.value, 10);
  }
}

function loadSessionCount() {
  const savedDate = localStorage.getItem('focusforge-session-date');
  const today = new Date().toDateString();
  if (savedDate === today) {
    sessionCount = parseInt(localStorage.getItem('focusforge-session-count'), 10) || 0;
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

function setPhaseTime() {
  switch(currentPhase) {
    case 'focus':
      remainingSeconds = parseInt(focusInput.value, 10) * 60;
      break;
    case 'shortBreak':
      remainingSeconds = parseInt(shortBreakInput.value, 10) * 60;
      break;
    case 'longBreak':
      remainingSeconds = parseInt(longBreakInput.value, 10) * 60;
      break;
  }
  updateTimerDisplay();
}

function handlePhaseComplete() {
  if (currentPhase === 'focus') {
    sessionCount++;
    saveSessionCount();
    updateSessionCountUI();
    if (sessionCount % sessionsBeforeLongBreak === 0) {
      currentPhase = 'longBreak';
    } else {
      currentPhase = 'shortBreak';
    }
  } else {
    currentPhase = 'focus';
  }
  setPhaseTime();
  log(`Phase switched to ${currentPhase}`);
  playNotificationSound();
  showNotification();
  startTimer();
}

function startTimer() {
  if (isRunning) return;
  if (remainingSeconds <= 0) setPhaseTime();
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  timerId = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timerId);
      isRunning = false;
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      handlePhaseComplete();
    }
  }, 1000);
  log(`Timer started (${currentPhase})`);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerId);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  log('Timer paused');
}

function resetTimer() {
  clearInterval(timerId);
  isRunning = false;
  currentPhase = 'focus';
  setPhaseTime();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  log('Timer reset');
}

function skipTimer() {
  clearInterval(timerId);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  log(`Skipped phase "${currentPhase}"`);
  handlePhaseComplete();
}

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // AudioContext might be blocked on some browsers without user interaction
  }
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

