document.addEventListener('DOMContentLoaded', () => {
  const timerDisplay = document.getElementById('timer-display');
  const statusDisplay = document.getElementById('status');
  const sessionCountDisplay = document.getElementById('session-count');
  const progressBar = document.getElementById('progress-bar');

  const startBtn = document.getElementById('start');
  const pauseBtn = document.getElementById('pause');
  const resetBtn = document.getElementById('reset');
  const skipBtn = document.getElementById('skip');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const workInput = document.getElementById('work-duration');
  const restInput = document.getElementById('rest-duration');
  const longBreakInput = document.getElementById('long-break-duration');
  const sessionsBeforeLongInput = document.getElementById('sessions-before-long');
  const modeToggle = document.getElementById('modeToggle');
  const muteSoundBtn = document.getElementById('muteSound');
  const volumeSlider = document.getElementById('sound-volume');

  let workDuration = 25 * 60;
  let restDuration = 5 * 60;
  let longBreakDuration = 15 * 60;
  let sessionsBeforeLong = 4;
  let timeLeft = workDuration;
  let timer = null;
  let isRunning = false;
  let isWork = true;
  let sessionCount = 0;
  let muted = false;
  let volume = 0.1;

  function beep() {
    if (muted) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'square';
    oscillator.frequency.value = 880;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
    oscillator.onended = () => ctx.close();
  }

  function format(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  function updateTitle() {
    document.title = (isWork ? 'Work' : 'Rest') + ' - ' + format(timeLeft);
  }

  function updateProgress() {
    let total = isWork ? workDuration : restDuration;
    if (!isWork && sessionCount % sessionsBeforeLong === 0 && sessionCount !== 0) {
      total = longBreakDuration;
    }
    if (isWork && sessionCount !== 0 && sessionCount % sessionsBeforeLong === 0) {
      total = longBreakDuration;
    }
    const elapsed = total - timeLeft;
    const percent = (elapsed / total) * 100;
    progressBar.style.width = percent + '%';
  }

  function updateDisplay() {
    timerDisplay.textContent = format(timeLeft);
    if (isWork) {
      statusDisplay.textContent = 'Work session';
      timerDisplay.style.color = document.body.classList.contains('dark') ? '#f87171' : '#ef4444';
    } else {
      statusDisplay.textContent = sessionCount % sessionsBeforeLong === 0 && sessionCount !== 0 ? 'Long break' : 'Rest session';
      timerDisplay.style.color = document.body.classList.contains('dark') ? '#60a5fa' : '#3b82f6';
    }
    sessionCountDisplay.textContent = `Sessions completed: ${sessionCount}`;
    updateTitle();
    updateProgress();
  }

  function enableDisableButtons() {
    startBtn.disabled = isRunning;
    pauseBtn.disabled = !isRunning;
    workInput.disabled = isRunning;
    restInput.disabled = isRunning;
    longBreakInput.disabled = isRunning;
    sessionsBeforeLongInput.disabled = isRunning;
    saveSettingsBtn.disabled = isRunning;
    volumeSlider.disabled = isRunning;
    muteSoundBtn.disabled = isRunning;
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  function notifyUser(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/OOjs_UI_icon_alarm.svg/1024px-OOjs_UI_icon_alarm.svg.png' });
    }
  }

  function loadSettings() {
    const w = localStorage.getItem('workDuration');
    const r = localStorage.getItem('restDuration');
    const l = localStorage.getItem('longBreakDuration');
    const s = localStorage.getItem('sessionsBeforeLong');
    const vol = localStorage.getItem('volume');
    const mute = localStorage.getItem('muted');
    const darkMode = localStorage.getItem('darkMode');

    if (w) {
      workDuration = parseInt(w, 10);
      workInput.value = Math.floor(workDuration / 60);
    }
    if (r) {
      restDuration = parseInt(r, 10);
      restInput.value = Math.floor(restDuration / 60);
    }
    if (l) {
      longBreakDuration = parseInt(l, 10);
      longBreakInput.value = Math.floor(longBreakDuration / 60);
    }
    if (s) {
      sessionsBeforeLong = parseInt(s, 10);
      sessionsBeforeLongInput.value = sessionsBeforeLong;
    }
    if (vol) {
      volume = parseFloat(vol);
      volumeSlider.value = volume;
    }
    if (mute) {
      muted = mute === 'true';
      muteSoundBtn.textContent = muted ? '🔈' : '🔊';
    }
    if (darkMode === 'true') {
      document.body.classList.add('dark');
      modeToggle.textContent = '☀️';
    }
  }

  function saveSettings() {
    const w = parseInt(workInput.value, 10);
    const r = parseInt(restInput.value, 10);
    const l = parseInt(longBreakInput.value, 10);
    const s = parseInt(sessionsBeforeLongInput.value, 10);
    if (!Number.isInteger(w) || w <= 0 || !Number.isInteger(r) || r <= 0 || !Number.isInteger(l) || l <= 0 || !Number.isInteger(s) || s <= 0) {
      alert('Please enter positive integer values for all durations and sessions before long break.');
      return;
    }
    workDuration = w * 60;
    restDuration = r * 60;
    longBreakDuration = l * 60;
    sessionsBeforeLong = s;
    localStorage.setItem('workDuration', workDuration);
    localStorage.setItem('restDuration', restDuration);
    localStorage.setItem('longBreakDuration', longBreakDuration);
    localStorage.setItem('sessionsBeforeLong', sessionsBeforeLong);
    resetTimer();
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    enableDisableButtons();

    timer = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        updateDisplay();
      } else {
        beep();
        sessionCount++;
        notifyUser('Pomodoro Timer', isWork ? 'Work session completed! Time to rest.' : 'Break is over! Time to work.');
        if (isWork) {
          if (sessionCount % sessionsBeforeLong === 0) {
            timeLeft = longBreakDuration;
          } else {
            timeLeft = restDuration;
          }
          isWork = false;
        } else {
          timeLeft = workDuration;
          isWork = true;
        }
        updateDisplay();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timer);
    isRunning = false;
    enableDisableButtons();
  }

  function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    sessionCount = 0;
    isWork = true;
    timeLeft = workDuration;
    enableDisableButtons();
    updateDisplay();
  }

  function skipTimer() {
    clearInterval(timer);
    isRunning = false;

    if (isWork) {
      sessionCount++;
      if (sessionCount % sessionsBeforeLong === 0) {
        timeLeft = longBreakDuration;
      } else {
        timeLeft = restDuration;
      }
      isWork = false;
    } else {
      timeLeft = workDuration;
      isWork = true;
    }
    enableDisableButtons();
    updateDisplay();
  }

  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    modeToggle.textContent = isDark ? '☀️' : '🌙';
    updateDisplay();
  }

  function toggleMute() {
    muted = !muted;
    localStorage.setItem('muted', muted);
    muteSoundBtn.textContent = muted ? '🔈' : '🔊';
  }

  function updateVolume() {
    volume = parseFloat(volumeSlider.value);
    localStorage.setItem('volume', volume);
  }

  function handleKeydown(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (isRunning) pauseTimer();
      else startTimer();
    } else if (e.code === 'KeyS') {
      e.preventDefault();
      skipTimer();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      resetTimer();
    } else if (e.code === 'KeyD') {
      e.preventDefault();
      toggleDarkMode();
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      toggleMute();
    }
  }

  function init() {
    loadSettings();
    timeLeft = workDuration;
    updateDisplay();
    enableDisableButtons();
    requestNotificationPermission();
  }

  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  resetBtn.addEventListener('click', resetTimer);
  skipBtn.addEventListener('click', skipTimer);
  saveSettingsBtn.addEventListener('click', saveSettings);
  modeToggle.addEventListener('click', toggleDarkMode);
  muteSoundBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('input', updateVolume);
  document.addEventListener('keydown', handleKeydown);

  init();
});


