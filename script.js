(() => {
  // Elements
  const phaseLabel = document.getElementById('phase-label');
  const timerDisplay = document.getElementById('timer-display');
  const sessionCounterDisplay = document.getElementById('session-counter');

  const startBtn = document.getElementById('start-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const resumeBtn = document.getElementById('resume-btn');
  const skipBtn = document.getElementById('skip-btn');
  const resetBtn = document.getElementById('reset-btn');

  const settingsForm = document.getElementById('settings-form');
  const focusLengthInput = document.getElementById('focus-length');
  const shortBreakLengthInput = document.getElementById('short-break-length');
  const longBreakLengthInput = document.getElementById('long-break-length');
  const sessionsBeforeLongBreakInput = document.getElementById('sessions-before-long-break');

  const logList = document.getElementById('log-list');

  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');

  const alertSound = document.getElementById('alert-sound');

  // Timer state
  let timer = null;
  let endTime = 0;
  let paused = false;
  let remainingSeconds = 0;

  const PHASES = {
    FOCUS: 'Focus Session',
    SHORT_BREAK: 'Short Break',
    LONG_BREAK: 'Long Break',
  };

  let currentPhase = PHASES.FOCUS;
  let sessionsCompleted = 0;

  // Settings defaults
  let settings = {
    focusLength: 25, // minutes
    shortBreakLength: 5,
    longBreakLength: 15,
    sessionsBeforeLongBreak: 4,
  };

  // LocalStorage keys
  const LS_KEYS = {
    SETTINGS: 'focusforge_settings',
    SESSIONS_COMPLETED: 'focusforge_sessions_completed',
    LAST_SESSION_DATE: 'focusforge_last_session_date',
  };

  // Utility - format seconds as mm:ss
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  // Logging
  function logEvent(msg) {
    const li = document.createElement('li');
    li.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logList.prepend(li);
    // Keep only 30 entries
    if (logList.children.length > 30) {
      logList.removeChild(logList.lastChild);
    }
  }

  // Save/load settings
  function saveSettings() {
    localStorage.setItem(LS_KEYS.SETTINGS, JSON.stringify(settings));
    logEvent('Settings saved.');
  }

  function loadSettings() {
    const s = localStorage.getItem(LS_KEYS.SETTINGS);
    if (s) {
      try {
        const parsed = JSON.parse(s);
        settings = Object.assign(settings, parsed);
      } catch {
        // ignore parse errors
      }
    }
    // Update UI inputs
    focusLengthInput.value = settings.focusLength;
    shortBreakLengthInput.value = settings.shortBreakLength;
    longBreakLengthInput.value = settings.longBreakLength;
    sessionsBeforeLongBreakInput.value = settings.sessionsBeforeLongBreak;
  }

  // Save/load session count
  function saveSessions() {
    localStorage.setItem(LS_KEYS.SESSIONS_COMPLETED, sessionsCompleted);
    localStorage.setItem(LS_KEYS.LAST_SESSION_DATE, new Date().toDateString());
  }

  function loadSessions() {
    const savedDate = localStorage.getItem(LS_KEYS.LAST_SESSION_DATE);
    const today = new Date().toDateString();
    if (savedDate === today) {
      const count = parseInt(localStorage.getItem(LS_KEYS.SESSIONS_COMPLETED));
      if (!isNaN(count)) {
        sessionsCompleted = count;
      }
    } else {
      sessionsCompleted = 0; // Reset daily
      saveSessions();
    }
    updateSessionCounter();
  }

  // Update UI session counter
  function updateSessionCounter() {
    sessionCounterDisplay.textContent = `Completed Sessions: ${sessionsCompleted}`;
  }

  // Update UI timer display and phase label color
  function updatePhaseLabel() {
    phaseLabel.textContent = currentPhase;
    switch(currentPhase) {
      case PHASES.FOCUS:
        phaseLabel.style.color = '#e74c3c'; // red
        timerDisplay.style.color = '#e74c3c';
        break;
      case PHASES.SHORT_BREAK:
        phaseLabel.style.color = '#2980b9'; // blue
        timerDisplay.style.color = '#2980b9';
        break;
      case PHASES.LONG_BREAK:
        phaseLabel.style.color = '#27ae60'; // green
        timerDisplay.style.color = '#27ae60';
        break;
    }
  }

  // Timer functions
  function startTimer(seconds) {
    clearInterval(timer);
    endTime = Date.now() + seconds * 1000;
    paused = false;

    updatePhaseLabel();
    updateTimerDisplay(seconds);

    timer = setInterval(() => {
      if (paused) return;

      const now = Date.now();
      let diff = Math.round((endTime - now) / 1000);
      if (diff < 0) diff = 0;

      updateTimerDisplay(diff);

      if (diff <= 0) {
        clearInterval(timer);
        alertSound.play();
        onPhaseComplete();
      }
    }, 250);
  }

  function updateTimerDisplay(seconds) {
    timerDisplay.textContent = formatTime(seconds);
  }

  // Phase transition logic
  function onPhaseComplete() {
    logEvent(`${currentPhase} completed.`);

    if (currentPhase === PHASES.FOCUS) {
      sessionsCompleted++;
      saveSessions();
      updateSessionCounter();

      // Decide next phase
      if (sessionsCompleted % settings.sessionsBeforeLongBreak === 0) {
        currentPhase = PHASES.LONG_BREAK;
      } else {
        currentPhase = PHASES.SHORT_BREAK;
      }
    } else {
      currentPhase = PHASES.FOCUS;
    }

    updatePhaseLabel();
    updateTimerDisplay(getCurrentPhaseDuration() * 60);

    logEvent(`Starting ${currentPhase.toLowerCase()}.`);

    // Auto-start next phase
    startTimer(getCurrentPhaseDuration() * 60);
  }

  // Get current phase duration in minutes
  function getCurrentPhaseDuration() {
    switch(currentPhase) {
      case PHASES.FOCUS:
        return settings.focusLength;
      case PHASES.SHORT_BREAK:
        return settings.shortBreakLength;
      case PHASES.LONG_BREAK:
        return settings.longBreakLength;
    }
  }

  // Button state updates
  function updateButtonsForState(state) {
    switch(state) {
      case 'idle':
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        skipBtn.disabled = true;
        resetBtn.disabled = false;
        break;
      case 'running':
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        resumeBtn.disabled = true;
        skipBtn.disabled = false;
        resetBtn.disabled = false;
        break;
      case 'paused':
        startBtn.disabled = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = false;
        skipBtn.disabled = false;
        resetBtn.disabled = false;
        break;
    }
  }

  // Event handlers
  startBtn.addEventListener('click', () => {
    logEvent(`Session started: ${currentPhase}`);
    startTimer(getCurrentPhaseDuration() * 60);
    updateButtonsForState('running');
  });

  pauseBtn.addEventListener('click', () => {
    if (timer) {
      paused = true;
      remainingSeconds = Math.round((endTime - Date.now()) / 1000);
      updateButtonsForState('paused');
      logEvent('Timer paused.');
    }
  });

  resumeBtn.addEventListener('click', () => {
    if (paused) {
      paused = false;
      endTime = Date.now() + remainingSeconds * 1000;
      updateButtonsForState('running');
      logEvent('Timer resumed.');
    }
  });

  skipBtn.addEventListener('click', () => {
    if (timer) {
      clearInterval(timer);
      alertSound.play();
      logEvent('Session skipped.');
      onPhaseComplete();
      updateButtonsForState('running');
    }
  });

  resetBtn.addEventListener('click', () => {
    // Confirm modal before resetting sessions
    showModal('Reset will stop the timer and reset completed sessions count. Continue?', () => {
      clearInterval(timer);
      timer = null;
      paused = false;
      currentPhase = PHASES.FOCUS;
      sessionsCompleted = 0;
      updateSessionCounter();
      updatePhaseLabel();
      updateTimerDisplay(getCurrentPhaseDuration() * 60);
      updateButtonsForState('idle');
      saveSessions();
      logEvent('Timer and session count reset.');
      hideModal();
    }, () => {
      hideModal();
      logEvent('Reset canceled.');
    });
  });

  // Settings form submit
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate inputs (basic)
    const focusVal = parseInt(focusLengthInput.value);
    const shortBreakVal = parseInt(shortBreakLengthInput.value);
    const longBreakVal = parseInt(longBreakLengthInput.value);
    const sessionsBeforeLong = parseInt(sessionsBeforeLongBreakInput.value);

    if (
      focusVal < 5 || focusVal > 90 ||
      shortBreakVal < 1 || shortBreakVal > 30 ||
      longBreakVal < 5 || longBreakVal >
