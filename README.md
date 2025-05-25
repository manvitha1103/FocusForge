# FocusForge Pomodoro Timer

FocusForge is a simple, lightweight Pomodoro timer designed to help high school students improve focus and manage time effectively. The app is offline-capable and features structured work sessions, breaks, session counting, and settings customization.

## Features
- 25-minute focus sessions (customizable)
- 5-minute short breaks (customizable)
- 15-minute long breaks after a configurable number of sessions
- Session counter with daily tracking stored in localStorage
- Basic menu system for starting, resetting, and exiting
- Settings panel to customize session lengths and breaks
- Accessibility features including keyboard shortcuts and modals for confirmations
- Activity log panel for real-time feedback

## Technologies Used
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- LocalStorage for persistence

## How to Use
1. Open `index.html` in any modern browser.
2. Use the menu to start Pomodoro sessions.
3. Adjust settings via the Settings panel.
4. Use keyboard shortcuts:
   - **P**: Pause/Resume
   - **S**: Skip current phase
   - **Q**: Quit and return to menu

## Development Notes
- Timer logic is encapsulated in a `PomodoroTimer` class.
- UI updates and logging are handled via callback functions.
- The app persists user settings and session count locally.

## License
This project is open-source and free to use.

---

Created by Manvitha PK and Hreehan M
