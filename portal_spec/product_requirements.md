# Product Requirements Document (PRD)
**StudyCenter - Universal Student Study Portal**

This document establishes the project's vision, the academic and cognitive science problems it solves, the target user personas, the completed end-to-end user experience flows, and the final feature scope checklist for the completed application.

---

## 1. Vision & Goals (The "Why")

### The Problem
University students preparing for high-stakes exams face two main obstacles that severely degrade learning efficiency and outcomes:

1. **Syllabus Disorganization & Information Fragmentation**:
   Study materials, lecture slides, summaries, and past exams are scattered across private Discord channels, Google Drives, WhatsApp chats, and local hard drives. Students waste hours locating, compiling, and manually formatting questions instead of actually studying.
2. **Passive Study Habits & The Illusion of Competence**:
   Traditional study workflows rely heavily on reading slides, highlighting text, and reviewing static summary sheets. Cognitive science shows these methods are highly inefficient due to:
   - **The Forgetting Curve**: Without active retrieval, over 70% of new information is forgotten within days.
   - **Familiarity Bias**: Rereading notes creates familiarity, which students mistake for conceptual mastery. When faced with an exam question requiring synthesis, this illusion collapses.

### The Solution: StudyCenter
**StudyCenter** is an open-source, ad-free, community-driven study platform that gamifies university preparation. It allows students to instantly search for their university subjects (e.g., JKU "Hands-on AI II"), study via structured active recall pools, upload lecture notes, slides, and personal LaTeX masterplans to automatically generate interactive practice decks via AI, and host live study battles with classmates.

```
       ┌────────────────────────────────────────────────────────┐
       │            THE STUDYCENTER ACTIVE STUDY LOOP           │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────┐
        │ 1. INGESTION                                         │
        │ Upload notes, LaTeX masterplans, slides, & exams.    │
        │ AI parses text and extracts/synthesizes questions.   │
        └───────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────┐
        │ 2. DEDUPLICATION & MODERATION                        │
        │ pgvector checks similarity. Community votes          │
        │ shadow-ban spam and typos automatically.             │
        └───────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────┐
        │ 3. ACTIVE STUDY & RECALL                             │
        │ Study anonymously. Use Exam/Training modes.          │
        │ Keyboard-driven simulator with instant explanations. │
        └───────────────────────────┬──────────────────────────┘
                                    │
                                    ▼
        ┌──────────────────────────────────────────────────────┐
        │ 4. COLLABORATION & SOCIAL                            │
        │ Host multiplayer study lobbies with classmates.      │
        │ Run real-time leaderboard battles before exams.      │
        └──────────────────────────────────────────────────────┘
```

### Strategic Design Goals
- **The Principle of Least Clicks**: Zero mandatory onboarding barriers. Students should start practicing within two clicks of landing on the site, without needing to register or log in.
- **AI-Driven Ingestion**: Leverage cost-effective AI models (e.g., Gemini 1.5 Flash) to automatically convert raw slides and PDFs into structured questions, eliminating manual database curation.
- **Single-Codebase, Dual-Target**: Run a unified Next.js + Tailwind CSS + Supabase stack, wrapped in Tauri to compile to Windows, macOS, and Linux desktop apps sharing 100% of UI and simulation logic.
- **Offline-First Resilience**: Enable students to study on trains, flights, or in lecture halls without internet access by caching question pools in local SQLite databases and syncing progress when back online.

---

## 2. Core User Personas

### A. The Prep Student (Primary User)
- **Goal**: Pass complex, mathematical, or technical exams (e.g., Machine Learning, Algorithms) with high grades in minimum time.
- **Needs**: Structured question pools, interactive testing environments, clear mathematical explanations (LaTeX formulas), and error-tracking metrics to focus on weaknesses.
- **Pain Points**: Wastes time formatting files; gets bored/distracted reading static slides; lacks immediate feedback on what they don't know.

### B. The Contributor Student
- **Goal**: Share notes and past exams to help classmates study, establishing themselves as collaborative student leaders.
- **Needs**: An effortless, one-click upload pipeline that converts raw files into interactive decks for their peers without manual formatting.
- **Pain Points**: Copying and pasting questions from PDFs into forms takes hours; converting mathematical equations to LaTeX is tedious.

### C. The Course Moderator
- **Goal**: Maintain the accuracy, quality, and formatting of the public question pools.
- **Needs**: Simple tools to edit typos, review flagged items, and manage bad uploaders with minimal clicks.
- **Pain Points**: Swamped by duplicate questions and spam submissions; lacks a self-governing community moderation structure.

---

## 3. The Finished Application Flow (What it Looks Like)

### Phase A: Discovery & Access (Landing Page)
1. **The Interface**: A clean, premium dark-mode interface utilizing a Shadcn-style layout. Prominent features include a global, fuzzy-search bar for courses and a grid of popular courses (e.g., "Hands-on AI II", "Algorithms & Data Structures").
2. **Access Path**: A student types "Hands-on AI" and presses Enter. The dashboard for that course loads immediately.
3. **Onboarding**: No "Sign Up" wall. A guest banner notes: *"Studying as Guest. Progress saved locally. [Sign up to sync across devices]"*. The user is 1 click away from studying.

### Phase B: Active Recall Simulator (The Core Workspace)
1. **Mode Selection**: The student is presented with two main study modes:
   - **Exam Mode**: A simulated testing environment. It dynamically extracts a stratified sample of questions across all course topics (e.g., exactly 5 questions per unit) to ensure comprehensive testing. Includes a 60-minute countdown timer (glowing red in the final 5 minutes) and applies JKU's point deduction system ($+1.0$ for correct, $-0.25$ for incorrect to discourage guessing).
   - **Training Mode**: An untimed spaced repetition queue. It runs through all questions in the active deck.
2. **The Workspace**:
   - The question card occupies the center stage. Math formulas are rendered using KaTeX.
   - Hotkeys enable rapid, keyboard-driven studying (`1-4` to select options, `Spacebar` to submit/advance, `Escape` to pause/exit).
3. **The Learning Loop**:
   - In Training Mode, when the user answers a question, they receive instant visual feedback (green/red borders).
   - A detailed concept explanation card slides open, showing the step-by-step mathematical reasoning.
   - If the user gets the question wrong, it is pushed to the back of the active study queue. The user must answer it correctly on a subsequent pass to remove it from the queue, ensuring 100% mastery.
4. **State Caching**: The current queue state, answer history, and mastery scores are saved to `localStorage` on every interaction. If the browser is refreshed or closed, the session resumes exactly where it left off.

### Phase C: Document & Masterplan Ingestion
1. **The Ingestion Workspace**: A drag-and-drop zone where contributors upload slides, past exams, study summaries, or LaTeX masterplans (`.pdf`, `.docx`, `.tex`, `.txt`, `.png`).
2. **AI Synthesis & Parsing**: The file is processed by a Supabase Edge Function using Gemini 1.5 Flash. The model handles document types dynamically:
   - **Exam Papers**: Extracts raw questions, structures distractors, and formats equations to LaTeX.
   - **Summaries & Masterplans**: Analyzes narrative concepts, formulas, and bounds to synthesize brand new interactive review questions (cloze, conceptual, and mathematical bounds checks).
3. **Interactive Validation Canvas**: The contributor sees a split-screen layout: the original document on the left, and the AI-generated interactive questions on the right. They can make quick edits inline if the AI made a typo.
4. **Duplicate Prevention**: Before publishing, the database runs a cosine similarity check using pgvector embeddings. If a question is $>90\%$ similar to an existing question, the platform flags it: *"Warning: Similar question already exists in Global Pool. Keep private or link to parent?"*
5. **Publishing**: The user clicks "Publish" to add unique questions to the public database.

### Phase D: Community Moderation
1. **Automatic Reputation & Moderation**: Upvotes and downvotes govern the system.
2. **Shadow-Banning**: If a question receives a net vote score of $\le -5$, a PostgreSQL trigger automatically flags it as hidden (`is_shadow_banned = true`). The question is instantly removed from the global pool for other users but remains visible to the uploader, avoiding confrontational spam.
3. **Moderator Portal**: Course moderators can view flagged questions in a queue, edit them, or approve/delete them permanently.

### Phase E: Live Study Lobby (Multiplayer Collaboration)
1. **Lobby Creation**: A student clicks "Host Lobby" on the course dashboard. A 6-digit access code is generated.
2. **Class Joining**: Other students visit the URL or enter the code on their mobile devices to join the lobby.
3. **The Study Battle**: The host launches the game. All participants receive the same questions on their screens simultaneously. They have 30 seconds to answer each question.
4. **Interactive Leaderboard**: After each question, a real-time leaderboard updates, showing player rankings based on speed and accuracy.

### Phase F: Desktop Caching & Offline Synchronization
1. **Tauri Launcher**: The student downloads the desktop application.
2. **Local Caching**: The app automatically fetches the courses and question decks, caching the PostgreSQL structure into a local SQLite database file.
3. **Offline Mode**: When the student goes offline, the app switches its storage adapter to SQLite. All session details, custom questions, and training logs are written locally. Writes are recorded in a `sync_journal` queue table.
4. **Sync Process**: Once internet connection is restored, the client replays the `sync_journal` commands to the Supabase backend. A Last-Write-Wins (LWW) timestamp check merges conflicts, ensuring the cloud and local databases match without overwriting progress.

---

## 4. Completed Feature Scope Checklist

### Phase 1: MVP Core (Currently Completed)
- [x] Web-based simulator workspace.
- [x] Dual study modes: Exam Mode (60-min timer, JKU scoring) and Training Mode (spaced repetition queue).
- [x] Local storage progress caching and session auto-resume.
- [x] User-facing Custom Question Creator and raw JSON mass-import.
- [x] Mobile responsive optimizations (stacked cards, 6-column navigation grid, 2x2 statistics dashboard, and mobile viewport auto-zoom prevention).

### Phase 2: Platform Scale (Next Milestones)
- [ ] Next.js + Tailwind CSS + Supabase (Auth, RLS, Storage) web architecture.
- [ ] Anonymous practicing fallback with progressive sign-up syncing.
- [ ] PDF/Image Ingestion Edge Function (Gemini 1.5 Flash math OCR parser).
- [ ] Semantic deduplication database functions using pgvector.
- [ ] Personal blocking tables (`user_blocks`) and downvote shadow-banning triggers.
- [ ] Translation framework (English primary, German secondary) and light/dark theme context.

### Phase 3: Desktop & Sync (Offline-First)
- [ ] Tauri desktop wrapper integration.
- [ ] SQLite database implementation using Tauri Storage Adapter.
- [ ] SQLite `sync_journal` queue database schema.
- [ ] Timestamp-based LWW (Last-Write-Wins) cloud-caching sync algorithm.

### Phase 4: Social & AI (V2)
- [ ] Supabase Realtime WebSocket multiplayer study lobbies.
- [ ] Real-time lobby leaderboard components.
- [ ] AI-driven Weakness Recommendation Engine.
