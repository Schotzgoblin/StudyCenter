# Testing Best Practices Specification
**Universal Study Portal (StudyCenter)**

This document defines the automated end-to-end (E2E) testing framework, testing methodologies, mocking conventions, and browser verification procedures. It establishes the standards for testing both the Web target (via **Playwright**) and the Desktop target (via **Tauri WebDriver / WebdriverIO**).

---

## 1. Automated Testing Framework Selection

- **Web E2E Target**: **Playwright** is the official standard. It offers native cross-browser execution (Chromium, Firefox, WebKit/Safari), built-in auto-waiting, and superior debugging tools compared to Puppeteer.
- **Desktop E2E Target**: **Tauri WebDriver** (leveraging WebdriverIO and the Selenium-based Microsoft WebDriver or ChromeDriver) is used to automate and inspect components inside the compiled desktop application window.

---

## 2. Resilient E2E Locators & Auto-Waiting

To eliminate "flaky tests" (tests that fail randomly due to network delays or loading states), developers must follow these principles:

### A. User-Facing Locators (Do Not Use Brittle Selectors)
Never locate elements using highly specific CSS classes or raw database IDs (which change on compilation).
* **Incorrect**: `await page.click('.glass-card > div:nth-child(2) > button')`
* **Correct (Accessibility-First)**: Locate elements by their role, labels, or test IDs.
  ```typescript
  // Find by ARIA role and label
  await page.getByRole('button', { name: 'Submit Exam' }).click();
  
  // Find by placeholder text
  await page.getByPlaceholder('Search JKU Study Subject...').fill('Hands-on AI II');
  
  // Find by custom test ID (fallback for complex interactive icons)
  await page.getByTestId('mode-card-training').click();
  ```

### B. Leverage Native Auto-Waiting (No Hardcoded Sleeping)
Never use manual sleep commands (e.g., `setTimeout` or `await page.waitForTimeout(1000)`).
* Playwright automatically waits for elements to be **Visible, Attached, Stable, and Actionable** before executing clicks or fills.
* For custom loading animations, use state assertions:
  ```typescript
  // Wait for processing spinner to disappear
  await expect(page.getByTestId('ingest-loading-spinner')).toBeHidden({ timeout: 10000 });
  ```

---

## 3. Mocking & State Injection Strategies

To run tests in isolation without polluting the production database or relying on active internet connections, we mock states.

### A. Pre-Seeding LocalStorage (Web)
For testing the **Active Recall Training** state persistence and resume features, inject the queue directly into the browser context:

```typescript
test('should resume active training session from cached localStorage state', async ({ page }) => {
  // 1. Load blank page to initialize origin
  await page.goto('/');
  
  // 2. Evaluate script to inject mock training queue
  await page.evaluate(() => {
    const mockState = {
      queue: [{ qId: 'custom_01', firstAttempt: true }, { qId: 'custom_02', firstAttempt: false }],
      currentIndex: 0,
      answers: {},
      firstAttemptCorrect: {},
      answeredCorrectlyCount: 0,
      isQuestionAnswered: false,
      currentAnswer: null
    };
    localStorage.setItem('jku_ai2_training_state_original', JSON.stringify(mockState));
    localStorage.setItem('jku_ai2_active_pool', 'original');
  });

  // 3. Reload and trigger transition
  await page.goto('/subject/jku-ai-2');
  
  // 4. Assert that training mode is active and displays the queued question
  await expect(page.getByText('Training Mode')).toBeVisible();
});
```

### B. Mocking Supabase API Routes (Network Stubbing)
E2E tests should not make real database writes. We intercept and mock Supabase API calls:

```typescript
test('should display validation error if JSON mass-import fails API validation', async ({ page }) => {
  // Intercept POST requests to the Supabase Edge Function
  await page.route('**/functions/v1/parse-exam-pdf', async (route) => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Malformed JSON schema detected at Index 2' })
    });
  });

  // Trigger PDF upload action
  await page.setInputFiles('input[type="file"]', 'test_exam.pdf');

  // Assert error message is rendered
  await expect(page.getByText('Malformed JSON schema detected')).toBeVisible();
});
```

---

## 4. UI & Console Log Assertions

Tests must assert visual outcomes and actively listen for console errors.

### A. Strict Javascript Console Auditing
Any unhandled exceptions or syntax warnings must fail the test immediately.
```typescript
test.beforeEach(({ page }) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      throw new Error(`Javascript error caught in browser console: "${msg.text()}"`);
    }
  });
});
```

### B. Visual Regression & Responsiveness Tests
Verify that elements scale properly across mobile viewports:
```typescript
test('header titles should scale and hide subtitle on mobile screens', async ({ page }) => {
  // Set viewport to a narrow mobile device (iPhone SE)
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/subject/jku-ai-2');

  // Assert that subtitle is hidden
  await expect(page.locator('.header-left p')).toBeHidden();
  
  // Assert that timer badge is compact but remains visible
  await expect(page.locator('#timerBadge')).toBeVisible();
});
```

### C. Keyboard Shortcuts Interaction Verification
Because the simulator is highly keyboard-driven (e.g., using `1-4` to select options, `ArrowRight`/`ArrowLeft` to navigate, `Spacebar` to advance), we must automate keyboard testing:
```typescript
test('should select options and navigate questions via keyboard shortcuts', async ({ page }) => {
  await page.goto('/subject/jku-ai-2/simulator');
  
  // Press '1' to select Option A
  await page.keyboard.press('1');
  await expect(page.locator('.option-item').first()).toHaveClass(/selected/);
  
  // Press 'Spacebar' to submit answer in Training Mode
  await page.keyboard.press('Space');
  
  // Press 'ArrowRight' to navigate to next question
  await page.keyboard.press('ArrowRight');
  
  // Verify next question is active
  await expect(page.locator('#question-number-badge')).toContainText('Question 2');
});
```

---

## 5. Automated Debugging & Tracing

When running E2E tests in headless mode in a CI environment, debugging is enabled by capturing traces on failure.

### Configuration (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: 'html',
  use: {
    // Collect trace files for failed tests to review execution timeline
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
```
- **Trace Files**: Capture a full timeline zip file containing snapshots of the DOM, network calls, console logs, and action timings for post-mortem debugging.
