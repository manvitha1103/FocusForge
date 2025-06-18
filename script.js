let timer = null;
let isRunning = false;
let currentPhase = 'focus';
let focusDuration = 25;
let shortBreak = 5;
let longBreak = 15;
let sessionsBeforeLong = 4;
let sessionCount = 0;
let completedFocusSessions = 0;
let remainingTime = focusDuration * 60;

const timeDisplay = document.getElementById("time");
const phaseLabel = document.getElementById("phase-label");
const sessionCountDisplay = document.getElementById("sessionCount");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const skipBtn = document.getElementById("skip");

const focusInput = document.getElementById("focusInput");
const shortBreakInput = document.getElementById("shortBreakInput");
const longBreakInput = document.getElementById("longBreakInput");
const sessionsBeforeLongInput = document.getElementById("sessionsBeforeLongInput");
const saveSettingsBtn = document.getElementById("saveSettings");

const modal = document.getElementById("confirmReset");
const modalYes = document.getElementById("confirmResetYes");
const modalNo = document.getElementById("confirmResetNo");

function updateDisplay() {
  const min = Math.floor(remainingTime / 60).toString().padStart(2, '0');
  const sec = (remainingTime % 60).toString().padStart(2, '0');
  timeDisplay.textContent = `${min}:${sec}`;
  phaseLabel.textContent = currentPhase === 'focus' ? 'Focus' : (currentPhase === 'shortBreak' ? 'Short Break' : 'Long Break');
}

function switchPhase() {
  if (currentPhase === 'focus') {
    completedFocusSessions++;
    sessionCount++;
    sessionCountDisplay.textContent = sessionCount;
    if (completedFocusSessions % sessionsBeforeLong === 0) {
      currentPhase = 'longBreak';
      remainingTime = longBreak * 60;
    } else {
      currentPhase = 'shortBreak';
      remainingTime = shortBreak * 60;
    }
  } else {
    currentPhase = 'focus';
    remainingTime = focusDuration * 60;
  }
  updateDisplay();
}

function tick() {
  if (remainingTime > 0) {
    remainingTime--;
    updateDisplay();
  } else {
    clearInterval(timer);
    isRunning = false;
    alert("Time's up! Switching phase.");
    switchPhase();
  }
}

function startTimer() {
  if (!isRunning) {
    timer = setInterval(tick, 1000);
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
  }
}

function pauseTimer() {
  clearInterval(timer);
  isRunning = false;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function resetTimer() {
  if (isRunning) pauseTimer();
  remainingTime = currentPhase === 'focus' ? focusDuration * 60 :
                  currentPhase === 'shortBreak' ? shortBreak * 60 :
                  longBreak * 60;
  updateDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
}

function skipPhase() {
  if (isRunning) pauseTimer();
  switchPhase();
  updateDisplay();
  startBtn.disabled = false;
}

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem('focusForgeSettings'));
  if (saved) {
    focusDuration = saved.focusDuration;
    shortBreak = saved.shortBreak;
    longBreak = saved.longBreak;
    sessionsBeforeLong = saved.sessionsBeforeLong;
    sessionCount = saved.sessionCount || 0;
    sessionCountDisplay.textContent = sessionCount;
    focusInput.value = focusDuration;
    shortBreakInput.value = shortBreak;
    longBreakInput.value = longBreak;
    sessionsBeforeLongInput.value = sessionsBeforeLong;
  }
}

function saveSettings() {
  focusDuration = parseInt(focusInput.value);
  shortBreak = parseInt(shortBreakInput.value);
  longBreak = parseInt(longBreakInput.value);
  sessionsBeforeLong = parseInt(sessionsBeforeLongInput.value);
  localStorage.setItem('focusForgeSettings', JSON.stringify({
    focusDuration,
    shortBreak,
    longBreak,
    sessionsBeforeLong,
    sessionCount
  }));
  resetTimer();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', () => modal.classList.remove('hidden'));
skipBtn.addEventListener('click', skipPhase);
saveSettingsBtn.addEventListener('click', saveSettings);

modalYes.addEventListener('click', () => {
  modal.classList.add('hidden');
  resetTimer();
});
modalNo.addEventListener('click', () => modal.classList.add('hidden'));

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    isRunning ? pauseTimer() : startTimer();
  } else if (e.code === 'KeyR') {
    resetTimer();
  } else if (e.code === 'KeyS') {
    skipPhase();
  }
});

loadSettings();
remainingTime = focusDuration * 60;
updateDisplay();
