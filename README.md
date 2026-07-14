# Bundestagswahl 2025 Results Explorer

A high-performance, single-page web application to explore and compare the official results of the 2025 German federal election (Bundestagswahl 2025) based on Open Data from the Bundeswahlleiterin.

**Live Demo:** [https://bundestagswahl-2025-jsh1.vercel.app/](https://bundestagswahl-2025-jsh1.vercel.app/)

---

## 🛠️ How to Run the Project

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Start Development Server:**
   ```bash
   npm run dev
   ```
3. **Execute Test Suite (Vitest):**
   ```bash
   npm run test
   ```

---

## 💻 Tech Stack & Tooling Choices

- **React & TypeScript:** Standard industry foundation for type-safe component-driven frontends.
- **Vite:** Chosen for its lightning-fast Hot Module Replacement (HMR) and optimized build configuration, facilitating a smooth feedback loop.
- **Tailwind CSS:** Used for rapid utility-first styling to construct a clean, responsive layout without writing verbose CSS.
- **Recharts:** Used for plotting election comparison charts because of its native React component integration, ease of styling, and straightforward responsive layout configurations.
- **Radix / Base UI & Cmdk:** Powers the combobox search input to deliver a highly accessible, keyboard-navigable autocomplete experience out of the box.
- **Vitest & React Testing Library:** Replaced Jest for modern, fast unit and integration testing aligned with Vite's configuration.

---

## 🏗️ Architectural & Technical Decisions

### 1. Data Ingestion & CORS Handling

- **Decision:** Bypassed CORS fetching restrictions by downloading the official CSV files from the Bundeswahlleiterin and placing them in `src/assets/fixtures/` as static assets.
- **Why:** This ensures 100% offline capability, zero latency on initial load, and eliminates runtime dependency on external servers during evaluation.

### 2. Rigid Separation of Concerns

- **Parsing/Domain Layer (`src/domain/`):** Decoupled CSV parsing (`csvParser.ts`) and math routines from the React UI. All data shapes, cleaning, and mathematical operations (e.g. 2-decimal percentage rounding, delta calculations) are fully typed and tested in isolation.
- **Data Hook Layer (`src/hooks/`):** The `useElectionData.ts` hook manages async state (Loading/Error) and transforms raw parsed data into optimized lookup structures.
- **UI Components (`src/components/`):** Pure presentation elements that consume structured models.

### 3. DRY Component Composition

- The search field is implemented as a single, highly reusable `<Autocomplete />` component utilizing Radix UI (via Base UI Popover) and Cmdk. It is rendered twice in `App.tsx` with dynamic option filtering to prevent selecting the same region in both columns.

### 4. Union (CDU/CSU) Consolidation

- **Decision:** Mathematically consolidated CDU and CSU into a single `CDU/CSU` party in the parsing layer.
- **Why:** CDU and CSU do not compete in the same federal states (CSU only in Bavaria, CDU in all other states). Consolidating them presents a mathematically accurate federal comparison and reflects standard German political journalism.

---

## ♿ Accessibility (a11y)

- **Combobox Keyboard Support:** Full screen-reader and keyboard compatibility for searching and selection (using arrows, Enter, Space, Escape, and tab indices).
- **Chart Fallback:** Screen readers will bypass the graphic charts and instead read a visually hidden (`sr-only`) structured HTML table containing the exact Zweitstimmen counts and relative percentages.

---

## ✨ Implemented Optional Features

- **2021 Election Comparison:** Show relative comparison deltas (e.g., `+1.20%` or `-0.50%`) next to current election percentages in the main lists.
- **Column Swap:** An elegant swap button is positioned between the search bars to swap left and right region columns instantly.

---

## ⏳ What I Would Do With More Time / Deliberately Omitted

1. **Visual Theme & Official Branding:** Implement a light/dark mode theme toggle and style the typography/layout to align with the official corporate design of the German Federal Government (Bund-Design System).
2. **Interactive Geomap:** Integrate an interactive SVG map of Germany (divided by Wahlkreise) allowing users to explore and select regions visually by clicking rather than relying solely on autocomplete text search.
3. **Seat Distribution & Coalitions:** Render a Parliament seat distribution chart (Pie-chart or semi-circle) and calculate possible government coalition majorities dynamically.
4. **First Votes (Erststimmen):** Incorporate and display first-vote (direct candidate) results alongside the second-votes (Zweitstimmen) to show direct mandate winners.
5. **Internationalization (i18n):** Add multi-language support (English/German translation toggle) for international audiences.
6. **Data Streaming & Session Memory:**
   - Parse massive election CSV datasets incrementally using chunk streams rather than holding full files in memory.
   - Synchronize selection memory in `localStorage` when loading from empty URLs.
7. **Pre-commit Workflow & DX Improvements:** Setup pre-commit hooks with automated formatting, type checking, linting, and testing to establish a better developer experience (DX) and guarantee commit-level code quality.

---

**Time Spent:** ~8 hours
