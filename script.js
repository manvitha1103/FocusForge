const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');

const sessionCountElem = document.getElementById('sessionCount');
const logList = document.getElementById('logList');

const focusInput = document.getElementById('focusInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const sessionGoalInput = document.getElementById('sessionGoalInput');
const saveSettingsBtn = document.getElementById('saveSettings');

let timer = null;
let totalSeconds = 0;
let remainingSeconds = 0;
let isRunning = false;

let currentPhase = 'focus'; 
let sessionCount = 0;       /
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
    sessionsBeforeLongBreak: sessionsBeforeLongBreak,
  };
  localStorage.setItem('focusforge-settings', JSON.stringify(settings));
  log(`Settings saved.`);
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
  sessionCountElem.textContent = sessionCount;
}

function log(message) {
  const li = document.createElement('li');
  const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  li.textContent = `[${timeStr}] ${message}`;
  logList.prepend(li);

  if (logList.children.length > 20) {
    logList.removeChild(logList.lastChild);
  }
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
    switchPhase();
  }

  isRunning = true;
  timer = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();
    } else {
      clearInterval(timer);
      isRunning = false;
      onPhaseComplete();
    }
  }, 1000);

  log(`Started ${currentPhase} session.`);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
  log(`Paused timer.`);
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  remainingSeconds = 0;
  currentPhase = 'focus';
  updateTimerDisplay();
  log(`Timer reset.`);
}

function skipTimer() {
  if (isRunning) {
    clearInterval(timer);
    isRunning = false;
  }
  log(`Skipped current phase.`);
  switchPhase();
  startTimer();
}

function switchPhase() {
  if (currentPhase === 'focus') {
    sessionCount++;
    saveSessionCount();
    updateSessionCountUI();

    if (sessionCount % sessionsBeforeLongBreak === 0) {
      currentPhase = 'longBreak';
      remainingSeconds = parseInt(longBreakInput.value) * 60;
    } else {
      currentPhase = 'shortBreak';
      remainingSeconds = parseInt(shortBreakInput.value) * 60;
    }
  } else {
    currentPhase = 'focus';
    remainingSeconds = parseInt(focusInput.value) * 60;
  }
  updateTimerDisplay();
  log(`Switched to ${currentPhase} phase.`);
  playSound();
}

function playSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.2);
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; 
  switch(e.key.toLowerCase()) {
    case 's': 
      startTimer();
      break;
    case 'p':
      pauseTimer();
      break;
    case 'r': 
      resetTimer();
      break;
    case 'k': 
      skipTimer();
      break;
  }
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
skipBtn.addEventListener('click', skipTimer);
saveSettingsBtn.addEventListener('click', () => {
  saveSettings();
  resetTimer();
});

function init() {
  loadSettings();
  loadSessionCount();

  remainingSeconds = parseInt(focusInput.value) * 60;
  updateTimerDisplay();

  log('App initialized.');
}

init();
