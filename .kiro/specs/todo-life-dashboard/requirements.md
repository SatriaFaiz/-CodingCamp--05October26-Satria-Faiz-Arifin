# Requirements Document

## Introduction

The To-Do List List Dashboard is a single-page web application that helps users organize their day from a unified homepage-style interface. It is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks or build tools required. The dashboard comprises four independent sections: a time-aware Greeting, a Focus Timer, a To-Do List, and a Quick Links panel. All user data is persisted entirely in the browser's Local Storage so the app works offline and requires no backend.

## Glossary

- **Dashboard**: The single HTML page that hosts all four sections of the application.
- **Greeting_Section**: The UI region that displays the live clock, current date, and a contextual greeting.
- **Focus_Timer**: The UI region containing the 25-minute countdown timer and its controls.
- **Todo_List**: The UI region where the user manages personal tasks.
- **Quick_Links**: The UI region where the user manages shortcut buttons to external URLs.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **Link**: A user-defined record consisting of a display label and a URL.
- **Storage**: The browser's `localStorage` API used for all client-side persistence.
- **Validator**: The client-side input validation logic embedded in the Dashboard.

---

## Requirements

### Requirement 1: Live Greeting Display

**User Story:** As a user, I want to see the current time, date, and a greeting that matches the time of day, so that I can quickly orient myself when I open the dashboard.

#### Acceptance Criteria

1. THE Greeting_Section SHALL display the current time in HH:MM:SS 24-hour format sourced from the user's local system clock, updating every second.
2. THE Greeting_Section SHALL display the current date in the format "DayName, DD MonthName YYYY" (e.g., "Monday, 26 October 2025") sourced from the user's local system clock.
3. WHEN the current local hour is between 05:00 and 11:59 (inclusive), THE Greeting_Section SHALL display the greeting "Good Morning".
4. WHEN the current local hour is between 12:00 and 17:59 (inclusive), THE Greeting_Section SHALL display the greeting "Good Afternoon".
5. WHEN the current local hour is between 18:00 and 23:59 or between 00:00 and 04:59 (inclusive), THE Greeting_Section SHALL display the greeting "Good Evening".
6. WHEN the displayed second changes, THE Greeting_Section SHALL update the time within 100 milliseconds without requiring a page reload.
7. WHEN the local hour transitions between greeting periods (e.g., 11:59 to 12:00), THE Greeting_Section SHALL update the greeting text within one second of the transition.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display a countdown initialized to 25:00 (minutes:seconds) when the Dashboard first loads.
2. WHEN the user activates the Start control while the timer is not running, THE Focus_Timer SHALL begin decrementing the displayed time by one second each second.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visible session-complete message; the Start and Stop controls SHALL reflect a stopped state.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control so that a second Start action cannot create a duplicate interval.
8. WHEN the user activates the Start control after the timer has been paused via Stop, THE Focus_Timer SHALL resume the countdown from the retained remaining time.
9. WHEN the countdown has reached 00:00, THE Start and Stop controls SHALL remain non-operational until the user activates the Reset control.

---

### Requirement 3: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add tasks and see them listed, so that I can track what I need to do today.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field and an Add button for creating new tasks.
2. WHEN the user submits a non-empty task description of 200 characters or fewer, THE Todo_List SHALL append the new Task to the list with an incomplete state.
3. IF the user submits an empty or whitespace-only task description, THEN THE Validator SHALL prevent the Task from being added and display an inline error message adjacent to the input field.
4. IF the user submits a task description exceeding 200 characters, THEN THE Validator SHALL prevent the Task from being added and display an inline error message indicating the character limit.
5. THE Todo_List SHALL display each Task with its description text and its current completion state (indicated by a checkbox or equivalent control and strikethrough styling for completed tasks).
6. WHEN the Dashboard loads, THE Todo_List SHALL restore all previously saved Tasks from Storage and render them in the order they were stored.
7. IF Storage is unavailable on load, THEN THE Todo_List SHALL render an empty list and display a non-blocking notice that data could not be restored.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit an existing task's description, so that I can correct mistakes or update my plans.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an Edit control for each Task in the list.
2. WHEN the user activates the Edit control for a Task, THE Todo_List SHALL replace the Task's displayed description with an editable text input pre-filled with the current description.
3. WHEN the user confirms the edit with a non-empty description of 200 characters or fewer, THE Todo_List SHALL update the Task's description and return to the display state.
4. IF the user confirms the edit with an empty or whitespace-only description, THEN THE Validator SHALL prevent the update, retain the original Task description, and display an inline error message adjacent to the edit input.
5. IF the user confirms the edit with a description exceeding 200 characters, THEN THE Validator SHALL prevent the update and display an inline error message indicating the character limit.
6. WHEN the user cancels the edit, THE Todo_List SHALL discard changes and return the Task to its previous display state without modifying Storage.

---

### Requirement 5: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete them, so that I can track progress and keep the list clean.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle (checkbox or equivalent control) for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL mark the Task as complete, apply strikethrough styling to the description text, and persist the updated state to Storage.
3. WHEN the user activates the completion toggle for a complete Task, THE Todo_List SHALL mark the Task as incomplete, remove the strikethrough styling, and persist the updated state to Storage.
4. THE Todo_List SHALL provide a Delete control for each Task.
5. WHEN the user activates the Delete control for a Task, THE Todo_List SHALL permanently remove the Task from the list and update Storage to reflect the removal.

---

### Requirement 6: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that they are still there when I reopen the browser.

#### Acceptance Criteria

1. WHEN a Task is added, updated, completed, or deleted, THE Todo_List SHALL serialize the current Task collection as JSON and write it to Storage under the key "todo-tasks".
2. WHEN the Dashboard loads, THE Todo_List SHALL read the Task collection from Storage under the key "todo-tasks" and render each saved Task in the order it was stored.
3. IF no Task data exists in Storage under the key "todo-tasks", THEN THE Todo_List SHALL render an empty list without error.
4. IF the data stored under "todo-tasks" is not valid JSON, THEN THE Todo_List SHALL discard the corrupt data, render an empty list, and display a non-blocking notice that saved data could not be loaded.
5. WHEN a Task collection is serialized to JSON and then deserialized, the resulting collection SHALL have identical Task descriptions and completion states as the original (round-trip property).

---

### Requirement 7: Quick Links — Add and Display Links

**User Story:** As a user, I want to add labeled shortcut buttons to my favorite websites, so that I can navigate to them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a label input field (accepting up to 50 characters), a URL input field (accepting up to 2048 characters), and an Add button for creating new Links.
2. WHEN the user submits a non-empty label and a URL beginning with "http://" or "https://", THE Quick_Links SHALL append a new Link button to the panel.
3. IF the user submits an empty label, THEN THE Validator SHALL prevent the Link from being added and display an inline error message adjacent to the label input field.
4. IF the user submits an empty URL, THEN THE Validator SHALL prevent the Link from being added and display an inline error message adjacent to the URL input field.
5. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Validator SHALL prepend "https://" to the URL before saving the Link.
6. WHEN the user activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab.
7. WHEN the Dashboard loads, THE Quick_Links SHALL restore all previously saved Links from Storage.
8. WHEN the Quick_Links panel already contains 20 Links, THE Add button SHALL be disabled and an inline message SHALL indicate that the maximum number of links has been reached.

---

### Requirement 8: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a Delete control for each Link button.
2. WHEN the user activates the Delete control for a Link, THE Quick_Links SHALL permanently remove the Link from the panel and update Storage to reflect the removal.
3. WHEN a Link is deleted and the panel previously contained 20 Links, THE Add button SHALL become enabled again.

---

### Requirement 9: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically, so that they are available every time I open the dashboard.

#### Acceptance Criteria

1. WHEN a Link is added or deleted, THE Quick_Links SHALL serialize the current Link collection as JSON and write it to the same Storage key ("quick-links") in every session.
2. WHEN the Dashboard loads, THE Quick_Links SHALL read the Link collection from Storage under the key "quick-links" and render each saved Link.
3. IF no Link data exists in Storage under the key "quick-links", THEN THE Quick_Links SHALL render an empty panel without error.
4. IF the data stored under "quick-links" is not valid JSON, THEN THE Quick_Links SHALL discard the corrupt data, render an empty panel, and display a non-blocking notice that saved data could not be loaded.
5. WHEN a Link collection is serialized to JSON and then deserialized, the resulting collection SHALL have identical labels and URLs as the original (round-trip property).

---

### Requirement 10: Technical Constraints

**User Story:** As a developer, I want the app to use only HTML, CSS, and Vanilla JavaScript with a single CSS file and a single JS file, so that the codebase stays simple and dependency-free.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and Vanilla JavaScript; no external frameworks, libraries, or CDN-hosted scripts SHALL be referenced.
2. THE Dashboard SHALL use exactly one CSS file located at `css/style.css` for all styling; no other stylesheet files SHALL be linked.
3. THE Dashboard SHALL use exactly one JavaScript file located at `js/app.js` for all behavior; no other script files SHALL be linked or imported.
4. THE Dashboard SHALL use the browser's `localStorage` API as the sole persistence mechanism; no `fetch`, `XMLHttpRequest`, or other network calls SHALL be made.
5. THE Dashboard SHALL render all four sections without JavaScript errors in the current stable releases of Chrome, Firefox, Edge, and Safari.

---

### Requirement 11: Performance and Responsiveness

**User Story:** As a user, I want the dashboard to load instantly and respond without lag, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four sections and display the live clock within 2 seconds of the navigation start event on a device with at least 4 GB RAM and a broadband connection.
2. WHEN the user performs any interaction (adding a task, toggling completion, clicking a link), THE Dashboard SHALL reflect the change in the UI within 100 milliseconds of the interaction event.
3. THE Dashboard SHALL adapt its layout to viewport widths ranging from 320px to 1920px without horizontal scrolling or overlapping content.

---

### Requirement 12: Visual Design and Usability

**User Story:** As a user, I want a clean, readable, and visually organized interface, so that I can use the dashboard without confusion or eye strain.

#### Acceptance Criteria

1. THE Dashboard SHALL visually separate the four sections using distinct card or panel containers with visible boundaries (border, background color, or shadow) so that each section is identifiable at a glance.
2. THE Dashboard SHALL use a font size no smaller than 14px for all body text and task descriptions to ensure readability.
3. THE Dashboard SHALL provide color contrast between text and its immediate background that meets the WCAG 2.1 AA minimum ratio of 4.5:1 for normal text and 3:1 for large text (18px+ or 14px+ bold).
4. THE Dashboard SHALL present interactive controls (buttons, inputs) with a visible focus indicator (e.g., outline or highlight) that meets WCAG 2.1 AA requirements (minimum 3:1 contrast ratio against adjacent colors) to support keyboard navigation.
