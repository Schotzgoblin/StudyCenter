# Git & Contribution Guidelines
**Universal Study Portal (StudyCenter)**

This document establishes the Git branching workflow, commit rules, pull request processes, and open-source contribution guidelines for developers collaborating on the Universal Study Portal.

---

## 1. Branching Model: Trunk-Based Development

To keep integration simple and avoid large merge conflicts, this project uses **Trunk-Based Development** with short-lived feature branches.

```
       [Main Branch (Production)] ──────────────────────────────────────────────
                   │                                          ▲
                   │ (Branch off for hotfix/feature)          │ (PR merge)
                   ▼                                          │
       [feature/lobby-realtime] ───[commit]───[commit]────────┘
       (Max lifespan: 3 days)
```

### Core Rules
- **The Main Branch**: `main` is the primary source of truth. It represents the production-ready code deployed on Vercel. Direct pushes to `main` are restricted.
- **Short-Lived Feature Branches**: All development occurs on branches created off `main`. Feature branches must not live longer than **3 days**. If a feature takes longer, it must be broken down into smaller PRs merged behind feature flags.
- **Naming Conventions**:
  - Features: `feature/short-description` (e.g., `feature/byok-storage-adapter`)
  - Bug fixes: `bugfix/short-description` (e.g., `bugfix/ios-modal-scroll`)
  - Documentation: `docs/short-description` (e.g., `docs/add-diagrams`)

---

## 2. Commit Message Convention (Conventional Commits)

Commit messages must be clear and structured to allow automated versioning and changelog generation. We follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Approved Types
- `feat`: A new feature (e.g., `feat(lobby): add realtime presence updates`)
- `fix`: A bug fix (e.g., `fix(simulator): correct LWW sync timestamp merge`)
- `docs`: Documentation changes (e.g., `docs(readme): add docker setup instructions`)
- `style`: Changes that do not affect the meaning of the code (formatting, white-space, semicolon additions)
- `refactor`: A code change that neither fixes a bug nor adds a feature (e.g., `refactor(auth): simplify supabase client initialization`)
- `test`: Adding missing tests or correcting existing tests (e.g., `test(sync): add sqlite journal replay mock test`)
- `chore`: Changes to the build process, packages, or auxiliary tools (e.g., `chore: upgrade tauri bundler v2`)

---

## 3. Open-Source Contribution Workflow

We welcome contributions from students and external developers. The workflow follows standard GitHub fork mechanics:

### Step 1: Fork and Clone
1. Fork the official repository to your personal GitHub account.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/studycenter.git
   cd studycenter
   ```
3. Set up the upstream remote to stay synced with official updates:
   ```bash
   git remote add upstream https://github.com/official-repo/studycenter.git
   ```

### Step 2: Feature Development
1. Keep your local `main` branch synced with upstream:
   ```bash
   git checkout main
   git pull upstream main
   ```
2. Create your feature branch:
   ```bash
   git checkout -b feature/my-cool-feature
   ```
3. Write clean, modular code following the project guidelines. Add unit tests for any new helper functions.

---

## 4. Pull Request (PR) & Code Review Process

To protect code quality, every PR must pass automated testing gates before merging.

### PR Requirements
- **PR Description Template**: Every PR must fill out a checklist:
  - **Summary**: Describe the changes and why they are needed.
  - **Related Issue**: Reference the issue ticket (e.g., `Closes #142`).
  - **Testing Done**: List the manual or automated tests run to verify correctness.
  - **Breaking Changes**: Mark if the change alters the database schema or current localStorage keys.

### CI/CD Automated Verification Gates
Upon opening a PR, the GitHub Actions CI pipeline runs:
1. **Linter Check**: Runs `npm run lint` (ESLint) to enforce formatting rules.
2. **Build Test**: Runs `npm run build` and `npm run tauri:build` to verify successful compilation for both Web and Desktop targets.
3. **Unit Tests**: Runs `npm run test` (Vitest) to check logic assertions.
4. **End-to-End Tests**: Runs headless browser automation tests (Playwright) to verify simulator flows.

---

## 5. Feature Flag Management

If a complex feature (like the real-time study lobbies) is in progress but not fully complete, it must be merged behind a **Feature Flag** to keep the `main` branch releasable.

### Implementation Strategy
We use simple configuration files to manage features:

```typescript
// config/features.ts
export const FEATURE_FLAGS = {
  REALTIME_LOBBIES: process.env.NEXT_PUBLIC_ENABLE_LOBBIES === 'true',
  AI_OCR_IMPORT: true,
  LOCAL_OLLAMA: isTauri(), // Only enable Ollama connection inside desktop app
};
```

### UI Integration
```tsx
import { FEATURE_FLAGS } from '@/config/features';

export function HomeMenu() {
  return (
    <div className="menu-grid">
      <button onClick={startExam}>Exam Mode</button>
      <button onClick={startTraining}>Training Mode</button>
      
      {FEATURE_FLAGS.REALTIME_LOBBIES && (
        <button onClick={openLobbyMenu}>Live Study Lobby</button>
      )}
    </div>
  );
}
```
Using this approach, developers can merge incomplete features into `main` without exposing unstable UI to production users.
