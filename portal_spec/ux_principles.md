# UX Principles Specification
**Universal Study Portal (StudyCenter)**

This document establishes the user experience (UX) guidelines for the platform. It focuses primarily on **The Principle of Least Clicks**—a design paradigm dedicated to minimizing user friction, reducing steps, and facilitating immediate engagement with study materials.

---

## 1. Onboarding & Access Flow (Zero-Friction Practice)

The platform must allow students to begin testing their knowledge with the absolute minimum number of interactions.

```
       [Guest User Lands] ────(1 Click: Select Subject)────> [Subject Dashboard]
                                                                    │
                                                           (1 Click: Start Exam)
                                                                    │
                                                                    ▼
                                                            [Active Exam Mode]
                                                         (Total: 2 clicks to test)
```

- **Anonymous Access**: Guest users must be allowed to practice and study immediately. Creating an account or logging in **must never** be required to access public subjects, practice pools, or local study results.
- **Onboarding Caching**: A guest student's progress and custom decks are saved to `localStorage` locally. If they decide to create an account later, the system detects this local cache and prompts: *"Do you want to sync your guest progress to your new account?"*
- **No Blockers**: We do not show pop-ups or full-screen overlays asking users to register while they are in the middle of a study session.

---

## 2. Layout Heuristics (Reducing Steps)

To reduce navigation latency, pages are structured to display contextual actions in place.

- **Unified Subject Hub**: The Subject Dashboard (`/subject/:id`) serves as a single cockpit. The student can select a deck, view their progress percentage, check the curriculum list, and launch any mode from a single page without navigating submenus.
- **Tabbed Layouts over Route Transitions**: Modals and menus (such as the Ingestion Portal's JSON Editor vs. Drag-and-Drop Uploader) use tabbed structures instead of separate pages, maintaining context and preventing reloading cycles.
- **Progressive Disclosure**: Detailed configuration options (e.g., custom questions, uploader profiles, or detailed statistics) are hidden behind small accordion controls or disclosure buttons, keeping the main interface clean.

---

## 3. Automation Helpers & Smart Defaults

The system proactively manages data entry and state changes in the background.

- **Immediate Selection Save**: In both Exam and Training modes, selecting an option automatically saves the answer. The student does not need to click a secondary "Confirm Answer" or "Lock In" button.
- **Smart Deck Memory**: The dashboard remembers the student's active deck. If the user was studying the "Advanced Pool" in their last session, the portal defaults to this deck on reload.
- **Auto-Resume**: If the browser tab is closed during Training Mode, reloading the page automatically restores the training session and active question index.
- **Input Focus Defaults**: When a modal opens (e.g., the Add Question modal or Login form), the browser automatically focuses the first input field, allowing the user to begin typing immediately without clicking.

---

## 4. Keyboard Navigation Hotkeys (Blazing Fast Runs)

To enable power-studying, students can navigate the entire Simulator Workspace and multiplayer lobbies using only their keyboard.

| Hotkey | Action | Context |
| :--- | :--- | :--- |
| **`1` / `2` / `3` / `4`** | Select Option A / B / C / D | Simulator Workspace |
| **`Left Arrow` (`<-`)** | Navigate to Previous Question | Simulator Workspace |
| **`Right Arrow` (`->`)** | Navigate to Next Question | Simulator Workspace |
| **`Spacebar`** | Trigger `Continue` / `Next Question` / `Retry` | Simulator Workspace (Training Mode) |
| **`Enter`** | Submit Exam / Confirm Modal | Simulator (Active Exam / Modals) |
| **`Escape` (`Esc`)** | Close active Modal / Exit Simulator | Universal (Modals & Simulators) |

### Hotkey Helper UI
A small, dim helper hint card (e.g., showing `[1-4] to select, [<- / ->] to move`) is displayed at the bottom of the question card on desktop viewports to guide users on hotkey options.
