let timer;
let isRunning = false;
let minutes = 25;
let seconds = 0;
let sessionCount = 0;
let isFocusSession = true;

const minutesDisplay = document.getElementById("minutes");
const secondsDisplay = document.getElementById("seconds");
const sessionCountDisplay = document.getElementById("sessionCount");

const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const resetButton = document.getElementById("reset");
const skipButton = document.getElementById("skip");

const focusDuration = 25; // Minutes
const breakDuration = 5;  // Minutes

function updateDisplay() {
  minutesDisplay.textContent = String(minutes).padStart(2, "0");
  secondsDisplay.textContent = String(seconds).padStart(2, "0");
}

function startTimer() {
  timer = setInterval(() => {
    if (seconds === 0 && minutes === 0) {
      clearInterval(timer);
      sessionCount++;
      sessionCountDisplay.textContent = sessionCount;
      alert(isFocusSession ? "Time for a break!" : "Back to work!");
      isFocusSession = !isFocusSession;
      minutes = isFocusSession ? focusDuration : breakDuration;
      seconds = 0;
      updateDisplay();
      startButton.disabled = false;
      pauseButton.disabled = true;
    } else {
      if (seconds === 0) {
        minutes--;
        seconds = 59;
      } else {
        seconds--;
      }
      updateDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  startButton.disabled = false;
  pauseButton.disabled = true;
}

function resetTimer() {
  clearInterval(timer);
  minutes = isFocusSession ? focusDuration : breakDuration;
  seconds = 0;
  updateDisplay();
  startButton.disabled = false;
  pauseButton.disabled = true;
}

function skipTimer() {
  clearInterval(timer);
  isFocusSession = !isFocusSession;
  minutes = isFocusSession ? focusDuration : breakDuration;
  seconds = 0;
  updateDisplay();
  startButton.disabled = false;
  pauseButton.disabled = true;
}

startButton.addEventListener("click", () => {
  startButton.disabled = true;
  pauseButton.disabled = false;
  startTimer();
});

pauseButton.addEventListener("click", () => {
  pauseTimer();
});

resetButton.addEventListener("click", () => {
  resetTimer();
});

skipButton.addEventListener("click", () => {
  skipTimer();
});

updateDisplay();

