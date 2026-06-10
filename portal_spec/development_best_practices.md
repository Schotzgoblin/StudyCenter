# Development Best Practices & Security Guidelines
**Universal Study Portal (StudyCenter)**

This document establishes the security guidelines, offline sync mechanics, AI scoring algorithms, and testing standards for developers building the platform.

---

## 1. Client-Side Security & Ingestion Safety

Because this is a crowdsourced platform where students can upload custom questions, we must enforce strict security boundaries to prevent Cross-Site Scripting (XSS) and API abuses.

### A. XSS Prevention in HTML & LaTeX Rendering
Questions and explanations can render mathematical formulas (via KaTeX) and markdown. We must never render raw user strings directly via `dangerouslySetInnerHTML` without sanitization.
* **Guideline**: All user-contributed text (questions, options, explanations) must pass through a sanitization step using **DOMPurify** before rendering.
* **Sanitization Rule**:
  ```typescript
  import DOMPurify from 'dompurify';

  export function sanitizeContent(rawHtml: string): string {
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['b', 'i', 'code', 'pre', 'span', 'br', 'p'],
      ALLOWED_ATTR: ['class', 'style']
    });
  }
  ```

### B. Client-Side CORS Bypass for BYOK
AI API providers (like OpenAI) restrict direct browser API calls using CORS to protect developers from API key leakage. 
* **Guideline**: To allow free tier users to use their own keys safely, we route requests through a **lightweight CORS proxy serverless function** hosted on our domain.
* **Proxy Flow**:
  1. The client sends the API payload (e.g., PDF text and prompt) plus their own API key (as a header: `Authorization: Bearer <user_key>`) to `https://studycenter.edu/api/ai-proxy`.
  2. Our proxy forwards this payload to the official AI endpoint (e.g., `api.gemini.google.com`).
  3. Our proxy returns the response to the client.
  - *Result*: The key is never logged or stored on our servers, and the browser experiences no CORS blocks.

---

## 2. Offline Caching & Journaled Sync Algorithm

To make the Tauri desktop application fully functional offline, we implement a **Local SQLite Caching and Sync Journaling** architecture.

```
                  [Offline Operations (Desktop)]
                                │
                                ▼
         [Write change to Local SQLite Questions/Progress]
                                │
                                ▼
         [Insert Action details into SQLite sync_journal]
                                │
                       (Internet Returns)
                                │
                                ▼
              [Fetch pending records in sync_journal]
                                │
                                ▼
            [Replay actions to Supabase Cloud via API]
                                │
                                ▼
                 [Clear local sync_journal queue]
```

### A. The Sync Journal Schema
When the desktop app is offline, any modification (answering a question, creating a custom question, deleting a deck) cannot sync immediately. We log these actions locally:
* `sync_journal` SQLite Table:
  - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
  - `action`: TEXT (e.g., `'answer_question'`)
  - `payload`: TEXT (JSON string of the change record)
  - `created_at`: TEXT (ISO Timestamp)

### B. Replay Mechanics
When the app detects a transition from offline to online (`window.onLine = true`):
1. Fetch all records from `sync_journal` ordered by `id ASC`.
2. For each record, execute the synchronization endpoint. The backend handles the **Last-Write-Wins (LWW)** conflict resolution using the following SQL query:
   ```sql
   INSERT INTO public.user_progress (user_id, question_id, is_correct, elapsed_seconds, updated_at)
   VALUES (:user_id, :question_id, :is_correct, :elapsed_seconds, :updated_at)
   ON CONFLICT (user_id, question_id) 
   DO UPDATE SET 
       is_correct = EXCLUDED.is_correct, 
       elapsed_seconds = EXCLUDED.elapsed_seconds, 
       updated_at = EXCLUDED.updated_at
   WHERE EXCLUDED.updated_at > user_progress.updated_at;
   ```
   - **Insert Question**: Send a `POST` request to upload the custom question. Update the local SQLite record ID with the newly returned UUID from Supabase.
3. Once all API calls return successfully, delete the replayed rows from the local `sync_journal`.

---

## 3. AI Study Recommendation Engine (Weakness Heuristic)

To make studying highly efficient, the simulator tracks error rates per subchapter and suggests custom practice decks.

### The Recommendation Heuristic
1. Query the user's progress records (`user_progress`) for the active subject.
2. Group the answers by `subchapter_id` and count:
   - Total attempts ($N_{total}$)
   - Total incorrect attempts ($N_{incorrect}$)
3. Calculate the **Error Ratio** ($R_{error}$) for each subchapter:
   $$R_{error} = \frac{N_{incorrect}}{N_{total}}$$
4. Identify subchapters where $R_{error} \ge 0.40$ and $N_{total} \ge 3$.
5. If no history exists, default to subchapters marked with low coverage on the "Curriculum Wishlist."
6. **Deck Generator**: Dynamically compile a 10-question deck consisting of questions mapped to these weak subchapters.

---

## 4. Internationalization (i18n) & Theme Context Management

Developers must follow these standard React context architectures to implement translation and dark/light modes uniformly.

### A. Translation Hook (`useTranslation`)
Do not hardcode user-facing strings. Use the custom translation context hook:
```typescript
import { createContext, useContext, useState } from 'react';
import translations from '@/config/translations.json';

type Language = 'en' | 'de';
const LanguageContext = createContext<{ lang: Language; setLang: (l: Language) => void } | null>(null);

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used inside LanguageProvider');
  
  const t = (key: string) => {
    const langDict = translations[context.lang] as Record<string, string>;
    return langDict[key] || key; // Fallback to raw key name if missing
  };

  return { t, lang: context.lang, setLang: context.setLang };
}
```

### B. Theme Context (`useTheme`)
Theme toggling uses class list additions. Keep state synchronized with CSS root variables:
```typescript
export function useTheme() {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };
  return { toggleTheme };
}
```

## 5. Testing Protocols & Verification Gates

No pull request can be merged into the `main` branch without passing our test suite.

### A. Unit Testing (Vitest)
Used for stateless functions, utilities, and storage adapters.
* **Mandatory Coverage**: All mathematical helpers (like scoring math, grading percentage calculators) and JSON schemas validators must have 100% test coverage.

### B. End-to-End Testing (Playwright)
Simulates actual user behavior in headless browsers.
* **Simulator Flow**: Automate loading a subject, entering Exam Mode, selecting options, waiting for the timer, clicking submit, and checking that JKU grade boundaries are calculated correctly.
* **LocalStorage Mocking**: E2E tests must pre-load localStorage with mock training queues to verify that the auto-resume training mode executes without crashes.

---

## 6. AI Ingestion Engine & Prompt Engineering Guidelines

The Edge Function handles raw uploaded text dynamically based on whether it is an `exam` (OCR extraction) or `notes` (conceptual synthesis). Developers must use the following prompts and configurations.

### A. Document Segmentation & Chunking
When uploading large summaries, notes, or full lecture slides:
* Split the extracted text into semantic chunks of roughly **4,000 to 6,000 characters** (approx. 3-4 slides or 1 page of LaTeX).
* Feed chunks to the API sequentially or in parallel, ensuring that headers/contexts are preserved in each chunk.

### B. Prompt Template: `documentType === 'exam'`
```text
You are an expert exam parser. Your job is to extract multiple-choice questions from the provided text.
Return a JSON array of questions, where each object strictly matches this schema:
{
  "unit_id": integer (1-6 based on course schedule),
  "subchapter_id": integer,
  "question_text": "extracted question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": integer (0-3),
  "explanation": "A concise conceptual explanation"
}
If a question lacks options in the text, generate 3 highly plausible academic distractors based on the slides.
Formatting Rule: Any mathematical expressions, variables, formulas, or bounds must be formatted in KaTeX math notation enclosed in double dollar signs: $$...$$.
```

### C. Prompt Template: `documentType === 'notes'`
```text
You are an expert educational architect. Your job is to analyze the provided study notes, masterplans, or summaries and synthesize challenging active-recall multiple-choice questions.
Focus on extracting:
1. Core definitions and conceptual boundaries.
2. Mathematical formulas, input/output dimensions, and hyperparameter limits (e.g. what happens when alpha -> 0).
3. Critical exceptions, caveats, and footnotes.

Synthesize a JSON array of questions matching this schema:
{
  "unit_id": integer,
  "subchapter_id": integer,
  "question_text": "Challenging question testing active recall of a core concept",
  "options": [
    "Correct answer based on the notes",
    "Highly plausible distractor reflecting a common student misconception",
    "Plausible distractor swapping details or parameters",
    "Plausible distractor showing inverse/incorrect limits behavior"
  ],
  "correct_index": integer (0-3),
  "explanation": "Detailed explanation referencing the notes, stating why the distractors are incorrect"
}
Formatting Rule: All mathematical expressions, variables, formulas, or bounds must be formatted in KaTeX math notation enclosed in double dollar signs: $$...$$.
```
