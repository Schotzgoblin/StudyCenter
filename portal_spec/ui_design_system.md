# UI Design System Specification
**Universal Study Portal (StudyCenter)**

This document establishes the official visual design guidelines, color variables, border rounding tokens, typography hierarchies, and component interaction states. It aligns with the **Obsidian Canvas** premium visual strategy, prioritizing custom layouts, glassmorphic elements, and dark zinc aesthetics over generic dark-blue templates.

---

## 1. Color Palette (Obsidian Canvas & Luminous Accents)

We use CSS variables with HSL values to define colors. The application uses a rich dark void theme by default and dynamically switches to a clean gallery-light theme when the `.light` class is toggled.

```css
:root {
    /* --- DARK THEME (Default / Obsidian Canvas) --- */
    --background: 240 10% 3.9%;       /* #09090b (Zinc Black) */
    --foreground: 0 0% 98%;           /* #fafafa (Soft white) */
    
    --card: 240 10% 5.9%;             /* #111115 (Slightly lighter dark zinc) */
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    
    /* Luminous Gradients & Accents */
    --primary: 262.1 83.3% 57.8%;     /* #8B5CF6 (Premium Violet) */
    --primary-foreground: 0 0% 98%;
    --secondary: 238.9 76.5% 59%;     /* #6366F1 (Iris Blue) */
    --secondary-foreground: 0 0% 98%;
    
    --muted: 240 3.7% 15.9%;          /* #27272A (Zinc Gray) */
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    
    --success: 156.2 71.6% 41.6%;     /* #10B981 (Emerald Green) */
    --success-bg: 156 71% 8%;
    --error: 0 84.2% 60.2%;           /* #EF4444 (Coral Red) */
    --error-bg: 0 84% 8%;
    
    --border: 240 3.7% 15.9%;         /* #27272A */
    --input: 240 3.7% 15.9%;
    --ring: 262.1 83.3% 57.8%;
}

.light {
    /* --- LIGHT THEME (Gallery Light Mode) --- */
    --background: 240 5% 96%;         /* #f4f4f5 (Soft Zinc White) */
    --foreground: 240 10% 3.9%;       /* #09090b (Zinc Black) */
    
    --card: 0 0% 100%;                /* #ffffff (Pure White Cards) */
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    
    /* Contrast-Optimized Violet Gradients */
    --primary: 262.1 83.3% 57.8%;     /* #8B5CF6 (Violet remains vibrant) */
    --primary-foreground: 0 0% 100%;
    --secondary: 238.9 76.5% 59%;     /* #6366F1 (Iris Blue) */
    --secondary-foreground: 0 0% 100%;
    
    --muted: 240 4.8% 95.9%;          /* #f4f4f5 (Light gray) */
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    
    --success: 142.1 76.2% 36.3%;     /* #16A34A (Forest green for light mode contrast) */
    --success-bg: 143 85% 96%;
    --error: 346.8 77.2% 49.8%;       /* #DC2626 (Stronger red contrast) */
    --error-bg: 347 100% 97%;
    
    --border: 240 5.9% 90%;           /* #e4e4e7 (Zinc-200) */
    --input: 240 5.9% 90%;
    --ring: 262.1 83.3% 57.8%;
}
```

---

## 2. Border Roundness (Radius Tokens)

We enforce four strict rounding tokens for a sleek, modern, softened appearance:

*   `--radius-sm`: **`6px`** - Used for small elements: badges, tags, checkboxes.
*   `--radius-md`: **`12px`** (Default `--radius`) - Used for form inputs, navigation links, buttons, and secondary cards.
*   `--radius-lg`: **`16px`** - Used for primary container cards, dashboard hubs, search docks, and modals.
*   `--radius-full`: **`9999px`** - Used for circular badges, pill tags, and floating nav docks.

---

## 3. Typography Scale

We utilize custom premium typography to establish an editorial feel:
- **Display & Headings**: `Space Grotesk` (Geometric, wide, bold, tech-forward).
- **Body & Controls**: `Inter` (Sleek, highly readable sans-serif).
- **Math & Code**: `JetBrains Mono` (High-contrast monospaced).

### Font Sizes & Heights
All font sizes are 1-indexed to rems based on a `16px` base browser root.

| Token | Size (rem) | Size (px) | Line Height | Font Weight | Usage |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`h1` (Hero)** | `2.5rem` | `40px` | `1.1` | `700` (Bold) | Landing page title |
| **`h2` (Section)** | `1.75rem` | `28px` | `1.2` | `600` (SemiBold) | Dashboard & Card headers |
| **`h3` (Card)** | `1.25rem` | `20px` | `1.3` | `600` (SemiBold) | Question title, Modal title |
| **`body-lg`** | `1.0625rem` | `17px` | `1.5` | `400` (Regular) | Question text, explanation description |
| **`body-md`** | `0.9375rem` | `15px` | `1.5` | `400` (Regular) | Option labels, general body text |
| **`caption`** | `0.8125rem` | `13px` | `1.4` | `500` (Medium) | Subtitle text, info badges |
| **`code`** | `0.875rem` | `14px` | `1.5` | `400` (Regular) | Monospaced formulas, JSON syntax |

---

## 4. Component Interaction States & Layout Rules

### A. The "No-Line" Rule
To keep layouts elegant and clean, **do not use solid 1px borders to separate content blocks or list items.** Define boundaries solely through background color shifts (e.g., placing a `--card` element over the `--background` canvas) or via generous negative space (whitespace). 
- In **Dark Mode**, if a border is required for accessibility, use `var(--border)` at 20% opacity.
- In **Light Mode**, use a very light shadow (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`) or a subtle zinc border (`#E4E4E7`).

### B. Glassmorphism
Modals, dropdown selectors, and the top floating dock must use a backdrop filter blur of `24px` combined with a semi-transparent background:
- **Dark Mode**: `rgba(15, 15, 20, 0.7)` with a subtle stroke (`1px rgba(255, 255, 255, 0.06)`).
- **Light Mode**: `rgba(255, 255, 255, 0.75)` with a subtle light stroke (`1px rgba(0, 0, 0, 0.04)`).

### C. Buttons (`.btn`)
All buttons have a transition of `150ms ease-in-out` on colors and borders.
- **Primary Button**:
  - Background is a linear gradient from `--primary` (#8B5CF6) to `--secondary` (#6366F1), text `#ffffff`.
  - *Hover*: Scales up slightly (`scale(1.02)`) with a glowing primary shadow.
  - *Active*: Scales down slightly (`scale(0.98)`).
- **Secondary Button**:
  - Dark Mode: Background `--card`, border `1px solid var(--border)`, text `--foreground`.
  - Light Mode: Background `var(--card)`, border `1px solid var(--border)`, text `--foreground`.
  - *Hover*: Background opacity shifts (e.g., `rgba(255, 255, 255, 0.08)` in dark mode, or `rgba(0, 0, 0, 0.02)` in light mode).
- **Outline Button**:
  - Background transparent, border `1px solid rgba(255,255,255,0.08)` (dark) or `rgba(0,0,0,0.08)` (light), text `--foreground`.

### D. Form Inputs (`input`, `textarea`, `select`)
- **Default State**: Background `var(--card)`, border `none` (dark) or `1px solid var(--border)` (light), text `--foreground`, padding `10px 14px`.
- **Focus State**: Border color shifts to `var(--primary)`, displays outline-shadow: `box-shadow: 0 0 0 2px var(--ring)`.
- **iOS Zoom Protection**: To prevent iOS from auto-zooming, all inputs, selects, and textareas must be set to `font-size: 16px !important` on viewports $\le 640\text{px}$.

### E. Radio Option Items (`.option-item`)
- **Unselected**: Background `var(--card)` with a subtle `1px` border of `var(--border)`.
- **Hover**: Background `rgba(139, 92, 246, 0.04)` (violet tint) with a border of `var(--primary)` at 40% opacity.
- **Selected**: Background `rgba(139, 92, 246, 0.08)` with a `1px` solid border of `var(--primary)`.
- **Correct (Answered)**: Background `var(--success-bg)` with a solid border of `var(--success)`.
- **Incorrect (Answered)**: Background `var(--error-bg)` with a solid border of `var(--error)`.
