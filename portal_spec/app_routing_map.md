# Application Routing & Backend Call Map
**Universal Study Portal (StudyCenter)**

This document defines the application's page routes, the UI components rendered on each route, the modal transition flows, and the specific database and API calls invoked by each page.

---

## Route & Transition Matrix

```
                          ┌──────────────┐
                          │  Home Page   │ (/)
                          └──────┬───────┘
                                 │
                                 ├── (Click Subject) ──> ┌───────────────────┐
                                 │                       │ Subject Dashboard │ (/subject/:id)
                                 │                       └─────────┬─────────┘
                                 │                                 │
                                 │            ┌────────────────────┼────────────────────┐
                                 │            ▼                    ▼                    ▼
                                 │      ┌───────────┐        ┌───────────┐        ┌───────────┐
                                 │      │ Simulator │        │  Ingest   │        │   Lobby   │
                                 │      └───────────┘        └───────────┘        └───────────┘
                                 │   (/subject/:id/sim)  (/subject/:id/ingest) (/subject/:id/lobby/:code)
                                 │
                                 └── (Click Profile) ──> ┌───────────────────┐
                                                         │ Profile Dashboard │ (/profile)
                                                         └───────────────────┘
```

---

## 1. Home Page (`/`)

The entry page. Renders the main search portal and available subject lists.

### Components Rendered
- `Header`: Contains logo, theme toggle (light/dark), language selector (EN/DE), and `LoginButton`.
- `Hero`: Prominent marketing text and active platform stats.
- `SearchInput`: Large input field filtering the subject grid.
- `SubjectGrid`: Dynamic grid of `SubjectCard` items.
- `Footer`: Clean footer with donation link ("Buy Me a Coffee").

### Modal Triggers
- `M1.1` (Login): Triggered by clicking "Log In" in `Header`.
- `M1.2` (Sign Up): Triggered by clicking "Create an Account" in `M1.1`.
- `M1.3` (Reset Password): Triggered by clicking "Forgot password?" in `M1.1`.
- `M1.4` (Create Subject): Triggered by clicking "Create New Subject" in `SubjectGrid` (forces `M1.1` first if guest).

### Backend / Database Calls
- **On Page Load**:
  - `SELECT * FROM subjects ORDER BY name ASC;`
- **Authentication Actions**:
  - **Login**: `supabase.auth.signInWithPassword({ email, password })`
  - **Sign Up**: `supabase.auth.signUp({ email, password, options: { data: { username } } })`
  - **Password Reset**: `supabase.auth.resetPasswordForEmail(email)`
- **Create Subject (`M1.4` Submit)**:
  - `INSERT INTO subjects (name, university, curriculum_skeleton) VALUES ($1, $2, $3) RETURNING id;`

---

## 2. Subject Dashboard (`/subject/:id`)

The study hub for a specific course.

### Components Rendered
- `DashboardHeader`: Back arrow, Subject Title, and uploader upload action.
- `DeckSelector`: Dropdown selector to choose the active question pool (Curated Global vs. Private Decks).
- `ProgressCard`: Displays progress bar and percentages.
- `ModeGrid`: Action cards: `[Training Mode]`, `[Exam Mode]`, `[Live Study Lobby]`.
- `CurriculumChecklist`: Accordion list showing units and subchapters with question counts.
- `BountiesCard`: Displays units needing question additions.

### Modal Triggers
- `M2.1` (Add Custom Question): Triggered by "Add Custom Question" button in header.
- `M2.2` (Create Deck): Triggered by "Create New Deck" option in `DeckSelector`.
- `M2.3` (Ingest Trigger): Triggered by "Upload Materials" inside the `BountiesCard`.

### Backend / Database Calls
- **On Page Load**:
  - `SELECT * FROM subjects WHERE id = :id;`
  - `SELECT * FROM decks WHERE subject_id = :id AND (is_private = false OR user_id = auth.uid());`
  - `SELECT * FROM user_progress WHERE user_id = auth.uid() AND subject_id = :id;`
- **Add Question (`M2.1` Submit)**:
  - `INSERT INTO questions (subject_id, unit_id, subchapter_id, question_text, options, correct_index, explanation, is_global, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, false, auth.uid()) RETURNING id;`
  - `INSERT INTO deck_questions (deck_id, question_id) VALUES (:deck_id, :new_question_id);`
- **Create Deck (`M2.2` Submit)**:
  - `INSERT INTO decks (subject_id, name, is_private, user_id) VALUES ($1, $2, $3, auth.uid());`

---

## 3. Practice / Simulator Workspace (`/subject/:id/simulator`)

The distraction-free test interface.

### Components Rendered
- `SimulatorHeader`: Exit button, active mode label, and timer/progress counts.
- `QuestionCard`: Display of active question text and choices.
- `ControlBtns`: Back, Next, and Continue buttons.
- `QuestionNavSidebar`: Quick-jump grid of question buttons and Submit button.

### Modal Triggers
- `M3.1` (Submit Exam): Triggered by "Submit Exam" button in `QuestionNavSidebar` (Exam Mode only).
- `M3.2` (Time Expired): Triggered automatically when timer reaches `00:00`.
- `M3.3` (Exit Warning): Triggered by clicking "Exit" in `SimulatorHeader`.

### Backend / Database Calls
- **On Page Load**:
  - `SELECT q.* FROM questions q JOIN deck_questions dq ON q.id = dq.question_id WHERE dq.deck_id = :active_deck_id;`
- **On Option Selection (Training Mode)**:
  - **Save Attempt**:
    - `INSERT INTO user_progress (user_id, question_id, is_correct, elapsed_seconds) VALUES (auth.uid(), :question_id, :is_correct, :elapsed) ON CONFLICT (user_id, question_id) DO UPDATE SET is_correct = EXCLUDED.is_correct, updated_at = NOW();`
- **On Exam Submit (`M3.1` or `M3.2` Trigger)**:
  - **Batch Save Progress**:
    - `INSERT INTO user_progress (user_id, question_id, is_correct, elapsed_seconds) VALUES ...` (Replicated as bulk operation).

---

## 4. Multiplayer Lobby (`/subject/:id/lobby/:code`)

Real-time multi-user quiz workspace.

### Components Rendered
- `LobbyHeader`: Code displays, connection status, and exit button.
- `WaitingRoom`: Participant lists and host start controls.
- `QuizWorkspace`: Active synchronized question view.
- `Leaderboard`: Live rank displays.

### Modal Triggers
- `M4.1` (Join Lobby): Triggered by "Join Lobby" button in dashboard.
- `M4.2` (Leave Lobby): Triggered by "Leave Room" button in header.

### Backend / Database Calls
- **On Page Load (WebSocket Connection)**:
  - Connect to Supabase Realtime Socket:
    ```typescript
    const channel = supabase.channel(`lobbies:${code}`, {
      config: { presence: { key: auth.uid() } }
    });
    ```
- **Lobby Events**:
  - **Join**: `channel.track({ username, score: 0 })`
  - **Host Starts Quiz**: `channel.send({ type: 'broadcast', event: 'start', payload: { questionIds } })`
  - **User Answers**: `channel.send({ type: 'broadcast', event: 'submit_answer', payload: { userId, isCorrect, timeTaken } })`

---

## 5. Ingestion Portal (`/subject/:id/ingest`)

Converts raw slides, exam PDFs, and study summaries/masterplans to structured JSON questions.

### Components Rendered
- `UploadDropzone`: Upload container supporting PDF, DOCX, LaTeX (.tex), text summaries (.txt), and image uploads.
- `ProcessingIndicator`: Loading stepper.
- `JSONEditor`: Manual paste area.
- `ValidationLogs`: Terminal log showing schema syntax validations.

### Modal Triggers
- `M5.1` (Deduplication Check): Triggered when AI parses the document and returns duplicate objects.
- `M5.2` (Import Success): Triggered when database writes complete.

### Backend / Database Calls
- **Upload File**:
  - `supabase.storage.from('study_documents').upload(filePath, file)`
- **AI Processing Call**:
  - `fetch('https://studycenter.edu/api/parse-study-document', { method: 'POST', body: JSON.stringify({ filePath, documentType }) })` (Invokes Supabase Edge Function with document type: 'exam' or 'notes').
- **Deduplication Check**:
  - `SELECT * FROM similarity_search(:embedding, :similarity_threshold, :subject_id);` (Calls Postgres pgvector similarity function).
- **Execute Import**:
  - Batch insert to `questions` table and link to user's deck in `deck_questions`.

---

## 6. Moderator Panel (`/admin/moderation`)

Quality control tools for moderators.

### Components Rendered
- `FlaggedQueue`: Downvoted questions queue list.
- `ReputationDirectory`: Banned uploader candidate lists.

### Modal Triggers
- `M6.1` (Edit Question): Mod click "Edit" on a flagged question.
- `M6.2` (Ban Confirmation): Mod click "Ban" uploader.

### Backend / Database Calls
- **On Page Load**:
  - `SELECT * FROM questions WHERE shadow_banned = true OR (is_global = true AND created_by IN (SELECT id FROM profiles WHERE status = 'shadow_banned'));`
- **Approve Question**:
  - `UPDATE questions SET shadow_banned = false WHERE id = :id;`
- **Delete / Ban**:
  - `DELETE FROM questions WHERE id = :id;`
  - `UPDATE profiles SET status = 'shadow_banned' WHERE id = :user_id;`

---

## 7. Profile Dashboard (`/profile`)

Personal stats and preferences manager.

### Components Rendered
- `StatsCard`: Summaries of answers and badge items.
- `BYOKPanel`: Input fields for Gemini / OpenAI developer keys.
- `SyncControlPanel`: Desktop SQLite sync controller.

### Modal Triggers
- `M7.1` (Sync Conflict): Triggered when SQLite timestamps conflict with Cloud database records.

### Backend / Database Calls
- **On Page Load**:
  - `SELECT COUNT(*), SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) FROM user_progress WHERE user_id = auth.uid();`
- **Save API Key**:
  - Saved client-side in LocalStorage only: `localStorage.setItem('byok_keys', JSON.stringify({ gemini, openai }))` (No backend database call).
- **Run Sync**:
  - Read `sync_journal` from SQLite database.
  - Replay inserts, edits, and answers via REST batches to Supabase database.
