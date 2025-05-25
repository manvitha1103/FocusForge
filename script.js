// FocusForge Pomodoro Timer - Final iteration

class PomodoroTimer {
  constructor(settings, callbacks) {
    this.settings = settings;
    this.currentPhase = 'idle'; // idle, focus, shortBreak, longBreak
    this.secondsLeft = 0;
    this.sessionsCompleted = 0;
    this.timerInterval = null;
    this.isPaused = false;

    this.callbacks = callbacks || {};
  }

  start() {
    if (this.currentPhase === 'idle') {
      this.currentPhase = 'focus';
      this.secondsLeft = this.settings.focusLength * 60;
    }
    this.isPaused = false;
    this._tick();
    this.timerInterval = setInterval(() => this._tick(), 1000);
    this._log(`Started ${this.currentPhase} phase.`);
    this._updateUI();
  }

  pause() {
    if (this.timerInterval && !this.isPaused) {
      clearInterval(this.timerInterval);
      this.isPaused = true;
      this._log('Timer paused.');
      this._updateUI();
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.timerInterval = setInterval(() => this._tick(), 1000);
      this._log('Timer resumed.');
      this._updateUI();
    }
  }

  skip() {
    this._confirmAction('Skip current phase?', () => {
      this._log(`Skipped ${this.currentPhase} phase.`);
      this._nextPhase();
    });
  }

  reset() {
    this._confirmAction('Reset all sessions?', () => {
      clearInterval(this.timerInterval);
      this.currentPhase = 'idle';
      this.secondsLeft = 0;
      this.sessionsCompleted = 0;
      this.isPaused = false;
      this._saveSessionsCompleted();
      this._log('Session counter reset.');
      this._updateUI();
    });
  }

  stop() {
    clearInterval(this.timerInterval);
    this.currentPhase = 'idle';
    this.secondsLeft = 0;
    this.isPaused = false;
    this._log('Timer stopped.');
    this._updateUI();
  }

  _tick() {
    if (this.secondsLeft > 0) {
      this.secondsLeft--;
      this._updateUI();
    } else {
      this._phaseComplete();
    }
  }

  _phaseComplete() {
    this._playBeep();
    if (this.currentPhase === 'focus') {
      this.sessionsCompleted++;
      this._saveSessionsCompleted();
      this._log(`Focus session completed! Total completed: ${this.sessionsCompleted}.`);
      if (this.sessionsCompleted % this.settings.sessionsBeforeLongBreak === 0) {
        this.currentPhase = 'longBreak';
        this.secondsLeft = this.settings.longBreakLength * 60;
      } else {
        this.currentPhase = 'shortBreak';
        this.secondsLeft = this.settings.shortBreakLength * 60;
      }
    } else {
      // After break, start focus again
      this.currentPhase = 'focus';
      this.secondsLeft = this.settings.focusLength * 60;
      this._log(`Break ended. Starting focus session.`);
    }
    this._updateUI();
  }

  _nextPhase() {
    clearInterval(this.timerInterval);
    if (this.currentPhase === 'focus') {
      this.sessionsCompleted++;
      this._saveSessionsCompleted();
      if (this.sessionsCompleted % this.settings.sessionsBeforeLongBreak === 0) {
        this.currentPhase = 'longBreak';
        this.secondsLeft = this.settings.longBreakLength * 60;
      } else {
        this.currentPhase = 'shortBreak';
        this.secondsLeft = this.settings.shortBreakLength * 60;
      }
    } else {
      this.currentPhase = 'focus';
      this.secondsLeft = this.settings.focusLength * 60;
    }
    this.isPaused = false;
    this._log(`Switched to ${this.currentPhase} phase.`);
    this._updateUI();
    this.start();
  }

  _updateUI() {
    if (this.callbacks.update) {
      this.callbacks.update({
        phase: this.currentPhase,
        timeLeft: this.secondsLeft,
        sessionsCompleted: this.sessionsCompleted,
        isPaused: this.isPaused,
      });
    }
  }

  _log(message) {
    if (this.callbacks.log) {
      this.callbacks.log(message);
    }
  }

  _saveSessionsCompleted() {
    localStorage.setItem('sessionsCompleted', this.sessionsCompleted);
  }

  loadSessionsCompleted() {
    const saved = parseInt(localStorage.getItem('sessionsCompleted'));
    if (!isNaN(saved)) {
      this.sessionsCompleted = saved;
    }
  }

  _playBeep() {
    // Simple beep sound using Web Audio API
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }

  _confirmAction(message, onConfirm) {
    if (this.callbacks.confirm) {
      this.callbacks.confirm(message, onConfirm);
    } else {
      if (confirm(message)) onConfirm();
    }
  }
}

// Application state & UI logic

const defaultSettings = {
  focusLength: 25,
  shortBreakLength: 5,
  longBreakLength: 15,
  sessionsBeforeLongBreak: 4,
};

let timer;
let settings = {...defaultSettings};

const elements = {
  menu: document.getElementById('menu'),
  timerSection: document.getElementById('timer'),
  settingsSection: document.getElementById('settings'),
  phaseDisplay: document.getElementById('phaseDisplay'),
  timeDisplay: document.getElementById('timeDisplay'),
  sessionCountDisplay: document.getElementById('sessionCountDisplay'),
  startBtn: document.getElementById('startBtn'),
  resetBtn: document.getElementById('resetBtn'),
  exitBtn: document.getElementById('exitBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  resumeBtn: document.getElementById('resumeBtn'),
  skipBtn: document.getElementById('skipBtn'),
  stopBtn: document.getElementById('stopBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsForm: document.getElementById('settingsForm'),
  cancelSettingsBtn: document.getElementById('cancelSettingsBtn'),
  modal: document.getElementById('modal'),
  modalMessage: document.getElementById('modalMessage'),
  modalConfirm: document.getElementById('modalConfirm'),
  modalCancel: document.getElementById('modalCancel'),
  logList: document.getElementById('logList'),
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('pomodoroSettings');
    if (saved) {
      settings = JSON.parse(saved);
    }
  } catch {
    settings = {...defaultSettings};
  }
}

function saveSettings() {
  localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
}

function showView(view) {
  ['menu', 'timer', 'settings'].forEach(id => {
    elements[id].classList.toggle('active', id === view);
  });
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateUI({ phase, timeLeft, sessionsCompleted, isPaused }) {
  elements.phaseDisplay.textContent = phase === 'idle' ? 'Idle' :
    phase === 'focus' ? 'Focus' :
    phase === 'shortBreak' ? 'Short Break' :
    'Long Break';

  elements.timeDisplay.textContent = formatTime(timeLeft);
  elements.sessionCountDisplay.textContent = `Sessions completed today: ${sessionsCompleted}`;

  // Enable/disable buttons
  elements.pauseBtn.disabled = (phase === 'idle' || isPaused);
  elements.resumeBtn.disabled = (phase === 'idle' || !isPaused);
  elements.skipBtn.disabled = (phase === 'idle');
  elements.startBtn.disabled = (phase !== 'idle');
}

function logActivity(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
  elements.logList.prepend(li);
  if (elements.logList.children.length > 50) {
    elements.logList.removeChild(elements.logList.lastChild);
  }
}

function showModal(message, onConfirm) {
  elements.modalMessage.textContent = message;
  elements.modal.classList.remove('hidden');

  function cleanup() {
    elements.modal.classList.add('hidden');
    elements.modalConfirm.removeEventListener('click', confirmHandler);
    elements.modalCancel.removeEventListener('click', cancelHandler);
  }

  function confirmHandler() {
    cleanup();
    onConfirm();
  }

  function cancelHandler() {
    cleanup();
  }

  elements.modalConfirm.addEventListener('click', confirmHandler);
  elements.modalCancel.addEventListener('click', cancelHandler);
}

// Initialize

function initializeApp() {
  loadSettings();

  timer = new PomodoroTimer(settings, {
    update: updateUI,
    log: logActivity,
    confirm: showModal,
  });

  timer.loadSessionsCompleted();
  updateUI({
    phase: timer.currentPhase,
    timeLeft: timer.secondsLeft,
    sessionsCompleted: timer.sessionsCompleted,
    isPaused: timer.isPaused,
  });

  // Load settings into form
  elements.settingsForm.focusLength.value = settings.focusLength;
  elements.settingsForm.shortBreakLength.value = settings.shortBreakLength;
  elements.settingsForm.longBreakLength.value = settings.longBreakLength;
  elements.settingsForm.sessionsBeforeLongBreak.value = settings.sessionsBeforeLongBreak;

  showView('menu');

  // Event Listeners

  elements.startBtn.addEventListener('click', () => {
    showView('timer');
    timer.start();
  });

  elements.resetBtn.addEventListener('click', () => {
    timer.reset();
    updateUI({
      phase: timer.currentPhase,
      timeLeft: timer.secondsLeft,
      sessionsCompleted: timer.sessionsCompleted,
      isPaused: timer.isPaused,
    });
  });

  elements.exitBtn.addEventListener('click', () => {
    timer.stop();
    showView('menu');
  });

  elements.pauseBtn.addEventListener('click', () => timer.pause());
  elements.resumeBtn.addEventListener('click', () => timer.resume());
  elements.skipBtn.addEventListener('click', () => timer.skip());
  elements.stopBtn.addEventListener('click', () => {
    timer.stop();
    showView('menu');
  });

  elements.settingsBtn.addEventListener('click', () => {
    // Populate settings form with current values
    elements.settingsForm.focusLength.value = settings.focusLength;
    elements.settingsForm.shortBreakLength.value = settings.shortBreakLength;
    elements.settingsForm.longBreakLength.value = settings.longBreakLength;
    elements.settingsForm.sessionsBeforeLongBreak.value = settings.sessionsBeforeLongBreak;

    showView('settings');
  });

  elements.cancelSettingsBtn.addEventListener('click', () => {
    showView('menu');
  });

  elements.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Validate and save settings
    settings.focusLength = Number(elements.settingsForm.focusLength.value);
    settings.shortBreakLength = Number(elements.settingsForm.shortBreakLength.value);
    settings.longBreakLength = Number(elements.settingsForm.longBreakLength.value);
    settings.sessionsBeforeLongBreak = Number(elements.settingsForm.sessionsBeforeLongBreak.value);

    saveSettings();

    timer.settings = {...settings};

    logActivity('Settings updated.');

    showView('menu');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (elements.timerSection.classList.contains('active')) {
      switch (e.key.toLowerCase()) {
        case 'p':
          if (!timer.isPaused) timer.pause();
          else timer.resume();
          break;
        case 's':
          timer.skip();
          break;
        case 'q':
          timer.stop();
          showView('menu');
          break;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', initializeApp);
