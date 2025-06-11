const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const focusInput = document.getElementById('focusInput');
const shortBreakInput = document.getElementById('shortBreakInput');
const longBreakInput = document.getElementById('longBreakInput');
const sessionsBeforeLongBreakInput = document.getElementById('sessionsBeforeLongBreakInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const sessionsCompletedDisplay = document.getElementById('sessionsCompleted');

let timer = null;
let remainingSeconds = 0;
let isRunning = false;
let currentPhase = 'focus'; // 'focus', 'shortBreak', 'longBreak'
let sessionsCompleted = 0;

function secondsToMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = secondsToMMSS(remainingSeconds);
}

function setPhaseTime() {
  switch (currentPhase) {
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

function updateSessionsCompleted() {
  sessionsCompletedDisplay.textContent = sessionsCompleted;
}

function handlePhaseComplete() {
  if (currentPhase === 'focus') {
    sessionsCompleted++;
    updateSessionsCompleted();
    if (sessionsCompleted % parseInt(sessionsBeforeLongBreakInput.value, 10) === 0) {
      currentPhase = 'longBreak';
    } else {
      currentPhase = 'shortBreak';
    }
  } else {
    currentPhase = 'focus';
  }
  setPhaseTime();
  startTimer();
}

function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds--;
    updateTimerDisplay();
  } else {
    clearInterval(timer);
    isRunning = false;
    handlePhaseComplete();
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timer = setInterval(tick, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;
}

function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  currentPhase = 'focus';
  remainingSeconds = parseInt(focusInput.value, 10) * 60;
  updateTimerDisplay();
  sessionsCompleted = 0;
  updateSessionsCompleted();
}

function skipTimer() {
  clearInterval(timer);
  isRunning = false;
  handlePhaseComplete();
}

function saveSettings() {
  resetTimer();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', () => {
  pauseTimer();
  pauseBtn.disabled = true;
  startBtn.disabled = false;
});
resetBtn.addEventListener('click', () => {
  resetTimer();
  pauseBtn.disabled = true;
  startBtn.disabled = false;
});
skipBtn.addEventListener('click', () => {
  skipTimer();
  pauseBtn.disabled = true;
  startBtn.disabled = false;
});
saveSettingsBtn.addEventListener('click', () => {
  saveSettings();
  pauseBtn.disabled = true;
  startBtn.disabled = false;
});

// Initialize
resetTimer();
pauseBtn.disabled = true;
updateSessionsCompleted();

