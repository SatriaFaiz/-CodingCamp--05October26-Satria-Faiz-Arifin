# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a static, dependency-free single-page dashboard (`index.html` + `css/style.css` + `js/app.js`) with four independent sections: Greeting, Focus Timer, To-Do List, and Quick Links. All logic follows the Module Pattern described in the design; all state is persisted to `localStorage`. The test suite lives in `test/index.html` and loads QUnit and fast-check from CDN.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with semantic sectioning: Greeting, Focus Timer, To-Do List, Quick Links
  - Link `<link rel="stylesheet" href="css/style.css">` and `<script src="js/app.js" defer></script>` — no other external resources
  - Add all required DOM element IDs and `data-*` attributes that the JS modules will target
  - Create empty placeholder files `css/style.css` and `js/app.js`
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement StorageService and core module skeleton in js/app.js
  - [x] 2.1 Implement StorageService
    - Write `StorageService` object with `read(key)`, `write(key, value)`, and `remove(key)` methods inside an IIFE module pattern
    - `read` must catch JSON parse errors, emit `console.warn`, and return `null` on failure
    - `write` must catch `DOMException` (storage full / unavailable), emit `console.warn`, and keep the session's in-memory state intact
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4_
  - [x] 2.2 Write unit tests for StorageService
    - Test: absent key returns `null`
    - Test: corrupt JSON string returns `null` with a console warning
    - Test: valid JSON round-trips correctly
    - Test: `write` survives a mocked `DOMException` without throwing
    - _Requirements: 6.3, 6.4, 9.3, 9.4_

- [x] 3. Implement GreetingModule
  - [x] 3.1 Implement pure helper functions `getGreeting(hour)` and `formatDate(date)`
    - `getGreeting`: hour 5–11 → "Good Morning"; 12–17 → "Good Afternoon"; all others → "Good Evening"
    - `formatDate`: returns "DayName, DD MonthName YYYY" string using locale-independent day/month name arrays
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 3.2 Write property test for greeting coverage (Property 6)
    - **Property 6: Greeting coverage is total and non-overlapping**
    - Use `fc.integer({ min: 0, max: 23 })` — every hour must produce exactly one of the three strings
    - **Validates: Requirements 1.3, 1.4, 1.5**
  - [x] 3.3 Write unit tests for `getGreeting` and `formatDate`
    - Test all 24 hour values; confirm boundary hours 5, 11, 12, 17, 18, 0, 4, 23
    - Test `formatDate` with representative dates for day/month name accuracy
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [x] 3.4 Implement `GreetingModule.start()` and `GreetingModule.tick()`
    - `tick()` reads `new Date()`, updates the clock (`HH:MM:SS`), date string, and greeting in the DOM
    - `start()` calls `tick()` immediately then sets a 1-second interval
    - Clock update must happen within 100 ms of the displayed second changing
    - _Requirements: 1.1, 1.6, 1.7_

- [x] 4. Implement TimerModule
  - [x] 4.1 Implement the 4-state FSM core (`IDLE`, `RUNNING`, `PAUSED`, `DONE`)
    - Implement `TimerModule` with `init()`, `start()`, `stop()`, `reset()`, `tick()` methods
    - Guard all state transitions according to the control table: Start enabled only in IDLE/PAUSED; Stop enabled only in RUNNING; both disabled in DONE
    - Store a single `intervalId` in module scope; clear before creating a new interval in `start()` to prevent duplicates
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_
  - [x] 4.2 Implement timer completion and display logic
    - When `remaining` reaches 0, transition to DONE, stop the interval, display session-complete message, and disable Start/Stop controls
    - Display format: `MM:SS` (zero-padded)
    - _Requirements: 2.6, 2.9_
  - [x] 4.3 Write unit tests for TimerModule state transitions
    - Test: `start()` from IDLE → RUNNING; from PAUSED → RUNNING; no-op from RUNNING
    - Test: `stop()` from RUNNING → PAUSED; no-op from IDLE
    - Test: `reset()` from any state → IDLE, remaining restored to 1500
    - Test: `tick()` in DONE state does not decrement below 0
    - Test: duplicate `start()` calls do not create multiple intervals
    - _Requirements: 2.2, 2.4, 2.5, 2.7, 2.9_

- [x] 5. Checkpoint — Ensure StorageService, GreetingModule, and TimerModule all pass their tests; ask the user if questions arise.

- [x] 6. Implement TodoModule
  - [x] 6.1 Implement `TodoModule._validate(description)` pure function
    - Trimmed length 0 → `{ valid: false, error: "Task description cannot be empty." }`
    - Trimmed length > 200 → `{ valid: false, error: "Task description must be 200 characters or fewer." }`
    - Otherwise → `{ valid: true, error: null }`
    - _Requirements: 3.3, 3.4, 4.4, 4.5_
  - [x] 6.2 Write property test for whitespace rejection (Property 3)
    - **Property 3: Whitespace task descriptions are always rejected**
    - Use `fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'))` — all such strings must produce `{ valid: false }`
    - **Validates: Requirements 3.3, 4.4**
  - [x] 6.3 Write property test for over-length rejection (Property 4)
    - **Property 4: Over-length task descriptions are always rejected**
    - Use `fc.string({ minLength: 201 })` — all such strings must produce `{ valid: false }`
    - **Validates: Requirements 3.4, 4.5**
  - [x] 6.4 Implement `TodoModule.init()`, `_persist()`, and `_render()`
    - `init()` reads `"todo-tasks"` from StorageService; falls back to empty array on null or corrupt data; shows non-blocking notice on corrupt data
    - `_persist()` serialises the task array to StorageService under key `"todo-tasks"`
    - `_render()` performs a full re-render of the task list DOM; completed tasks get strikethrough styling; each task row includes Edit, Delete, and toggle controls
    - _Requirements: 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4_
  - [x] 6.5 Implement `TodoModule.addTask(description)`
    - Validate → on failure show inline error adjacent to input; on success generate ID, push task, `_persist()`, `_render()`, clear input
    - New tasks have `completed: false`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 6.6 Write property test for valid add grows list by one (Property 7)
    - **Property 7: Valid task addition grows the list by exactly one**
    - Use `fc.array(taskArb)` + `fc.string({ minLength:1, maxLength:200 })` — list length increases by exactly 1 and last element matches trimmed description with `completed: false`
    - **Validates: Requirements 3.2**
  - [x] 6.7 Implement `TodoModule.editTask(id, newDescription)` and `TodoModule.toggleTask(id)`
    - `editTask`: validate → on failure show inline error, retain original description; on success mutate description, `_persist()`, `_render()`; Cancel discards changes without touching Storage
    - `toggleTask`: flip `completed` field, `_persist()`, `_render()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3_
  - [x] 6.8 Write property test for toggle involution (Property 8)
    - **Property 8: Task toggle is an involution**
    - Use `fc.array(taskArb, { minLength:1 })` + `fc.nat()` (mod list length for index) — toggling twice returns task to its original `completed` state with all other fields unchanged
    - **Validates: Requirements 5.2, 5.3**
  - [x] 6.9 Implement `TodoModule.deleteTask(id)`
    - Remove task from array, `_persist()`, `_render()`
    - _Requirements: 5.4, 5.5_
  - [x] 6.10 Write property test for task serialisation round-trip (Property 1)
    - **Property 1: Task serialisation round-trip**
    - Use `fc.array(fc.record({ id: fc.string(), description: fc.string({minLength:1, maxLength:200}), completed: fc.boolean() }))` — every serialise → deserialise cycle must produce byte-identical `description` and `completed` fields
    - **Validates: Requirements 6.5**

- [x] 7. Implement QuickLinksModule
  - [x] 7.1 Implement `QuickLinksModule._validateLabel()`, `_validateUrl()`, and `_normaliseUrl()` pure functions
    - `_validateLabel`: trimmed length 0 → error "Label cannot be empty."
    - `_validateUrl`: trimmed length 0 → error "URL cannot be empty."; after normalisation does not start with `http://` or `https://` → error "URL must start with http:// or https://."
    - `_normaliseUrl`: prepend `"https://"` only when no `http://` or `https://` scheme present; already-prefixed URLs are returned unchanged
    - _Requirements: 7.3, 7.4, 7.5_
  - [x] 7.2 Write property test for URL normalisation idempotence (Property 5)
    - **Property 5: URL normalisation idempotence**
    - Use `fc.webUrl()` — already-prefixed URLs return unchanged; use `fc.string()` — applying `_normaliseUrl` twice equals applying it once
    - **Validates: Requirements 7.5**
  - [x] 7.3 Write unit tests for `_validateLabel`, `_validateUrl`, and `_normaliseUrl`
    - Test: empty label rejected; max-length label accepted
    - Test: empty URL rejected; bare domain normalised to `https://`; `http://` and `https://` URLs pass unchanged
    - _Requirements: 7.3, 7.4, 7.5_
  - [x] 7.4 Implement `QuickLinksModule.init()`, `_persist()`, and `_render()`
    - `init()` reads `"quick-links"` from StorageService; falls back to empty array on null or corrupt data; shows non-blocking notice on corrupt data
    - `_persist()` serialises links to StorageService under key `"quick-links"`
    - `_render()` full re-render; each link button opens URL in a new tab (`target="_blank" rel="noopener noreferrer"`); each row includes a Delete control; disable Add button and show cap message when 20 links exist
    - _Requirements: 7.6, 7.7, 7.8, 9.1, 9.2, 9.3, 9.4_
  - [x] 7.5 Implement `QuickLinksModule.addLink(label, url)` and `QuickLinksModule.deleteLink(id)`
    - `addLink`: validate label and URL → show inline errors on failure; normalise URL; enforce 20-link cap (defensive check + DOM guard); generate ID, push, `_persist()`, `_render()`
    - `deleteLink`: remove link, `_persist()`, `_render()` (re-enables Add button if count drops below 20)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.8, 8.1, 8.2, 8.3_
  - [x] 7.6 Write property test for Quick Links cap (Property 9)
    - **Property 9: Quick Links cap is enforced under all addition sequences**
    - Use `fc.array(linkArb, { minLength:21, maxLength:50 })` — after processing all additions, collection length is never > 20
    - **Validates: Requirements 7.8**
  - [x] 7.7 Write property test for link serialisation round-trip (Property 2)
    - **Property 2: Link serialisation round-trip**
    - Use `fc.array(fc.record({ id: fc.string(), label: fc.string({minLength:1, maxLength:50}), url: fc.webUrl() }))` — every serialise → deserialise cycle must produce byte-identical `label` and `url` fields
    - **Validates: Requirements 9.5**

- [x] 8. Checkpoint — Ensure TodoModule and QuickLinksModule pass all tests; ask the user if questions arise.

- [x] 9. Implement CSS styling (css/style.css)
  - [x] 9.1 Implement base layout and responsive grid
    - Card/panel containers for each section with visible boundaries (border, background, or shadow)
    - Responsive layout from 320px to 1920px with no horizontal overflow or overlapping content at any breakpoint
    - Minimum 14px font size for all body text and task descriptions
    - _Requirements: 11.3, 12.1, 12.2_
  - [x] 9.2 Implement WCAG 2.1 AA colour scheme and focus indicators
    - Text/background contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18px+ or 14px+ bold)
    - Visible focus indicator on all interactive controls meeting ≥ 3:1 contrast against adjacent colours
    - Strikethrough styling for completed tasks
    - _Requirements: 12.3, 12.4_

- [x] 10. Wire all modules together and initialise on DOMContentLoaded
  - Add the `DOMContentLoaded` listener in `js/app.js` that calls `StorageService` setup (if any), `TodoModule.init()`, `QuickLinksModule.init()`, `GreetingModule.start()`, and `TimerModule.init()` in that order
  - Bind all DOM event listeners (Add Task, Edit, Delete, Toggle, Timer Start/Stop/Reset, Add Link, Delete Link) to the corresponding module methods
  - Clear inline error messages on `input` events for text fields
  - _Requirements: 2.1, 2.4, 2.5, 3.1, 4.1, 4.6, 5.4, 7.1, 8.1, 10.1, 10.3_

- [x] 11. Create the test harness and wire all tests
  - Create `test/index.html` loading QUnit and fast-check from CDN
  - Import or inline StorageService, all pure functions, and module logic needed by the tests (or expose them on a `window.__test` namespace from `app.js` under a test flag)
  - Verify all unit tests and property tests run green
  - _Requirements: 10.5_

- [x] 12. Final checkpoint — All unit tests and property tests pass; verify no JS console errors on first load with empty localStorage and with corrupt localStorage; ask the user if questions arise.

---

## Notes

- Each task references specific requirements for traceability
- Property tests use fast-check (loaded from CDN in `test/index.html`) and must include the tag comment `// Feature: todo-life-dashboard, Property N`
- Unit tests use QUnit (loaded from CDN in `test/index.html`)
- The production files (`index.html`, `css/style.css`, `js/app.js`) must reference zero CDN or external URLs — CDN is only permitted in `test/index.html`
- Checkpoints are implemented by running the test harness and fixing any failures before moving on

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "6.4", "7.2", "7.3"] },
    { "id": 6, "tasks": ["6.5", "7.4"] },
    { "id": 7, "tasks": ["6.6", "6.7", "7.5"] },
    { "id": 8, "tasks": ["6.8", "6.9", "7.6", "7.7"] },
    { "id": 9, "tasks": ["6.10", "9.1"] },
    { "id": 10, "tasks": ["9.2", "10"] },
    { "id": 11, "tasks": ["11"] }
  ]
}
```
