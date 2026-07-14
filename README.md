# Bundestagswahl 2025

A single-page web application to explore and compare the official results of the 2025 German federal election based on Open Data from the Bundeswahlleiterin.

## 📋 Permanent Task Specifications (PwC Frontend Challenge)

To ensure this codebase is evaluated as a high-quality Senior Developer submission, the following constraints and requirements from the challenge brief are permanently active:

### 1. User Journey Requirements
* **Electoral Areas:** Search space must cover the "Bundesgebiet" (ID: 99), 16 "Länder" (IDs: 01-16), and all 299 "Wahlkreise" (IDs: 001-299) — totaling 316 distinct areas[cite: 1].
* **Search / Autocomplete:** Accessible search component. Selecting an area displays its results, name, turnout, and party results (absolute & relative)[cite: 1].
* **Side-by-Side Comparison:** Choosing a second area splits the UI into two columns (each with its own diagram)[cite: 1].
* **Comparison View:** Underneath the columns, a single, combined diagram must render to merge and compare both results visually[cite: 1].
* **URL State Shareability:** Page reloads must instantly restore the selected state from the URL[cite: 1].

### 2. Evaluator's Focus Areas ("What We Are Looking For")
* **Separation of Concerns:** Rigid separation between data access (hooks/fetching), domain logic (parsing/math), and presentation (components)[cite: 1].
* **Idiomatic Code:** Production-grade React and TypeScript. Avoid `any` types completely[cite: 1].
* **Component Composition:** Keep code DRY. Ensure the autocomplete search is a reusable, parameterized component rather than duplicated[cite: 1].
* **UX Edge Cases:** Implement robust states for Loading, Error, and Empty states[cite: 1].
* **Accessibility (a11y):** Complete keyboard navigation support for the autocomplete combobox and highly accessible alternatives for the diagrams (e.g., hidden screen-reader accessible tables with the raw data)[cite: 1].
* **Targeted Testing:** Focused, high-value testing. At least 3 robust, meaningful tests (e.g., math parsing validation, autocomplete interactive behavior) rather than shallow coverage chasing[cite: 1].

### 3. Architecture & Technical Constraints
* **Pure Client-Side App:** Absolutely no database, custom backend servers, or API layers. All fetching, processing, and rendering happen on the client[cite: 1].
* **CORS & Fixtures:** To bypass CORS, election data CSV files are committed directly to `src/assets/fixtures/`[cite: 1].
* **URL Sync:** Public URL query parameters must use localized names `gebiet1` and `gebiet2` to preserve domain context, while the backing hooks and filenames use standard English (e.g., `useUrlState.ts`, `ElectionChart.tsx`).

### 4. Genuinely Optional Features (Bonus Kriterien)
* **Wahl-Vergleich (2021):** Prepare the domain data model to track previous (2021) election values as deltas (e.g., +1.2% or -0.5%) in the single-area view[cite: 1].
* **Spalten-Tausch (Column Swap):** Implement a button to swap the selection of Column 1 (`gebiet1`) and Column 2 (`gebiet2`)[cite: 1].

---

## 🛠️ How to Run the Project
* Install dependencies: `npm install`
* Run development server: `npm run dev`
* Execute test suite: `npm run test`
