/* js/app.js — To-Do List Life Dashboard behaviour */

/* =========================================================
   StorageService — thin wrapper around localStorage
   Centralises all localStorage access so no other module
   calls localStorage directly. Exposed on window.__test
   for use by the test harness.
   Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4
   ========================================================= */
var StorageService = (function () {
  'use strict';

  /**
   * Read and parse a JSON value from localStorage.
   * Returns the parsed object, or null when:
   *   - the key is absent
   *   - the stored string is not valid JSON (error is swallowed; a
   *     console.warn is emitted so developers can spot corrupt data)
   *
   * @param {string} key
   * @returns {*|null}
   */
  function read(key) {
    var raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn(
        '[StorageService] Could not parse value for key "' + key + '": ' + e.message
      );
      return null;
    }
  }

  /**
   * Serialise value to JSON and write it to localStorage.
   * If localStorage is unavailable (private-browsing quota exceeded,
   * storage full, SecurityError), the DOMException is caught and a
   * console.warn is emitted. The caller's in-memory state is left
   * intact so the UI remains functional for the current session.
   *
   * @param {string} key
   * @param {*} value  — must be JSON-serialisable
   * @returns {void}
   */
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(
        '[StorageService] Could not write key "' + key + '": ' + e.message
      );
    }
  }

  /**
   * Remove a key from localStorage.
   *
   * @param {string} key
   * @returns {void}
   */
  function remove(key) {
    localStorage.removeItem(key);
  }

  return { read: read, write: write, remove: remove };
}());

/* Expose pure-function / module references for the test harness.
   Production code never reads window.__test.                       */
window.__test = window.__test || {};
window.__test.StorageService = StorageService;

/* =========================================================
   GreetingModule helpers — pure functions (no DOM access)
   getGreeting  : Requirements 1.3, 1.4, 1.5
   formatDate   : Requirement  1.2
   ========================================================= */

/**
 * Return a time-of-day greeting for the given hour (0–23).
 *
 * Ranges:
 *   05–11 → "Good Morning"
 *   12–17 → "Good Afternoon"
 *   18–23, 00–04 → "Good Evening"
 *
 * @param {number} hour  Integer in 0–23 (inclusive)
 * @returns {"Good Morning"|"Good Afternoon"|"Good Evening"}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  return 'Good Evening'; // covers 18–23 and 00–04
}

/**
 * Format a Date object as "DayName, DD MonthName YYYY".
 * Uses locale-independent hard-coded arrays so the output is
 * identical regardless of the browser's locale setting.
 *
 * Example: new Date(2025, 9, 26) → "Sunday, 26 October 2025"
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  var DAY_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var dayName   = DAY_NAMES[date.getDay()];
  var day       = date.getDate();
  var monthName = MONTH_NAMES[date.getMonth()];
  var year      = date.getFullYear();

  // Zero-pad the day to two digits (e.g. 5 → "05")
  var dd = day < 10 ? '0' + day : '' + day;

  return dayName + ', ' + dd + ' ' + monthName + ' ' + year;
}

/* Expose helpers on window.__test for the test harness */
window.__test.getGreeting = getGreeting;
window.__test.formatDate  = formatDate;

/* =========================================================
   GreetingModule — live clock, date, and greeting display
   Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
   ========================================================= */
var GreetingModule = (function () {
  'use strict';

  /** @type {number|null} setInterval handle */
  var _intervalId = null;

  /**
   * Zero-pad a number to two digits.
   * @param {number} n
   * @returns {string}
   */
  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /**
   * Read the current time from the system clock, then update the
   * three Greeting section DOM elements:
   *   #clock        — "HH:MM:SS" (24-hour, zero-padded)
   *   #date         — e.g. "Monday, 26 October 2025"
   *   #greeting-text — e.g. "Good Morning"
   *
   * This is a pure-DOM-write function; it never schedules anything.
   * Keeping scheduling in start() makes tick() independently testable.
   */
  function tick() {
    var now = new Date();

    var hh = pad2(now.getHours());
    var mm = pad2(now.getMinutes());
    var ss = pad2(now.getSeconds());

    var clockEl    = document.getElementById('clock');
    var dateEl     = document.getElementById('date');
    var greetingEl = document.getElementById('greeting-text');

    if (clockEl)    clockEl.textContent    = hh + ':' + mm + ':' + ss;
    if (dateEl)     dateEl.textContent     = formatDate(now);
    if (greetingEl) greetingEl.textContent = getGreeting(now.getHours());
  }

  /**
   * Start the greeting module:
   *  1. Call tick() immediately so the clock shows the correct time
   *     with no visible delay after DOMContentLoaded.
   *  2. Schedule tick() to fire every 1 000 ms so the clock stays live
   *     and greeting transitions happen within ≤ 1 second of an hour
   *     boundary (Requirements 1.6, 1.7).
   *
   * If start() is called more than once (e.g. during testing), the
   * previous interval is cleared first to avoid duplicate ticks.
   */
  function start() {
    if (_intervalId !== null) {
      clearInterval(_intervalId);
    }
    tick();
    _intervalId = setInterval(tick, 1000);
  }

  return { start: start, tick: tick };
}());

/* Expose GreetingModule on window.__test for the test harness */
window.__test.GreetingModule = GreetingModule;

/* =========================================================
   TimerModule — 25-minute Pomodoro countdown timer
   Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9

   Finite-State Machine
   --------------------
   States:   IDLE | RUNNING | PAUSED | DONE

   Transitions:
     init()   → IDLE,    remaining = 1500 s
     start()  → IDLE|PAUSED → RUNNING   (no-op if RUNNING or DONE)
     stop()   → RUNNING → PAUSED        (no-op otherwise)
     reset()  → any → IDLE,   remaining = 1500 s, clears interval
     tick()   → called by setInterval every 1 000 ms while RUNNING;
                decrements remaining; transitions to DONE at 0

   Control state table (Requirement 2.7):
     IDLE    → Start enabled,  Stop disabled
     RUNNING → Start disabled, Stop enabled
     PAUSED  → Start enabled,  Stop disabled
     DONE    → Start disabled, Stop disabled
   ========================================================= */

var TimerModule = (function () {
  'use strict';

  /* ── Constants ─────────────────────────────────────────── */
  var TOTAL_SECONDS = 1500;       // 25 minutes

  var STATE_IDLE    = 'IDLE';
  var STATE_RUNNING = 'RUNNING';
  var STATE_PAUSED  = 'PAUSED';
  var STATE_DONE    = 'DONE';

  /* ── Module-scoped state ────────────────────────────────── */

  /** @type {'IDLE'|'RUNNING'|'PAUSED'|'DONE'} */
  var _state = STATE_IDLE;

  /** Remaining countdown in seconds */
  var _remaining = TOTAL_SECONDS;

  /**
   * Handle returned by setInterval.
   * A single variable ensures we never create duplicate intervals —
   * start() always calls clearInterval(_intervalId) before creating
   * a new one (Requirement 2.7).
   * @type {number|null}
   */
  var _intervalId = null;

  /* ── DOM helpers ────────────────────────────────────────── */

  /**
   * Zero-pad a number to two digits.
   * @param {number} n
   * @returns {string}
   */
  function _pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /**
   * Update the #timer-display element with the current remaining time
   * in MM:SS format (Requirement 2.3).
   */
  function _updateDisplay() {
    var el = document.getElementById('timer-display');
    if (!el) return;
    var mins = Math.floor(_remaining / 60);
    var secs = _remaining % 60;
    el.textContent = _pad2(mins) + ':' + _pad2(secs);
  }

  /**
   * Enable or disable the Start and Stop buttons to match the
   * current FSM state, following the control table (Requirement 2.7).
   */
  function _updateControls() {
    var startBtn = document.getElementById('timer-start');
    var stopBtn  = document.getElementById('timer-stop');

    if (!startBtn || !stopBtn) return;

    switch (_state) {
      case STATE_IDLE:
        startBtn.disabled = false;
        stopBtn.disabled  = true;
        break;
      case STATE_RUNNING:
        startBtn.disabled = true;
        stopBtn.disabled  = false;
        break;
      case STATE_PAUSED:
        startBtn.disabled = false;
        stopBtn.disabled  = true;
        break;
      case STATE_DONE:
        startBtn.disabled = true;
        stopBtn.disabled  = true;
        break;
    }
  }

  /**
   * Apply _updateDisplay() and _updateControls() together.
   * Called after every state transition.
   */
  function _render() {
    _updateDisplay();
    _updateControls();
  }

  /* ── Public API ─────────────────────────────────────────── */

  /**
   * Initialise the timer.
   * Sets state to IDLE, remaining to 1500 s, and renders the display.
   * Requirement 2.1
   */
  function init() {
    // Guard: if a stale interval exists (e.g. hot-reload in dev), clear it.
    if (_intervalId !== null) {
      clearInterval(_intervalId);
      _intervalId = null;
    }
    _state     = STATE_IDLE;
    _remaining = TOTAL_SECONDS;
    _render();
  }

  /**
   * Start the countdown.
   *
   * Transitions:
   *   IDLE    → RUNNING  (Requirement 2.2)
   *   PAUSED  → RUNNING  (Requirement 2.8 — resumes from retained time)
   *   RUNNING → no-op    (Requirement 2.7 — prevents duplicate intervals)
   *   DONE    → no-op    (Requirement 2.9)
   */
  function start() {
    if (_state !== STATE_IDLE && _state !== STATE_PAUSED) {
      return; // no-op for RUNNING and DONE
    }

    _state = STATE_RUNNING;

    // Clear any lingering interval before creating a new one.
    clearInterval(_intervalId);
    _intervalId = setInterval(tick, 1000);

    _render();
  }

  /**
   * Pause the countdown.
   *
   * Transitions:
   *   RUNNING → PAUSED  (Requirement 2.4 — retains current remaining time)
   *   others  → no-op
   */
  function stop() {
    if (_state !== STATE_RUNNING) {
      return;
    }

    clearInterval(_intervalId);
    _intervalId = null;

    _state = STATE_PAUSED;
    _render();
  }

  /**
   * Reset the timer to its initial IDLE state.
   *
   * Clears any active interval atomically before changing state so
   * a final tick() cannot fire after the reset (Requirement 2.5 edge case).
   *
   * Transitions:
   *   any → IDLE, remaining = 1500 s  (Requirement 2.5)
   */
  function reset() {
    clearInterval(_intervalId);
    _intervalId = null;

    _state     = STATE_IDLE;
    _remaining = TOTAL_SECONDS;
    _render();

    // Hide the session-complete message if it was visible (Requirement 2.9).
    var msgEl = document.getElementById('timer-message');
    if (msgEl) {
      msgEl.hidden = true;
      msgEl.textContent = '';
    }
  }

  /**
   * Decrement the countdown by one second.
   * Called by setInterval every 1 000 ms while RUNNING.
   *
   * - Decrements _remaining by 1.
   * - If _remaining reaches 0: transitions to DONE, stops the interval,
   *   shows the session-complete message, and disables controls.
   *   (Requirements 2.6, 2.9)
   *
   * Requirement 2.3 (display updates every second) is satisfied because
   * _render() is called on every tick while RUNNING.
   */
  function tick() {
    // Defensive guard: tick should only act while RUNNING.
    if (_state !== STATE_RUNNING) {
      return;
    }

    _remaining -= 1;

    if (_remaining <= 0) {
      _remaining = 0;

      // Clear the interval before transitioning to DONE.
      clearInterval(_intervalId);
      _intervalId = null;

      _state = STATE_DONE;
      _render();

      // Show the session-complete message (Requirement 2.6).
      var msgEl = document.getElementById('timer-message');
      if (msgEl) {
        msgEl.textContent = 'Session complete! Great work. Click Reset to start again.';
        msgEl.hidden = false;
      }

      return;
    }

    _render();
  }

  /* ── Expose internal state for testing ─────────────────── */

  /**
   * Return the current FSM state string.
   * For test use only.
   * @returns {'IDLE'|'RUNNING'|'PAUSED'|'DONE'}
   */
  function _getState() {
    return _state;
  }

  /**
   * Return the current remaining seconds.
   * For test use only.
   * @returns {number}
   */
  function _getRemaining() {
    return _remaining;
  }

  return {
    init:          init,
    start:         start,
    stop:          stop,
    reset:         reset,
    tick:          tick,
    // Test-only accessors (prefixed with _ by convention)
    _getState:     _getState,
    _getRemaining: _getRemaining
  };
}());

/* Expose TimerModule on window.__test for the test harness.
   Production code never reads window.__test.              */
window.__test.TimerModule = TimerModule;


/* =========================================================
   TodoModule — task CRUD, validation, render, and persistence
   Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 4.4, 4.5,
                 6.1, 6.2, 6.3, 6.4
   ========================================================= */
var TodoModule = (function () {
  'use strict';

  /* ── Module-scoped state ────────────────────────────────── */

  /** @type {Array<{id: string, description: string, completed: boolean}>} */
  var _tasks = [];

  /* ── Validation (pure function) ─────────────────────────── */

  /**
   * Validate a task description string.
   *
   * Rules:
   *   - Trimmed length === 0  → invalid (covers empty and whitespace-only)
   *   - Trimmed length > 200  → invalid (character limit exceeded)
   *   - Otherwise             → valid
   *
   * @param {string} description
   * @returns {{ valid: boolean, error: string|null }}
   */
  function _validate(description) {
    var trimmed = (description || '').trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Task description cannot be empty.' };
    }

    if (trimmed.length > 200) {
      return { valid: false, error: 'Task description must be 200 characters or fewer.' };
    }

    return { valid: true, error: null };
  }

  /* ── Persistence ────────────────────────────────────────── */

  /**
   * Serialise the current task array to localStorage under
   * the key "todo-tasks" via StorageService.
   * Requirement 6.1
   */
  function _persist() {
    StorageService.write('todo-tasks', _tasks);
  }

  /* ── Render ─────────────────────────────────────────────── */

  /**
   * Perform a full re-render of the task list DOM.
   *
   * - Clears #todo-list innerHTML on every call.
   * - Shows a placeholder message when the list is empty.
   * - Each task renders as an <li> with:
   *     • a checkbox (completion toggle)
   *     • a <span> for the description (class "completed" + strikethrough when done)
   *     • an Edit button
   *     • a Delete button
   * - All interactive elements carry data-id for event delegation.
   *
   * Requirements: 3.5
   */
  function _render() {
    var listEl = document.getElementById('todo-list');
    if (!listEl) return;

    /* Full wipe — rebuild from the in-memory array */
    listEl.innerHTML = '';

    if (_tasks.length === 0) {
      var emptyMsg = document.createElement('li');
      emptyMsg.className = 'todo-empty';
      emptyMsg.textContent = 'No tasks yet. Add one above!';
      listEl.appendChild(emptyMsg);
      return;
    }

    _tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'todo-item';
      li.setAttribute('data-id', task.id);

      /* ── Checkbox toggle ─── */
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('data-id', task.id);
      checkbox.setAttribute('aria-label', 'Mark task as ' + (task.completed ? 'incomplete' : 'complete'));

      /* ── Description span ─── */
      var descSpan = document.createElement('span');
      descSpan.className = 'todo-description' + (task.completed ? ' completed' : '');
      descSpan.textContent = task.description;

      /* ── Edit button ─── */
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'todo-edit-btn';
      editBtn.setAttribute('data-id', task.id);
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.description);
      editBtn.textContent = 'Edit';

      /* ── Delete button ─── */
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'todo-delete-btn';
      deleteBtn.setAttribute('data-id', task.id);
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.description);
      deleteBtn.textContent = 'Delete';

      li.appendChild(checkbox);
      li.appendChild(descSpan);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });
  }

  /* ── Public mutation methods ────────────────────────────── */

  /**
   * Add a new task to the list.
   *
   * Steps:
   *   1. Validate the description; on failure write the error into
   *      #todo-input-error and return early.
   *   2. On success clear #todo-input-error.
   *   3. Generate a collision-safe ID.
   *   4. Push { id, description (trimmed), completed: false } onto _tasks.
   *   5. Persist, re-render, and clear the input field.
   *
   * Requirements: 3.1, 3.2, 3.3, 3.4
   *
   * @param {string} description  Raw value from the input field.
   */
  function addTask(description) {
    var result = _validate(description);
    var errorEl = document.getElementById('todo-input-error');

    if (!result.valid) {
      if (errorEl) errorEl.textContent = result.error;
      return;
    }

    // Clear any previous error on success.
    if (errorEl) errorEl.textContent = '';

    var id = Date.now().toString(36) + Math.random().toString(36).slice(2);

    _tasks.push({
      id:          id,
      description: description.trim(),
      completed:   false
    });

    _persist();
    _render();

    // Clear the input field after a successful add.
    var inputEl = document.getElementById('todo-input');
    if (inputEl) inputEl.value = '';
  }

  /**
   * Edit an existing task's description.
   *
   * Steps:
   *   1. Find the task by id — if not found return { success: false, error: null }.
   *   2. Validate newDescription — if invalid return { success: false, error } without
   *      mutating anything (Requirements 4.4, 4.5).
   *   3. On success: update description (trimmed), persist, re-render,
   *      return { success: true, error: null } (Requirements 4.3).
   *
   * The cancel path is handled by the UI layer — discarding the edit input
   * without calling editTask() satisfies Requirement 4.6.
   *
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
   *
   * @param {string} id             The id of the task to update
   * @param {string} newDescription Raw value from the edit input field
   * @returns {{ success: boolean, error: string|null }}
   */
  function editTask(id, newDescription) {
    var task = null;
    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i].id === id) {
        task = _tasks[i];
        break;
      }
    }

    if (!task) {
      return { success: false, error: null };
    }

    var result = _validate(newDescription);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    task.description = newDescription.trim();
    _persist();
    _render();
    return { success: true, error: null };
  }

  /**
   * Toggle the completed state of a task.
   *
   * Flips task.completed (true → false, false → true), then persists
   * and re-renders. If no task with the given id exists, this is a no-op.
   *
   * Requirements: 5.1, 5.2, 5.3
   *
   * @param {string} id  The id of the task to toggle
   */
  function toggleTask(id) {
    var task = null;
    for (var i = 0; i < _tasks.length; i++) {
      if (_tasks[i].id === id) {
        task = _tasks[i];
        break;
      }
    }

    if (!task) {
      return;
    }

    task.completed = !task.completed;
    _persist();
    _render();
  }

  /**
   * Delete the task with the given id.
   *
   * Filters the task out of _tasks, then persists and re-renders.
   * If no task with the given id exists, this is a no-op (filter
   * simply returns the array unchanged).
   *
   * Requirements: 5.4, 5.5
   *
   * @param {string} id  The id of the task to remove
   */
  function deleteTask(id) {
    _tasks = _tasks.filter(function (t) {
      return t.id !== id;
    });

    _persist();
    _render();
  }

  /**
   * Replace the internal task array.
   * For test use only — lets tests seed a known state before asserting.
   *
   * @param {Array} arr
   */
  function _setTasks(arr) {
    _tasks = arr;
  }

  /* ── Initialisation ─────────────────────────────────────── */

  /**
   * Load tasks from Storage and render the initial list.
   *
   * Behaviour:
   *   - StorageService.read returns null (key absent) → empty array, no notice
   *   - Returns a valid array                         → use it (Req 6.2)
   *   - Returns non-null but not an Array             → empty array + notice (Req 3.7 / 6.4)
   *
   * The non-blocking notice is written into #todo-input-error and does
   * NOT prevent the user from adding new tasks.
   *
   * Requirements: 3.6, 3.7, 6.2, 6.3, 6.4
   */
  function init() {
    var stored = StorageService.read('todo-tasks');

    if (stored === null) {
      /* Key absent or corrupt JSON (StorageService already swallowed the
         parse error and returned null).  Render an empty list silently. */
      _tasks = [];
    } else if (!Array.isArray(stored)) {
      /* Value was valid JSON but not an array — treat as corrupt. */
      _tasks = [];
      var errorEl = document.getElementById('todo-input-error');
      if (errorEl) {
        errorEl.textContent = 'Could not restore saved tasks.';
      }
    } else {
      /* Happy path — restore saved tasks (Requirement 6.2). */
      _tasks = stored;
    }

    _render();
  }

  /* ── Public API ─────────────────────────────────────────── */

  return {
    init:       init,
    addTask:    addTask,
    editTask:   editTask,
    toggleTask: toggleTask,
    deleteTask: deleteTask,
    _validate:  _validate,
    _persist:   _persist,
    _render:    _render,
    /* Expose internal array accessors for testing only */
    _getTasks:  function () { return _tasks; },
    _setTasks:  _setTasks
  };
}());

/* Expose TodoModule on window.__test for the test harness.
   Production code never reads window.__test.                */
window.__test.TodoModule = TodoModule;


/* =========================================================
   QuickLinksModule — link CRUD, validation, render, and persistence
   Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8,
                 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4
   ========================================================= */
var QuickLinksModule = (function () {
  'use strict';

  /* ── Storage key ──────────────────────────────────────── */
  var STORAGE_KEY = 'quick-links';

  /* ── Cap ──────────────────────────────────────────────── */
  var MAX_LINKS = 20;

  /* ── Module state ─────────────────────────────────────── */
  /** @type {Array<{id: string, label: string, url: string}>} */
  var _links = [];

  /* =========================================================
     Pure helper functions
     ========================================================= */

  /**
   * Normalise a URL by prepending "https://" when no http(s) scheme
   * is present. Already-prefixed URLs are returned unchanged.
   * The function is idempotent: applying it twice gives the same
   * result as applying it once.
   *
   * Examples:
   *   "example.com"          → "https://example.com"
   *   "http://example.com"   → "http://example.com"   (unchanged)
   *   "https://foo.bar"      → "https://foo.bar"       (unchanged)
   *
   * @param {string} url
   * @returns {string}
   */
  function _normaliseUrl(url) {
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return 'https://' + url;
  }

  /**
   * Validate a Quick Link label.
   *
   * Rules:
   *   - Trimmed length === 0 → invalid, error "Label cannot be empty."
   *   - Otherwise            → valid
   *
   * @param {string} label
   * @returns {{ valid: boolean, error: string|null }}
   */
  function _validateLabel(label) {
    if (typeof label === 'string' && label.trim().length === 0) {
      return { valid: false, error: 'Label cannot be empty.' };
    }
    return { valid: true, error: null };
  }

  /**
   * Validate a Quick Link URL.
   *
   * Rules (applied in order):
   *   1. Trimmed length === 0 → invalid, error "URL cannot be empty."
   *   2. Normalise via _normaliseUrl(), then verify it starts with
   *      "http://" or "https://"; if not → invalid,
   *      error "URL must start with http:// or https://."
   *   3. Otherwise → valid
   *
   * @param {string} url
   * @returns {{ valid: boolean, error: string|null }}
   */
  function _validateUrl(url) {
    if (typeof url === 'string' && url.trim().length === 0) {
      return { valid: false, error: 'URL cannot be empty.' };
    }

    var normalised = _normaliseUrl(url);
    if (!/^https?:\/\//i.test(normalised)) {
      return { valid: false, error: 'URL must start with http:// or https://.' };
    }

    return { valid: true, error: null };
  }

  /* =========================================================
     DOM helpers
     ========================================================= */

  /**
   * Return a DOM element by id, or null if not found.
   * @param {string} id
   * @returns {HTMLElement|null}
   */
  function _el(id) {
    return document.getElementById(id);
  }

  /* =========================================================
     Core infrastructure — _render(), _persist(), init()
     ========================================================= */

  /**
   * Render the complete Quick Links section from the current _links array.
   *
   * Full re-render strategy:
   *   - Clear #links-list innerHTML, then rebuild from scratch.
   *   - Each link: a row containing an <a> that opens in a new tab and a
   *     Delete button with data-id for event delegation.
   *   - When _links.length >= MAX_LINKS: disable #link-add-btn, show #link-cap-message.
   *   - When _links.length < MAX_LINKS: enable #link-add-btn, hide #link-cap-message.
   *   - When no links exist: show a placeholder message.
   *
   * Requirements: 7.6, 7.7, 7.8, 8.3
   */
  function _render() {
    var listEl = _el('links-list');
    var addBtn = _el('link-add-btn');
    var capMsg = _el('link-cap-message');

    if (!listEl) return;

    /* ── Rebuild link items ─────────────────────────────── */
    listEl.innerHTML = '';

    if (_links.length === 0) {
      var emptyMsg = document.createElement('p');
      emptyMsg.className = 'links-empty-msg';
      emptyMsg.textContent = 'No quick links yet. Add one above!';
      listEl.appendChild(emptyMsg);
    } else {
      _links.forEach(function (link) {
        var row = document.createElement('div');
        row.className = 'link-item';
        row.setAttribute('data-id', link.id);

        /* Link anchor — opens in new tab (Requirement 7.6) */
        var anchor = document.createElement('a');
        anchor.href        = link.url;
        anchor.textContent = link.label;
        anchor.target      = '_blank';
        anchor.rel         = 'noopener noreferrer';
        anchor.className   = 'link-btn';
        anchor.setAttribute('aria-label', 'Open ' + link.label + ' in a new tab');

        /* Delete button — carries the link id for event delegation */
        var deleteBtn = document.createElement('button');
        deleteBtn.type      = 'button';
        deleteBtn.className = 'link-delete-btn';
        deleteBtn.setAttribute('data-id', link.id);
        deleteBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
        deleteBtn.textContent = 'Delete';

        row.appendChild(anchor);
        row.appendChild(deleteBtn);
        listEl.appendChild(row);
      });
    }

    /* ── Add-button / cap-message state ─────────────────── */
    var atCap = _links.length >= MAX_LINKS;

    if (addBtn) {
      addBtn.disabled = atCap;
    }

    if (capMsg) {
      capMsg.hidden = !atCap;
    }
  }

  /**
   * Serialise _links to StorageService under the key "quick-links".
   * Requirement 9.1
   */
  function _persist() {
    StorageService.write(STORAGE_KEY, _links);
  }

  /**
   * Initialise QuickLinksModule.
   *
   * Reads the "quick-links" key from StorageService:
   *   - null (absent / corrupt JSON) → empty array; show notice only if a
   *     raw value existed (corrupt case)
   *   - valid JSON but not an array  → empty array + non-blocking notice
   *   - valid array                  → use the stored links
   *
   * Requirements: 7.7, 9.2, 9.3, 9.4
   */
  function init() {
    var stored = StorageService.read(STORAGE_KEY);

    if (stored === null) {
      _links = [];

      /* Distinguish absent-key from corrupt-JSON */
      var raw = null;
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (e) {
        /* localStorage unavailable — treat same as absent */
      }

      if (raw !== null) {
        /* Value existed but couldn't be parsed → corrupt */
        var noticeEl = _el('link-label-error');
        if (noticeEl) {
          noticeEl.textContent = 'Could not restore saved links.';
        }
      }
    } else if (!Array.isArray(stored)) {
      /* Parsed successfully but not an array — treat as corrupt */
      _links = [];
      var noticeEl2 = _el('link-label-error');
      if (noticeEl2) {
        noticeEl2.textContent = 'Could not restore saved links.';
      }
    } else {
      /* Happy path — restore saved links */
      _links = stored;
    }

    _render();
  }

  /* =========================================================
     Public API — addLink() and deleteLink()
     ========================================================= */

  /**
   * Add a new Quick Link.
   *
   * Steps:
   *   1. Validate label via _validateLabel() — show #link-label-error on failure.
   *   2. Validate url via _validateUrl() — show #link-url-error on failure.
   *   3. Clear both error elements on success.
   *   4. Defensive cap check — return early if already at 20 links.
   *   5. Normalise URL via _normaliseUrl().
   *   6. Generate ID and push new link object.
   *   7. Persist, render, and clear input fields.
   *
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8
   *
   * @param {string} label  Raw label from the input field
   * @param {string} url    Raw URL from the input field
   */
  function addLink(label, url) {
    var labelResult = _validateLabel(label);
    var urlResult   = _validateUrl(url);

    var labelErrorEl = _el('link-label-error');
    var urlErrorEl   = _el('link-url-error');

    /* Show / clear label error */
    if (labelErrorEl) {
      labelErrorEl.textContent = labelResult.valid ? '' : labelResult.error;
    }

    /* Show / clear URL error */
    if (urlErrorEl) {
      urlErrorEl.textContent = urlResult.valid ? '' : urlResult.error;
    }

    /* Abort if either field is invalid */
    if (!labelResult.valid || !urlResult.valid) {
      return;
    }

    /* Defensive cap check (belt-and-suspenders alongside the DOM guard) */
    if (_links.length >= MAX_LINKS) {
      return;
    }

    /* Normalise URL (Requirement 7.5) */
    var normalisedUrl = _normaliseUrl(url.trim());

    /* Generate a collision-free ID (same strategy as TodoModule) */
    var id = Date.now().toString(36) + Math.random().toString(36).slice(2);

    /* Push the new link */
    _links.push({ id: id, label: label.trim(), url: normalisedUrl });

    /* Persist and re-render */
    _persist();
    _render();

    /* Clear input fields */
    var labelInput = _el('link-label-input');
    var urlInput   = _el('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
  }

  /**
   * Delete the Quick Link with the given id.
   *
   * Filters the link out of _links, then persists and re-renders.
   * _render() automatically re-enables the Add button if the count
   * drops below 20 (Requirement 8.3).
   *
   * Requirements: 8.1, 8.2, 8.3
   *
   * @param {string} id  The id of the link to remove
   */
  function deleteLink(id) {
    _links = _links.filter(function (link) {
      return link.id !== id;
    });

    _persist();
    _render();
  }

  /* =========================================================
     Exposed public API
     ========================================================= */
  return {
    init:           init,
    addLink:        addLink,
    deleteLink:     deleteLink,
    _persist:       _persist,
    _render:        _render,
    _validateLabel: _validateLabel,
    _validateUrl:   _validateUrl,
    _normaliseUrl:  _normaliseUrl,
    /* Test-only accessors */
    _getLinks:  function () { return _links; },
    _setLinks:  function (arr) { _links = arr; }
  };
}());

/* Expose QuickLinksModule on window.__test for the test harness.
   Production code never reads window.__test.                      */
window.__test = window.__test || {};
window.__test.QuickLinksModule = QuickLinksModule;


/* =========================================================
   Initialisation — wire all modules on DOMContentLoaded
   Requirements: 2.1, 2.4, 2.5, 3.1, 4.1, 4.6, 5.4,
                 7.1, 8.1, 10.1, 10.3
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ── 1. Initialise all modules (design.md init order) ── */
  TodoModule.init();
  QuickLinksModule.init();
  GreetingModule.start();
  TimerModule.init();

  /* ── 2. Timer controls ──────────────────────────────── */

  var timerStartBtn = document.getElementById('timer-start');
  var timerStopBtn  = document.getElementById('timer-stop');
  var timerResetBtn = document.getElementById('timer-reset');

  if (timerStartBtn) {
    timerStartBtn.addEventListener('click', function () {
      TimerModule.start();
    });
  }

  if (timerStopBtn) {
    timerStopBtn.addEventListener('click', function () {
      TimerModule.stop();
    });
  }

  if (timerResetBtn) {
    timerResetBtn.addEventListener('click', function () {
      TimerModule.reset();
    });
  }

  /* ── 3. Add Task ────────────────────────────────────── */

  var todoInput  = document.getElementById('todo-input');
  var todoAddBtn = document.getElementById('todo-add-btn');

  /** Trigger an addTask action using the current input value. */
  function handleAddTask() {
    if (todoInput) {
      TodoModule.addTask(todoInput.value);
    }
  }

  if (todoAddBtn) {
    todoAddBtn.addEventListener('click', handleAddTask);
  }

  /* Submit on Enter key inside the task input */
  if (todoInput) {
    todoInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        handleAddTask();
      }
    });

    /* Clear inline error as soon as the user starts typing (Req 3.3) */
    todoInput.addEventListener('input', function () {
      var errorEl = document.getElementById('todo-input-error');
      if (errorEl) errorEl.textContent = '';
    });
  }

  /* ── 4. Task list — event delegation ────────────────── */
  /*
   * All clicks on the #todo-list container are handled here.
   * Each interactive element carries a data-id attribute that
   * maps back to the task's id.
   *
   * Handled targets:
   *   .todo-checkbox   → toggleTask
   *   .todo-delete-btn → deleteTask
   *   .todo-edit-btn   → enter inline-edit mode
   *   .todo-save-btn   → confirm edit
   *   .todo-cancel-btn → cancel edit
   */

  var todoList = document.getElementById('todo-list');

  if (todoList) {
    todoList.addEventListener('click', function (e) {
      var target = e.target;

      /* ── Toggle completion ── */
      if (target.classList.contains('todo-checkbox')) {
        TodoModule.toggleTask(target.getAttribute('data-id'));
        return;
      }

      /* ── Delete task ── */
      if (target.classList.contains('todo-delete-btn')) {
        TodoModule.deleteTask(target.getAttribute('data-id'));
        return;
      }

      /* ── Enter inline-edit mode ── */
      if (target.classList.contains('todo-edit-btn')) {
        var taskId   = target.getAttribute('data-id');
        var li       = document.querySelector('#todo-list li[data-id="' + taskId + '"]');
        if (!li) return;

        var descSpan = li.querySelector('.todo-description');
        if (!descSpan) return;

        var currentText = descSpan.textContent;

        /* Build the edit input */
        var editInput = document.createElement('input');
        editInput.type      = 'text';
        editInput.className = 'todo-edit-input';
        editInput.value     = currentText;
        editInput.maxLength = 200;
        editInput.setAttribute('aria-label', 'Edit task description');

        /* Error span for inline-edit validation feedback */
        var editErrorSpan = document.createElement('span');
        editErrorSpan.className = 'error-msg';
        editErrorSpan.setAttribute('role', 'alert');
        editErrorSpan.setAttribute('aria-live', 'assertive');

        /* Clear error while typing */
        editInput.addEventListener('input', function () {
          editErrorSpan.textContent = '';
        });

        /* Save button */
        var saveBtn = document.createElement('button');
        saveBtn.type      = 'button';
        saveBtn.className = 'todo-save-btn';
        saveBtn.setAttribute('data-id', taskId);
        saveBtn.setAttribute('aria-label', 'Save edit');
        saveBtn.textContent = 'Save';

        /* Cancel button */
        var cancelBtn = document.createElement('button');
        cancelBtn.type      = 'button';
        cancelBtn.className = 'todo-cancel-btn';
        cancelBtn.setAttribute('data-id', taskId);
        cancelBtn.setAttribute('aria-label', 'Cancel edit');
        cancelBtn.textContent = 'Cancel';

        /* Replace description span with the edit controls */
        li.replaceChild(editInput, descSpan);

        /* Replace Edit button with Save + Cancel + error span */
        li.replaceChild(saveBtn, target);
        li.insertBefore(cancelBtn, saveBtn.nextSibling);
        li.insertBefore(editErrorSpan, cancelBtn.nextSibling);

        /* Focus the edit input */
        editInput.focus();
        editInput.select();

        /* Allow Save on Enter key */
        editInput.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') {
            saveBtn.click();
          } else if (ev.key === 'Escape') {
            cancelBtn.click();
          }
        });
        return;
      }

      /* ── Save inline edit ── */
      if (target.classList.contains('todo-save-btn')) {
        var saveTaskId = target.getAttribute('data-id');
        var saveLi     = document.querySelector('#todo-list li[data-id="' + saveTaskId + '"]');
        if (!saveLi) return;

        var editInputEl  = saveLi.querySelector('.todo-edit-input');
        var editErrorEl  = saveLi.querySelector('.error-msg');
        if (!editInputEl) return;

        var result = TodoModule.editTask(saveTaskId, editInputEl.value);

        if (!result.success && result.error) {
          /* Show validation error inline (Req 4.4, 4.5) */
          if (editErrorEl) editErrorEl.textContent = result.error;
          return;
        }
        /* Success: _render() inside editTask already rebuilt the DOM */
        return;
      }

      /* ── Cancel inline edit ── */
      if (target.classList.contains('todo-cancel-btn')) {
        /* Discard changes — re-render from current in-memory state without
           touching Storage (Requirement 4.6). */
        TodoModule._render();
        return;
      }
    });
  }

  /* ── 5. Add Quick Link ──────────────────────────────── */

  var linkLabelInput = document.getElementById('link-label-input');
  var linkUrlInput   = document.getElementById('link-url-input');
  var linkAddBtn     = document.getElementById('link-add-btn');

  /** Trigger an addLink action using the current input values. */
  function handleAddLink() {
    var label = linkLabelInput ? linkLabelInput.value : '';
    var url   = linkUrlInput   ? linkUrlInput.value   : '';
    QuickLinksModule.addLink(label, url);
  }

  if (linkAddBtn) {
    linkAddBtn.addEventListener('click', handleAddLink);
  }

  /* Submit on Enter in either link input field */
  if (linkLabelInput) {
    linkLabelInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleAddLink();
    });

    /* Clear label error while user is typing (Req 7.3) */
    linkLabelInput.addEventListener('input', function () {
      var errorEl = document.getElementById('link-label-error');
      if (errorEl) errorEl.textContent = '';
    });
  }

  if (linkUrlInput) {
    linkUrlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleAddLink();
    });

    /* Clear URL error while user is typing (Req 7.4) */
    linkUrlInput.addEventListener('input', function () {
      var errorEl = document.getElementById('link-url-error');
      if (errorEl) errorEl.textContent = '';
    });
  }

  /* ── 6. Links list — event delegation ──────────────── */
  /*
   * Clicks on .link-delete-btn inside #links-list are handled here.
   * Each delete button carries data-id matching the link's id.
   */

  var linksList = document.getElementById('links-list');

  if (linksList) {
    linksList.addEventListener('click', function (e) {
      var target = e.target;

      if (target.classList.contains('link-delete-btn')) {
        QuickLinksModule.deleteLink(target.getAttribute('data-id'));
      }
    });
  }
});
